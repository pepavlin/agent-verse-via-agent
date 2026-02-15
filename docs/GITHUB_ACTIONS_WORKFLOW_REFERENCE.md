# GitHub Actions Workflow Reference

**Complete documentation of GitHub Actions workflows in this repository**

---

## Workflows Overview

| Workflow | File | Trigger | Purpose | Status |
|----------|------|---------|---------|--------|
| Deploy (main) | `.github/workflows/deploy.yml` | Push to main | SSH deployment to production | ❌ Failing #66 |
| PR Build & Test | `.github/workflows/pr-build-test.yml` | PR to main | Build, test PRs before merge | ✅ Working |

---

## 1. Deploy (main) Workflow

**File:** `.github/workflows/deploy.yml`

### Configuration

```yaml
name: Deploy (main)

on:
  push:
    branches: [ main ]
  workflow_dispatch:          # Allow manual triggering

concurrency:
  group: deploy-main
  cancel-in-progress: true    # Cancel previous runs if new push
```

### Trigger Events

- **Automatic:** Any push to main branch
- **Manual:** GitHub Actions UI → "Run workflow" button
- **Concurrency:** Only 1 deployment at a time (cancels in-progress)

### Deployment Job

#### Job Setup
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest    # GitHub-hosted runner
```

#### SSH Configuration
```yaml
steps:
  - name: Deploy via SSH
    uses: appleboy/ssh-action@v1.0.3
    with:
      host: ${{ secrets.SERVER_HOST }}
      username: ${{ secrets.SERVER_USER }}
      key: ${{ secrets.SERVER_SSH_KEY }}
      port: ${{ secrets.SERVER_SSH_PORT || 22 }}
```

#### Remote Script Execution
```yaml
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

### Required GitHub Secrets

| Secret | Type | Example | Required |
|--------|------|---------|----------|
| `SERVER_HOST` | String | `agentverse.example.com` | Yes |
| `SERVER_USER` | String | `root` | Yes |
| `SERVER_SSH_KEY` | Private Key | `-----BEGIN RSA PRIVATE KEY-----...` | Yes |
| `SERVER_SSH_PORT` | Integer | `22` | No (defaults to 22) |

### Workflow Steps Breakdown

**Step 1: SSH Connection**
- Establishes SSH connection to `username@host:port`
- Authenticates using private key
- **Failure Point:** Network unreachable, auth failed, port closed
- **Timeout:** 100+ seconds typically indicates connection issue

**Step 2: Change Directory**
```bash
cd /root/Workspace/agent-verse
```
- Navigates to project directory
- **Failure:** Directory doesn't exist

**Step 3: Pull Latest Code**
```bash
git fetch origin main
git reset --hard origin/main
```
- Downloads latest commits from GitHub
- Force-updates local repository to match remote
- **Failure:** Git not installed, GitHub SSH key missing, network issue

**Step 4: Rebuild Docker Containers**
```bash
docker compose up -d --build
```
- Pulls/builds Docker images
- Starts services (PostgreSQL, application)
- **Failure:** Docker not installed, build errors, port conflicts

**Step 5: Clean Up Images**
```bash
docker image prune -f
```
- Removes unused Docker images
- Saves disk space
- **Failure:** Rare, usually succeeds if step 4 succeeded

### Success Criteria
- All 5 steps complete without error
- GitHub Actions shows ✅ green checkmark
- Workflow tab shows "Deploy (main): Deploy via SSH — completed"

### Failure Indicators

| Indicator | Likely Cause | Time |
|-----------|-------------|------|
| Fails immediately | SSH secret missing | 0-5s |
| Fails after 102s | SSH connection timeout | ~102s |
| Fails during build | Docker/code error | 60-180s |
| Fails during startup | App/DB error | 120-240s |

---

## 2. PR Build & Test Workflow

**File:** `.github/workflows/pr-build-test.yml`

### Configuration

```yaml
name: PR - Build and Test

on:
  pull_request:
    branches: [ main ]
```

### Purpose

Validates PRs before merging to main:
- Ensures code builds successfully
- Runs test suite
- Prevents broken code from reaching main

### Workflow Steps

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test

      - name: Build application
        run: npm run build
```

### Steps Explained

1. **Checkout:** Clones PR code
2. **Node Setup:** Installs Node.js 20
3. **Dependencies:** Installs npm packages (`npm ci`)
4. **Tests:** Runs test suite (`npm run test`)
5. **Build:** Builds application (`npm run build`)

### Missing Step

❌ **Lint check is NOT running** (removed in commit b8bcaa2)

Previously ran: `npm run lint`
- Would catch 72 ESLint errors
- Would block merging PR with violations
- Currently missing, so violations slip through

**Note:** This should be restored to catch code quality issues early.

---

## Secrets Configuration

### Where to Configure

GitHub Repository Settings → Secrets and variables → Actions

### How to Add

1. Click "New repository secret"
2. Enter Name: (e.g., `SERVER_HOST`)
3. Enter Value: (e.g., `agentverse.example.com`)
4. Click "Add secret"

### Secrets for Deploy Workflow

#### SERVER_HOST
- **Type:** Hostname or IP address
- **Example:** `deploy.agentverse.com` or `203.0.113.42`
- **Security:** Can be public (server address)
- **Test:** `nslookup <SERVER_HOST>`

#### SERVER_USER
- **Type:** SSH username
- **Example:** `root` or `deploy`
- **Security:** Should be restricted account (not password-based)
- **Test:** `ssh -i key user@host "echo test"`

#### SERVER_SSH_KEY
- **Type:** Private SSH key (PEM format)
- **Example:**
```
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA1234567890abc...
(many more lines)
-----END RSA PRIVATE KEY-----
```
- **Security:** TOP SECRET - keep private
- **How to Generate:**
```bash
ssh-keygen -t rsa -b 4096 -f deploy_key
cat deploy_key                    # Copy to SERVER_SSH_KEY
cat deploy_key.pub >> ~/.ssh/authorized_keys  # Add to server
```

#### SERVER_SSH_PORT
- **Type:** Port number
- **Example:** `22` (default) or `2222` (custom)
- **Security:** Can be public
- **Default:** 22 (if not specified)

---

## Docker Deployment Details

### Docker Compose Services

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: agentverse
      POSTGRES_PASSWORD: agentverse_password
      POSTGRES_DB: agentverse
    healthcheck:
      test: pg_isready -U agentverse -d agentverse
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  app:
    build:
      context: .
      dockerfile: Dockerfile
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://agentverse:agentverse_password@db:5432/agentverse
      NEXTAUTH_SECRET: <required>
      NEXTAUTH_URL: https://your-domain.com
```

### Docker Build Stages

**Stage 1: Dependencies**
```dockerfile
FROM node:20-alpine
RUN npm ci
```

**Stage 2: Builder**
```dockerfile
FROM node:20-alpine
RUN npx prisma generate
RUN npm run build
```

**Stage 3: Runner**
```dockerfile
FROM node:20-alpine
COPY --from=builder /app/.next/standalone ./
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]
```

### Startup Script

`scripts/docker-entrypoint.sh`:
1. Detect database type (PostgreSQL vs SQLite)
2. Wait for database to be ready
3. Run Prisma migrations (`prisma migrate deploy`)
4. Verify database connection
5. Start application (`node server.js`)

---

## Troubleshooting Workflows

### Deploy Workflow Failures

#### By Time to Failure

| Time | Component | Likely Cause |
|------|-----------|--------------|
| 0-5s | SSH setup | Secret not configured |
| 5-30s | SSH connection | Network unreachable, port closed |
| 30-102s | SSH auth | Key mismatch, wrong user |
| 102s | SSH timeout | Connection not established |
| 120-180s | Docker build | Code error, ESLint violations |
| 180-300s | App startup | Database error, config issue |

#### How to Debug

1. **Check GitHub Actions logs:**
   - Repository → Actions → Deploy (main)
   - Click latest failed run
   - Expand "Deploy via SSH" step
   - Look for error message

2. **Test locally:**
```bash
ssh -i private_key -p 22 user@host << 'EOF'
cd /root/Workspace/agent-verse
git fetch origin main
git reset --hard origin/main
docker compose up -d --build
docker compose logs app --tail 50
EOF
```

3. **Check server logs:**
```bash
ssh user@host "docker compose logs --tail 100"
```

### PR Workflow Failures

Usually due to:
- ❌ Tests failing: `npm run test` failure
- ❌ Build errors: `npm run build` failure
- ❌ Missing dependencies: `npm ci` failure

**How to fix:**
1. Run locally: `npm ci && npm run test && npm run build`
2. Fix errors
3. Commit and push to PR
4. Workflow reruns automatically

---

## Workflow Status Badges

### For README.md

```markdown
[![Deploy Status](https://github.com/your-org/agent-verse/actions/workflows/deploy.yml/badge.svg)](https://github.com/your-org/agent-verse/actions/workflows/deploy.yml)

[![PR Build Status](https://github.com/your-org/agent-verse/actions/workflows/pr-build-test.yml/badge.svg)](https://github.com/your-org/agent-verse/actions/workflows/pr-build-test.yml)
```

---

## Best Practices

### For Deploy Workflow

1. ✅ **Use SSH keys, not passwords**
   - More secure
   - Can be rotated easily
   - Can be restricted to specific commands

2. ✅ **Rotate SSH keys regularly**
   - Generate new key pair
   - Update server's authorized_keys
   - Update GitHub secret
   - Delete old key

3. ✅ **Monitor deployment logs**
   - Check GitHub Actions logs after each deployment
   - Monitor server logs for startup errors
   - Set up alerts for failures

4. ✅ **Test locally before pushing**
   - Run `npm run build` and `npm run test` locally
   - Verify Docker compose works locally
   - Test deployment script manually

5. ❌ **Don't commit secrets**
   - Never put SSH keys in .env files checked into git
   - Always use GitHub Secrets
   - Use .env.example for template

### For PR Workflow

1. ✅ **Keep tests passing**
   - Run locally: `npm run test`
   - All tests must pass before merging

2. ✅ **Follow code standards**
   - Run linter: `npm run lint`
   - Fix ESLint errors before pushing

3. ✅ **Build before submitting**
   - Run locally: `npm run build`
   - Ensure no build errors

4. ✅ **Use meaningful commit messages**
   - Helps GitHub track changes
   - Appears in deployment logs

---

## Common Commands

### Local Testing

```bash
# Build application
npm run build

# Run tests
npm run test

# Run linter
npm run lint

# Start development server
npm run dev

# Docker compose locally
docker compose up -d
docker compose logs -f
docker compose down
```

### GitHub Actions

```bash
# View workflow status
gh workflow list

# Run workflow manually
gh workflow run deploy.yml

# View latest workflow run
gh run list -L 1

# View workflow logs
gh run view <run-id> --log
```

---

## Workflow File Locations

All workflows are in: `.github/workflows/`

```
.github/
├── workflows/
│   ├── deploy.yml           # Production deployment
│   └── pr-build-test.yml    # PR validation
```

---

## Current Status

**Deploy Workflow (deploy.yml)**
- ❌ Workflow #66 Failed: SSH timeout after 102s
- ⏳ Awaiting GitHub Secrets configuration
- ⏳ Awaiting SSH key setup on server

**PR Workflow (pr-build-test.yml)**
- ✅ Working correctly
- ⚠️ Missing lint step (was removed)

---

## Related Documentation

- `DEPLOYMENT_WORKFLOW_66_SSH_FAILURE_ANALYSIS.md` - Detailed SSH failure analysis
- `WORKFLOW_66_SSH_TROUBLESHOOTING_CHECKLIST.md` - Troubleshooting guide
- `docs/WORKFLOW_66_DEPLOYMENT_SUMMARY.md` - Summary and fix guide

---

**Last Updated:** 2026-02-15
**Status:** Reference documentation
