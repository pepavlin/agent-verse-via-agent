# Workflow #75 Fix - Quick Reference Guide

**Created:** 2026-02-15
**Status:** ❌ DEPLOYMENT BLOCKED - Ready to fix

---

## The Problem in 30 Seconds

Workflow #75 fails during SSH deployment because:

1. **Missing GitHub Secrets** → SSH auth fails → 102s timeout
2. **Invalid workflow config** → unsupported `known_hosts` parameter
3. **ESLint violations** → Would fail build even if SSH succeeds

**PR #69 (Tailwind config) is NOT the issue.** It's correctly implemented.

---

## Quick Fix Checklist

### 🔴 FIX #1: Add GitHub Secrets (CRITICAL)

**Status:** ❌ MUST DO FIRST

Go to: **Repository Settings** → **Secrets and variables** → **Actions**

Add 4 new secrets:

```
✏️ SERVER_HOST
   Value: <your-server-ip-or-hostname>
   Example: 192.168.1.100 or deploy.example.com

✏️ SERVER_USER
   Value: <ssh-username>
   Example: ubuntu or root

✏️ SERVER_SSH_KEY
   Value: <paste-entire-pem-private-key>
   Example:
   -----BEGIN OPENSSH PRIVATE KEY-----
   [... key content ...]
   -----END OPENSSH PRIVATE KEY-----

✏️ SERVER_SSH_PORT (Optional)
   Value: <port-number>
   Default: 22
   Example: 2222
```

**Verify locally:**
```bash
ssh -i <your-private-key> -p <port> <user>@<host> "echo 'OK'"
```

### 🔴 FIX #2: Update GitHub Actions Workflow (CRITICAL)

**Status:** ❌ MUST DO SECOND

**File:** `.github/workflows/deploy.yml`

**Find:** Line 24 with `known_hosts:`
```yaml
known_hosts: ${{ secrets.SERVER_KNOWN_HOSTS }}
```

**Delete this line entirely.** The action doesn't support it.

**Result:**
```yaml
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
      git fetch origin main
      git reset --hard origin/main
      docker compose up -d --build
      docker image prune -f
```

### 🟠 FIX #3: Fix ESLint Violations (HIGH)

**Status:** ❌ CAN BE DONE IN PARALLEL

Run locally:
```bash
npm run lint
```

Fix all 72 violations:
- `@typescript-eslint/no-explicit-any` (28 errors)
- `@typescript-eslint/no-unused-vars` (57 errors)

Affected files:
- `types/index.ts`
- `lib/database/prisma-service.ts`
- `app/agents/*.ts`
- Test files
- API routes

---

## Expected Results After Fixes

### After FIX #1 & #2 Only

```
Workflow #75 (New)
├─ Deploy via SSH: ✅ STARTS
├─ SSH connects: ✅ SUCCESS
├─ Pulls code: ✅ SUCCESS
├─ Docker build starts: ✅ BEGINS
├─ npm run build: ❌ FAILS
│  └─ 72 ESLint violations
└─ Workflow fails at: Docker build stage
```

### After All 3 Fixes

```
Workflow #75 (New)
├─ Deploy via SSH: ✅ STARTS
├─ SSH connects: ✅ SUCCESS
├─ Pulls code: ✅ SUCCESS
├─ Docker build: ✅ SUCCESS
├─ npm install: ✅ SUCCESS
├─ Prisma generate: ✅ SUCCESS
├─ npm run build: ✅ SUCCESS
├─ Containers start: ✅ SUCCESS
├─ Health checks: ✅ PASS
└─ Workflow: ✅ COMPLETE
```

---

## Do It Now

### Step 1: GitHub Secrets (2 minutes)

```
1. Go to GitHub repo
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add SERVER_HOST
5. Add SERVER_USER
6. Add SERVER_SSH_KEY
7. Add SERVER_SSH_PORT (optional)
```

### Step 2: Fix Workflow File (1 minute)

```bash
# Edit the file
vi .github/workflows/deploy.yml

# Delete line 24: known_hosts: ${{ secrets.SERVER_KNOWN_HOSTS }}

# Save and commit
git add .github/workflows/deploy.yml
git commit -m "fix: remove unsupported known_hosts from SSH action"
git push origin main
```

### Step 3: Fix ESLint (30+ minutes)

```bash
npm run lint
# Fix each error
git add .
git commit -m "fix: resolve 72 ESLint violations blocking deployment"
git push origin main
```

### Step 4: Monitor

```
1. Go to GitHub repo
2. Actions tab
3. Watch "Deploy (main)" workflow
4. Workflow #76 should run automatically
5. Check logs for success or remaining issues
```

---

## Troubleshooting

### Still failing with "Connection timed out"?

- [ ] Check SERVER_HOST is not empty
- [ ] Check SERVER_USER is not empty
- [ ] Check SERVER_SSH_KEY is a valid PEM private key
- [ ] Check server is reachable: `ping <SERVER_HOST>`
- [ ] Check SSH works: `ssh -i <key> -p <port> <user>@<host>`

### Failing with "Unexpected input 'known_hosts'"?

- [ ] You didn't delete line 24 from deploy.yml
- [ ] The removal didn't get pushed to main
- [ ] Go back to FIX #2 and try again

### Docker build failing with ESLint?

- [ ] You didn't run `npm run lint` locally
- [ ] You didn't fix all the violations
- [ ] Run `npm run lint` and check for remaining errors
- [ ] Go back to FIX #3

---

## Why This Isn't PR #69's Fault

PR #69 added `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        // ... more valid config
      },
    },
  },
  plugins: [],
}

export default config
```

✅ **Valid TypeScript**
✅ **No ESLint errors**
✅ **No syntax issues**
✅ **Follows Tailwind best practices**

**Conclusion:** PR #69 is fine. The workflow failure is due to missing infrastructure setup (secrets + config).

---

## Documentation

For detailed analysis, see:
- `docs/WORKFLOW_75_DEPLOYMENT_FAILURE_ANALYSIS.md` - Complete root cause analysis
- `docs/DEPLOYMENT_HISTORY_AND_FAILURES.md` - Historical context
- `docs/DEPLOYMENT_FIX_2026-02-14.md` - Database configuration details

---

## Need Help?

1. **SSH timeout?** → Check FIX #1 (secrets)
2. **Parameter error?** → Check FIX #2 (workflow)
3. **Build fails?** → Check FIX #3 (ESLint)
4. **Still stuck?** → Read the full analysis doc

---

**Last Updated:** 2026-02-15
**Status:** Ready to implement
**Estimated Time:** 45 minutes (with ESLint fixes)

