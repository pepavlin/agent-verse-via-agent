# Workflow #66 SSH Deployment - Troubleshooting Checklist
**Quick Reference Guide**
**Status:** 102-second SSH connection failure
**Priority:** CRITICAL - Blocks all deployments

---

## Step 1: Verify GitHub Secrets (2 minutes)

- [ ] Go to GitHub repository → Settings → Secrets and variables → Actions
- [ ] Confirm these secrets exist:
  - [ ] `SERVER_HOST` - Should contain hostname or IP (not empty)
  - [ ] `SERVER_USER` - Should contain username (not empty)
  - [ ] `SERVER_SSH_KEY` - Should contain PEM private key (multiple lines)
  - [ ] `SERVER_SSH_PORT` - Optional, should be valid port number if set

**If ANY secret is missing or empty:**
- ❌ **This is 100% the cause of the SSH failure**
- Add/update the missing secret with correct value
- Rerun workflow after updating secrets

---

## Step 2: Test SSH Connectivity Locally (5 minutes)

**If all secrets are configured:**

```bash
# 1. Extract private key from GitHub Secret and save locally
# (Copy the contents of SERVER_SSH_KEY secret)
# Save to: ~/.ssh/workflow_test_key
chmod 600 ~/.ssh/workflow_test_key

# 2. Test SSH connection
ssh -i ~/.ssh/workflow_test_key \
    -p <SERVER_SSH_PORT_VALUE> \
    <SERVER_USER_VALUE>@<SERVER_HOST_VALUE> \
    "echo 'SSH works!'"
```

**Expected output:**
```
SSH works!
```

**Possible failures and solutions:**

| Error | Meaning | Solution |
|-------|---------|----------|
| `Connection timed out` | Server not reachable | Check SERVER_HOST is correct, server is running, network is accessible |
| `Connection refused` | SSH port closed | Verify SERVER_SSH_PORT, check firewall allows inbound SSH |
| `Permission denied (publickey)` | Key doesn't match | Verify SERVER_SSH_KEY public key is in server's ~/.ssh/authorized_keys |
| `Name or service not known` | Hostname invalid | Check SERVER_HOST spelling, verify DNS works |
| `No such file or directory` | Key file missing | Ensure private key was saved correctly to ~/.ssh/workflow_test_key |

---

## Step 3: Verify Server Configuration (5 minutes)

**If local SSH test works**, verify server has required setup:

```bash
# SSH to server
ssh -i ~/.ssh/workflow_test_key <SERVER_USER>@<SERVER_HOST>

# Then run these checks ON THE SERVER:
# 1. Check SSH service is running
systemctl status ssh
systemctl status sshd

# 2. Check authorized_keys permissions
ls -la ~/.ssh/
# authorized_keys should show: -rw------- (600 permissions)
# If not: chmod 600 ~/.ssh/authorized_keys

# 3. Check project directory exists
ls -la /root/Workspace/agent-verse
# Should show: .git directory inside

# 4. Check git remote is configured
cd /root/Workspace/agent-verse
git remote -v
# Should show: origin https://github.com/... (or git@github.com:...)

# 5. Check Docker is installed and running
docker --version
docker compose --version
systemctl status docker
# Docker daemon should be running (active)

# 6. Check disk space
df -h
# Should have at least 10GB free for Docker builds and data

# 7. Exit server
exit
```

**If any of these checks fail:**
- SSH service not running: `systemctl start ssh`
- authorized_keys permission: `chmod 600 ~/.ssh/authorized_keys`
- Project directory missing: Clone/restore project
- Docker not running: `systemctl start docker`
- Disk space low: Free up disk space

---

## Step 4: Test Full Deployment Script (2 minutes)

**If SSH works and server checks pass:**

```bash
# Test the exact deployment script manually
ssh -i ~/.ssh/workflow_test_key <SERVER_USER>@<SERVER_HOST> << 'EOF'
set -e
cd /root/Workspace/agent-verse
echo "Pulling new version..."
git fetch origin main
git reset --hard origin/main
echo "Rebuilding containers..."
docker compose up -d --build
echo "Cleaning old images..."
docker image prune -f
echo "✅ Deployment script completed successfully!"
EOF
```

**Expected timeline:**
- T+0-10s: Change directory, pull code
- T+10-60s: Docker build (varies based on changes)
- T+60-120s: Containers start, PostgreSQL health check
- T+120-180s: Application startup, migrations
- **Total:** 3-5 minutes for full deployment

**If build fails:**
```bash
# View build logs
ssh -i ~/.ssh/workflow_test_key <SERVER_USER>@<SERVER_HOST> \
    "docker compose logs app --tail 100"

ssh -i ~/.ssh/workflow_test_key <SERVER_USER>@<SERVER_HOST> \
    "docker compose logs db --tail 100"
```

---

## Step 5: Identify Root Cause

Based on which step failed, here's the root cause:

### Step 2 Failure (SSH Connection Test Failed)
**Root Cause Options:**
1. ❌ **Misconfigured GitHub Secrets** - Most likely (80%)
   - Fix: Verify/update secrets in GitHub

2. ❌ **Server not accessible** (15%)
   - Fix: Verify SERVER_HOST, check firewall, confirm server is running

3. ❌ **SSH key mismatch** (5%)
   - Fix: Generate new key pair, update secret and server's authorized_keys

### Step 3 Failure (Server Checks Failed)
**Root Cause Options:**
1. ❌ **Project directory missing** (40%)
   - Fix: Clone project to /root/Workspace/agent-verse

2. ❌ **Docker not installed/running** (35%)
   - Fix: Install Docker, start Docker daemon

3. ❌ **SSH not properly configured** (15%)
   - Fix: Update ~/.ssh/authorized_keys, fix permissions

4. ❌ **Low disk space** (10%)
   - Fix: Free up disk space

### Step 4 Failure (Deployment Script Fails)
**Most likely:** ESLint errors in Docker build
- 72 ESLint violations still present in codebase
- Docker build runs npm build which includes type checking
- Fix: Resolve ESLint errors before next deployment

---

## Quick Diagnosis Flowchart

```
Workflow #66 Failed (102s timeout)
│
├─ GitHub Secrets missing?
│  └─ YES → Add missing secrets → Rerun workflow → ✅
│  └─ NO → Continue to SSH test
│
├─ Local SSH test works?
│  └─ NO → SSH credentials/network issue → Fix and retry
│  └─ YES → Continue to server checks
│
├─ Server checks pass?
│  └─ NO → Server configuration issue → Fix and retry
│  └─ YES → Continue to deployment script
│
├─ Deployment script runs fully?
│  └─ NO → Docker/application issue → Fix and retry
│  └─ YES → ✅ DEPLOYMENT SUCCESSFUL
```

---

## Common Issues & Quick Fixes

### Issue: "Permission denied (publickey)"
**Cause:** SSH key mismatch
**Fix:**
```bash
# Generate new key pair on your local machine
ssh-keygen -t rsa -b 4096 -f ~/.ssh/agentverse_deploy
# Copy public key content
cat ~/.ssh/agentverse_deploy.pub

# SSH to server using alternative method
# Add public key to ~/.ssh/authorized_keys
echo "<paste_public_key_here>" >> ~/.ssh/authorized_keys

# Update GitHub Secret SERVER_SSH_KEY with private key
cat ~/.ssh/agentverse_deploy
# Copy entire output (including BEGIN/END lines) to secret
```

### Issue: "Connection timed out"
**Cause:** Server not reachable, firewall blocking, or wrong port
**Fix:**
```bash
# Test if you can reach the server
ping <SERVER_HOST>
telnet <SERVER_HOST> <SERVER_SSH_PORT>

# If fails, check:
# - Server is running and connected to network
# - Firewall allows inbound SSH from GitHub's IP ranges
# - SERVER_SSH_PORT is correct (usually 22)
# - SERVER_HOST spelling is correct
```

### Issue: "docker compose: command not found"
**Cause:** Docker not installed on server
**Fix:**
```bash
ssh <SERVER_USER>@<SERVER_HOST> << 'EOF'
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker <SERVER_USER>
EOF
```

### Issue: "no space left on device" during docker build
**Cause:** Low disk space
**Fix:**
```bash
ssh <SERVER_USER>@<SERVER_HOST> << 'EOF'
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f

# Remove old deployments if any
rm -rf /root/Workspace/agent-verse/.next/
EOF
```

---

## When to Update Secrets

Update GitHub Secrets when:
- ✅ SERVER_HOST IP address changes
- ✅ SERVER_USER username changes
- ✅ SSH key is rotated (new key generated)
- ✅ SERVER_SSH_PORT changes
- ❌ DO NOT share secrets in public repositories
- ❌ DO NOT commit private keys to git

---

## After Fixing the Issue

1. **Update the secret in GitHub:**
   - Settings → Secrets and variables → Actions
   - Click "Update" on the changed secret
   - Paste new value

2. **Rerun the workflow:**
   - Actions → Deploy (main)
   - Click "Run workflow" → "Run workflow" button
   - Wait for ✅ success

3. **Verify deployment:**
   ```bash
   ssh <SERVER_USER>@<SERVER_HOST> "curl http://localhost:3000"
   # Should show HTML response (home page)
   ```

4. **Check logs:**
   ```bash
   ssh <SERVER_USER>@<SERVER_HOST> "docker compose logs app -f"
   # Should show: "Started server on 0.0.0.0:3000"
   ```

---

## Related Documentation

- **Detailed Analysis:** See `DEPLOYMENT_WORKFLOW_66_SSH_FAILURE_ANALYSIS.md`
- **Database Setup:** See `DEPLOYMENT_FIX_2026-02-14.md`
- **Deployment Overview:** See `docs/DEPLOYMENT_FIX.md`

---

**Last Updated:** 2026-02-15
**Status:** Ready for troubleshooting
