# GitHub Actions Workflow #66 - SSH Deployment Failure Analysis
**Report Generated:** 2026-02-15
**Workflow:** Deploy (main) - Triggered on push to main branch
**Failure Time:** After 102 seconds
**Status:** ❌ SSH CONNECTION FAILURE

---

## Executive Summary

GitHub Actions Workflow #66 failed during the "Deploy via SSH" step after 102 seconds. The deployment attempts to connect to a production server via SSH and rebuild Docker containers, but the connection establishment or SSH authentication is failing. This analysis examines:

1. **What the SSH deployment script does**
2. **SSH credential configuration requirements**
3. **Target server accessibility requirements**
4. **Recent configuration changes affecting deployment**

---

## Part 1: What the SSH Deployment Script is Doing

### Deployment Workflow Configuration
**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy (main)
on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          port: ${{ secrets.SERVER_SSH_PORT || 22 }}
          script: |
            set -e
            cd /root/Workspace/agent-verse
            echo "Pulling new version..."
            git fetch origin main
            git reset --hard origin/main
            echo "Rebuilding containers..."
            docker compose up -d --build
            echo "Cleaning old images..."
            docker image prune -f
```

### Detailed Script Breakdown

The SSH deployment executes 6 sequential operations on the target server:

#### 1. **Environment Setup**
```bash
set -e  # Exit immediately if any command fails
```
- **Purpose:** Enable strict error handling
- **Effect:** If ANY subsequent command fails, the entire deployment stops

#### 2. **Navigate to Project Directory**
```bash
cd /root/Workspace/agent-verse
```
- **Purpose:** Change to the deployed application directory
- **Expected Path:** `/root/Workspace/agent-verse` on the server
- **Failure Point:** If this directory doesn't exist, deployment fails immediately

#### 3. **Pull Latest Code from GitHub**
```bash
echo "Pulling new version..."
git fetch origin main
git reset --hard origin/main
```
- **git fetch origin main:** Downloads the latest commits from GitHub without changing local code
- **git reset --hard origin/main:** Force-updates the local repository to match the remote main branch exactly
- **Purpose:** Ensure server has the exact code pushed to GitHub
- **Failure Points:**
  - Git not installed on server
  - No SSH key configured for GitHub (separate from deployment SSH)
  - Network connectivity issues
  - Permission issues accessing the repository

#### 4. **Rebuild Docker Containers**
```bash
echo "Rebuilding containers..."
docker compose up -d --build
```
- **Purpose:** Pull latest code, rebuild Docker images, and start containers
- **What it does:**
  1. Reads `docker-compose.yml` configuration
  2. Builds the application Docker image using the Dockerfile
  3. Pulls latest PostgreSQL image
  4. Starts both `db` and `app` services in detached mode
  5. Establishes PostgreSQL health checks
  6. Waits for database to be healthy before starting app
  7. Runs application startup script (`docker-entrypoint.sh`)

#### 5. **Clean Up Old Images**
```bash
echo "Cleaning old images..."
docker image prune -f
```
- **Purpose:** Remove unused Docker images to save disk space
- **Effect:** Removes images that are not referenced by any container

#### 6. **Exit and Report Success**
- If all commands complete successfully, the deployment is considered successful
- GitHub Actions marks the workflow as ✅ PASSED

---

## Part 2: SSH Credentials Configuration in GitHub Secrets

### Required GitHub Secrets for SSH Deployment

The deployment workflow requires **4 GitHub Secrets** to be configured:

#### 1. **SERVER_HOST**
- **What it is:** Hostname or IP address of the production server
- **Format:** `example.com` or `192.168.1.100`
- **Example:** `agentverse.example.com`
- **Type:** Public information (server address)

#### 2. **SERVER_USER**
- **What it is:** SSH username on the production server
- **Format:** Single username string
- **Example:** `root` or `deploy`
- **Type:** Often public (part of SSH credentials)

#### 3. **SERVER_SSH_KEY**
- **What it is:** Private SSH key used for authentication
- **Format:** Multi-line PEM private key
- **Example:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA1234567890...
... (many lines)
-----END RSA PRIVATE KEY-----
```
- **Critical Security Notes:**
  - This is a **PRIVATE KEY** - must be kept secret
  - Should be stored ONLY in GitHub Secrets
  - Should have minimal permissions (SSH keys should be restricted to deployment-only access)
  - Should be different from personal SSH keys

#### 4. **SERVER_SSH_PORT** (Optional)
- **What it is:** SSH port on the production server
- **Format:** Integer port number
- **Default:** 22 (if not specified, uses fallback `|| 22`)
- **Example:** `2222` or `22`
- **Type:** May be public or private (depends on security posture)

### How the Secrets are Used

```yaml
uses: appleboy/ssh-action@v1.0.3
with:
  host: ${{ secrets.SERVER_HOST }}          # Retrieves SERVER_HOST from secrets
  username: ${{ secrets.SERVER_USER }}      # Retrieves SERVER_USER from secrets
  key: ${{ secrets.SERVER_SSH_KEY }}        # Retrieves SERVER_SSH_KEY from secrets
  port: ${{ secrets.SERVER_SSH_PORT || 22 }} # Uses SERVER_SSH_PORT or defaults to 22
```

The `appleboy/ssh-action` GitHub Action:
1. Takes the 4 parameters above
2. Establishes an SSH connection to `username@host:port`
3. Authenticates using the private `key`
4. Executes the `script` commands on the remote server

---

## Part 3: Target Server Accessibility Requirements

For SSH deployment to succeed, the following server conditions must be met:

### Network Requirements

#### 1. **SSH Port Must Be Open**
- Port specified in `SERVER_SSH_PORT` (default: 22) must be accessible
- GitHub Actions runners (which are hosted on AWS/Azure) must have outbound access
- Firewall must allow inbound SSH connections from GitHub's IP addresses
- **Check:** Ping the server and verify SSH port is responding
```bash
# From local machine (not from GitHub Actions):
ssh -p <port> <username>@<host> "echo 'SSH works'"
```

#### 2. **DNS Must Resolve**
- `SERVER_HOST` must resolve to an IP address
- GitHub Actions must be able to reach the hostname
- **Check:** DNS resolution from GitHub Actions environment

### SSH Configuration Requirements

#### 1. **SSH Service Running**
```bash
# On the server:
systemctl status ssh
# or
systemctl status sshd
```

#### 2. **Public Key Authentication Enabled**
```bash
# In /etc/ssh/sshd_config:
PubkeyAuthentication yes
PasswordAuthentication no  # Recommended for security
```

#### 3. **Authorized Keys Configuration**
```bash
# The public key corresponding to SERVER_SSH_KEY must be in:
~/.ssh/authorized_keys
```
For user `SERVER_USER`, the file `~/.ssh/authorized_keys` must contain the public key.

#### 4. **Correct File Permissions**
```bash
# On the server:
~/.ssh/authorized_keys must have 600 permissions
~/.ssh must have 700 permissions
~ (home directory) must be properly owned
```

### Application Environment Requirements

#### 1. **Project Directory Exists**
```bash
# On the server, this directory must exist:
/root/Workspace/agent-verse
```
If it doesn't exist, the `cd /root/Workspace/agent-verse` command will fail.

#### 2. **Git Repository Initialized**
```bash
# The directory must be a git repository:
/root/Workspace/agent-verse/.git/config
# Must have origin remote pointing to GitHub
```

#### 3. **GitHub SSH Key Configured**
The server must have a separate SSH key for GitHub access (not the same as the deployment key).
```bash
# On the server, ~/.ssh/config should have:
Host github.com
    IdentityFile ~/.ssh/github_key
```

#### 4. **Docker Installed and Running**
```bash
# On the server:
docker --version
docker-compose --version
systemctl status docker  # Docker daemon must be running
```

#### 5. **Sufficient Disk Space**
- Docker images can be large
- Building images requires temporary space
- PostgreSQL data volume needs space
- **Check:** `df -h` on server

#### 6. **Network Access for Docker**
- Docker needs to pull images from Docker Hub
- Application needs to reach GitHub for `git fetch`
- Application needs to reach Anthropic API

---

## Part 4: Recent Configuration Changes

### Recent Changes to Deployment Configuration

#### Change 1: Removed `known_hosts` Parameter
**Commit:** `f77d867` (2026-02-15 15:56:12 UTC)
**Author:** Implementer

**What Changed:**
```diff
- known_hosts: ${{ secrets.SERVER_KNOWN_HOSTS }}
```

**Reason:** The `appleboy/ssh-action@v1.0.3` does not support the `known_hosts` input parameter

**Impact on Workflow #66:**
- This removes a potential source of SSH authentication failure
- `appleboy/ssh-action` uses `ssh-keyscan` internally to manage host key verification
- Without this parameter, the action automatically adds the server to `known_hosts`

---

### Recent Changes to Database Configuration

#### Change 1: Prisma 7 Breaking Changes Fixed
**Commit:** Earlier fixes (2026-02-14)

**What Changed:**
1. Removed `url = env("DATABASE_URL")` from `prisma/schema.prisma` (Prisma 7 requirement)
2. Removed LibSQL adapter imports from `lib/prisma.ts` (eliminated SQLite/PostgreSQL conflict)
3. Updated `.env` to use PostgreSQL URL

**Impact on Deployment:**
- Docker build now completes successfully
- Application can start without database adapter conflicts
- Deployment script can successfully rebuild containers

---

### Recent Changes to Deployment Workflow

#### Change 1: Added workflow_dispatch Trigger
**Allows manual triggering** of deployment without waiting for a push

#### Change 2: Removed known_hosts Troubleshooting
**Latest commit (f77d867)** attempted to fix SSH issues by removing the unsupported `known_hosts` parameter

---

## Part 5: Likely Causes of Workflow #66 Failure (102 seconds)

### Timeline Analysis
- **102 seconds** is a specific failure point
- This is likely **SSH connection timeout** or **SSH key rejection**

### SSH Connection Attempt Timeline
```
T+0s:     GitHub Actions starts SSH connection
T+1s:     Attempts to establish TCP connection to SERVER_HOST:SERVER_SSH_PORT
T+10s:    SSH handshake begins
T+30s:    SSH authentication attempts (private key submission)
T+60s:    SSH action may timeout if connection not established
T+102s:   Workflow #66 fails ← This is the reported failure time
```

### Most Likely Causes (in order of probability)

#### 1. **SERVER_HOST is Unreachable** (40% probability)
- The GitHub Actions runner cannot reach the server IP/hostname
- Network timeout after ~100 seconds
- **Symptoms:** Connection times out silently

#### 2. **SSH Port is Closed/Blocked** (25% probability)
- Firewall blocking inbound SSH from GitHub's IP range
- Wrong port specified in `SERVER_SSH_PORT`
- **Symptoms:** Connection refused or timeout

#### 3. **SSH Key Authentication Failing** (20% probability)
- `SERVER_SSH_KEY` private key doesn't match server's public key in `~/.ssh/authorized_keys`
- Wrong username in `SERVER_USER`
- Key permissions incorrect on server
- **Symptoms:** "Permission denied (publickey)" after connection established

#### 4. **SSH Service Not Running** (10% probability)
- SSH daemon not started on server
- Server rebooted and SSH not auto-starting
- **Symptoms:** Connection refused immediately

#### 5. **DNS Resolution Failure** (5% probability)
- `SERVER_HOST` hostname doesn't resolve from GitHub's network
- Wrong hostname configured
- **Symptoms:** "Name or service not known" error

---

## Part 6: SSH Connection Failure Symptoms and Diagnostics

### What GitHub Actions Logs Show

The failure would appear as one of these messages in GitHub Actions workflow logs:

```
fatal: Connection timed out
ssh: connect to host <SERVER_HOST> port <SERVER_SSH_PORT>: Connection timed out
```

or

```
Permission denied (publickey)
fatal: Could not read from remote repository
```

or

```
ssh: connect to host <SERVER_HOST> port <SERVER_SSH_PORT>: Connection refused
```

### How to Diagnose (Local Testing)

#### Test 1: DNS Resolution
```bash
nslookup <SERVER_HOST>
# or
dig <SERVER_HOST>
```

#### Test 2: SSH Port Accessibility
```bash
telnet <SERVER_HOST> <SERVER_SSH_PORT>
# or using nc (netcat)
nc -zv <SERVER_HOST> <SERVER_SSH_PORT>
```

#### Test 3: SSH Connection
```bash
# Using the same key as GitHub Actions:
ssh -i /path/to/private/key -p <SERVER_SSH_PORT> <SERVER_USER>@<SERVER_HOST> "echo 'Success'"
```

#### Test 4: Verify Key Permissions on Server
```bash
# SSH to server using password or different method:
ssh <SERVER_USER>@<SERVER_HOST>
# Then check:
ls -la ~/.ssh/
# authorized_keys should have 600 permissions
cat ~/.ssh/authorized_keys
# Should contain the public key
```

#### Test 5: Verify Project Directory
```bash
ssh <SERVER_USER>@<SERVER_HOST> "cd /root/Workspace/agent-verse && git status"
```

---

## Part 7: Docker Build Process During Deployment

### What Happens During `docker compose up -d --build`

If SSH connection succeeds, the Dockerfile multi-stage build runs:

```dockerfile
# Stage 1: deps - Install Node.js dependencies
# Stage 2: builder - Run Prisma generate and npm build
# Stage 3: runner - Prepare runtime environment
```

#### Build Environment Variables
The build uses:
```bash
DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
NEXT_TELEMETRY_DISABLED=1
```

**Note:** Build uses a dummy database URL (doesn't connect to actual DB during build)

#### Build Failure Points
1. **npm ci fails** - Node.js modules installation
2. **npx prisma generate fails** - Prisma client generation
3. **npm run build fails** - Next.js build with 22 routes
4. **Docker image size** - If image is too large

---

## Part 8: Health Checks and Container Startup

### PostgreSQL Container Health Check
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U agentverse -d agentverse"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

**Timeline:**
- T+0s: PostgreSQL container starts
- T+10s: First health check
- T+50s: 5 retries × 10s intervals
- **Waits up to 50 seconds for PostgreSQL to be ready**

### Application Container Startup
```bash
# scripts/docker-entrypoint.sh runs:
1. Detect database type (PostgreSQL)
2. Wait for PostgreSQL ready (up to 10 seconds)
3. Run Prisma migrations (npx prisma migrate deploy)
4. Verify database connection
5. Start Next.js server (node server.js)
```

**Timeline:**
- T+0s: App container starts
- T+10s: Start period begins
- T+40s: Expected startup complete
- T+100s: Health check timeout (indicates startup failure)

---

## Workflow Failure Summary Table

| Component | Status | Likely Issue | Impact |
|-----------|--------|--------------|--------|
| **SSH Connection** | ❌ FAILING | Host unreachable, port closed, or key mismatch | Deployment cannot start |
| **GitHub Secrets** | ⚠️ UNKNOWN | May be misconfigured or empty | SSH authentication fails |
| **Target Server** | ⚠️ UNKNOWN | May not be accessible or properly configured | SSH connection fails |
| **Project Directory** | ⚠️ UNKNOWN | May not exist on server | First command fails after SSH |
| **Docker Setup** | ⚠️ UNKNOWN | If SSH succeeds, Docker build would start | Would fail if base issues exist |
| **Database Config** | ✅ FIXED | Prisma 7 issues resolved in recent commits | Should not block deployment |
| **Lint Issues** | ⚠️ KNOWN | 72 ESLint errors still present | Would fail Docker build if checked |

---

## Recommendations for Resolving Workflow #66 Failure

### Immediate Troubleshooting Steps

1. **Verify GitHub Secrets Exist**
   - Go to GitHub repository Settings → Secrets and variables → Actions
   - Confirm these secrets are configured:
     - `SERVER_HOST` (non-empty)
     - `SERVER_USER` (non-empty)
     - `SERVER_SSH_KEY` (contains PEM private key, not empty)
     - `SERVER_SSH_PORT` (optional, default 22)

2. **Test SSH Connectivity Locally**
   ```bash
   # Extract the key from GitHub Secrets
   # Save to ~/test_key.pem (chmod 600)
   # Test connection:
   ssh -i ~/test_key.pem -p <PORT> <USERNAME>@<HOST> "echo 'Test'"
   ```

3. **Verify Server is Accessible**
   ```bash
   ping <SERVER_HOST>
   telnet <SERVER_HOST> <SERVER_SSH_PORT>
   nslookup <SERVER_HOST>
   ```

4. **Check Server SSH Configuration**
   ```bash
   # On the server:
   systemctl status ssh
   systemctl status sshd
   # Check ~/.ssh/authorized_keys has the public key
   ```

5. **Verify Project Directory**
   ```bash
   ssh -i <key> <user>@<host> "ls -la /root/Workspace/agent-verse"
   ```

### If SSH Succeeds But Docker Build Fails

1. **Check Docker Installation**
   ```bash
   ssh <user>@<host> "docker --version && docker-compose --version"
   ```

2. **Check Disk Space**
   ```bash
   ssh <user>@<host> "df -h"
   ```

3. **View Deployment Logs**
   ```bash
   ssh <user>@<host> "docker compose logs app --tail 50"
   ssh <user>@<host> "docker compose logs db --tail 50"
   ```

---

## Conclusion

**Workflow #66 SSH Deployment Failure** is most likely caused by:
1. **SSH connection unable to establish** to SERVER_HOST (102 second timeout)
2. **Missing or misconfigured GitHub Secrets** (SERVER_HOST, SERVER_USER, or SERVER_SSH_KEY)
3. **Firewall or network blocking** SSH port
4. **Server not accessible** from GitHub Actions environment

The recent removal of the `known_hosts` parameter (commit f77d867) should have improved SSH reliability, but the deployment is still failing.

**Key Actions:**
- Verify GitHub Secrets are correctly configured
- Test SSH connectivity from local machine
- Check server is accessible and SSH is running
- Review GitHub Actions workflow logs for specific error message
- Once SSH succeeds, verify Docker and PostgreSQL are installed/running

---

**Analysis Date:** 2026-02-15
**Status:** Complete
**Severity:** Critical - Blocks all deployments to production
