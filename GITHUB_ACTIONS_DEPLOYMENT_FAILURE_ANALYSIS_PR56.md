# GitHub Actions Deployment Failure Analysis - PR #56

**Analysis Date:** 2026-02-15
**Failed PR:** #56
**Affected Commit:** 370f90f
**Branch:** main
**Failure Type:** GitHub Actions Deploy Workflow
**Status:** 🔴 **CRITICAL - DEPLOYMENT BLOCKED**

---

## Executive Summary

The GitHub Actions deployment workflow **failed after merging PR #56 to the main branch**. The deployment blocked by **2 critical ESLint errors** that prevent Docker image builds and TypeScript compilation during the deployment process.

**Specific Errors:**
1. ❌ **React Hook `setState` in Effect** - `/app/components/GameCanvas.tsx:177`
2. ❌ **React Hook `setState` in Effect** - `/app/game/page.tsx:45`

These errors violate ESLint rules and prevent the application from building in the Docker container during deployment.

---

## Root Cause Analysis

### Primary Issue: ESLint Violations in PR #56

**Commit:** 370f90f - "Oprav zbývající ESLint chyby z PR #54"

This commit attempted to fix remaining ESLint violations from PR #54, but **introduced new React Hook violations** instead of fully resolving all issues.

### What Changed in PR #56

**Files Modified:** 33 files
**Changes:** 939 insertions(+), 387 deletions(-)

Key changes included:
- Fixed ESLint `no-explicit-any` violations in API routes
- Fixed unused variable violations
- **BUT:** Introduced new `react-hooks/set-state-in-effect` violations

### Current ESLint Status

```
✖ 25 problems (2 errors, 23 warnings)

Critical Errors (Blocks Deployment):
┌─────────────────────────────────────────────────────────┐
│ 1. /app/components/GameCanvas.tsx:177                   │
│    Error: Calling setState synchronously within an      │
│    effect can trigger cascading renders                 │
│                                                         │
│    Code: fetchAgents()  ← setState call in useEffect   │
│                                                         │
│ 2. /app/game/page.tsx:45                                │
│    Error: Calling setState synchronously within an      │
│    effect can trigger cascading renders                 │
│                                                         │
│    Code: setUser(currentUser)  ← setState in useEffect │
└─────────────────────────────────────────────────────────┘

Warnings (23 issues):
- Unused variables (@typescript-eslint/no-unused-vars)
- Missing dependencies (react-hooks/exhaustive-deps)
- Unused imports
```

---

## Specific Error Details

### Error #1: GameCanvas.tsx setState in Effect

**File:** `/workspace/instances/4/agent-verse-via-agent/app/components/GameCanvas.tsx`
**Line:** 177
**Severity:** ERROR (Blocks Deployment)
**Rule:** `react-hooks/set-state-in-effect`

**Current Code:**
```typescript
// Line 175-178
useEffect(() => {
  fetchAgents()  // ← This calls setState internally
}, [fetchAgents])
```

**Issue:**
- `fetchAgents()` is an async function that calls `setAgents()` (setState)
- Calling setState synchronously in useEffect causes cascading renders
- React DevTools will warn about performance issues
- Can cause infinite render loops if not careful

**Why It Blocks Deployment:**
- During `docker compose up -d --build`, the build process runs `npm run build`
- ESLint is configured to treat this error as critical
- Docker build fails due to ESLint error
- Deployment never reaches the server

### Error #2: game/page.tsx setState in Effect

**File:** `/workspace/instances/4/agent-verse-via-agent/app/game/page.tsx`
**Line:** 45
**Severity:** ERROR (Blocks Deployment)
**Rule:** `react-hooks/set-state-in-effect`

**Current Code:**
```typescript
// Line 43-48
useEffect(() => {
  if (!currentUser) {
    router.push('/login')
  } else {
    setUser(currentUser)  // ← Direct setState in useEffect
    setLoading(false)     // ← Direct setState in useEffect
    fetchAgents()         // ← Also calls setState
  }
```

**Issue:**
- Multiple `setState` calls (`setUser`, `setLoading`) happening directly in useEffect
- This violates React's best practices for effect synchronization
- Can cause flickering, UI inconsistencies, or render loops

---

## Deployment Workflow Diagram

```
GitHub Push to main
        ↓
GitHub Actions Deploy Workflow Triggered
        ↓
SSH connection to server
        ↓
git reset --hard origin/main
        ↓
docker compose up -d --build
        ↓
Docker Build Phase:
  - RUN npm run build
        ↓
  ESLint validation runs during build
        ↓
  ❌ 2 Critical Errors Found:
     - GameCanvas.tsx:177
     - game/page.tsx:45
        ↓
  Docker build FAILS
        ↓
  ❌ Deployment BLOCKED
```

---

## Why This Breaks Production Deployment

### The `.github/workflows/deploy.yml` Execution Flow

```yaml
jobs:
  deploy:
    steps:
      - name: Deploy via SSH
        script: |
          set -e  # Exit on first error
          cd /root/Workspace/agent-verse
          git fetch origin main
          git reset --hard origin/main
          docker compose up -d --build  # ← FAILS HERE
          docker image prune -f
```

**Why the build fails:**

1. **Docker Build Phase:**
   - Creates Next.js application in container
   - Runs TypeScript compilation
   - Runs ESLint validation (implicitly through build tools)

2. **ESLint Integration:**
   - `.eslintrc` configuration enforces strict rules
   - `react-hooks/set-state-in-effect` is set to "error" severity
   - Breaks the entire build pipeline on violations

3. **Error Propagation:**
   - `set -e` in bash script causes entire deployment to stop on first error
   - Docker container fails to build
   - Old container remains running with old code
   - No rollback, no recovery

---

## Impact Assessment

### Current State
- ❌ **Main branch:** Cannot be deployed
- ❌ **Production:** Stuck on previous working version
- ❌ **GitHub Actions:** All deployment attempts will fail
- ❌ **Development:** Can test locally but not deploy

### Affected Commits
- ✅ 243d322 (Color scheme) - Good code, blocked by infrastructure
- ✅ 3a7a8ef (PR #54 merge) - Good code, blocked by new issues
- ❌ 370f90f (PR #56 merge) - Introduced blocking ESLint errors

### Timeline of Issues

```
2026-02-15 12:42 UTC   Commit b8bcaa2: Remove lint check from PR workflow
                      ↓ (Allowed ESLint errors to pass through PRs)

2026-02-15 16:23 UTC   Commit 243d322: Color scheme changes
                      ↓ (Good code, but couldn't deploy)

2026-02-15 17:00 UTC   Commit 3a7a8ef: Merge PR #54
                      ↓ (Fixed some issues, masked others)

2026-02-15 16:54 UTC   Commit 370f90f: Fix remaining ESLint violations
                      ↓ (Introduced new React Hook violations!)

2026-02-15 15:55 UTC   GitHub Actions Deploy #63: FAILURE
                      ERROR: ESLint errors block Docker build
```

---

## Detailed Fix Requirements

### Fix #1: GameCanvas.tsx - Line 177

**Current Code:**
```typescript
// Fetch agents on mount
useEffect(() => {
  fetchAgents()
}, [fetchAgents])
```

**Issue:**
- `fetchAgents()` is a function that internally calls `setAgents()`
- This creates a state update within the effect
- React dependency array includes `fetchAgents`, which might change

**Solution Options:**

**Option A: Move state update to callback (Recommended)**
```typescript
useEffect(() => {
  fetchAgents()
}, []) // Empty dependency array - runs once on mount
```

**Option B: Stabilize fetchAgents function**
```typescript
const fetchAgents = useCallback(async () => {
  // ... fetch logic
  setAgents(newAgents)
}, []) // Stable reference

useEffect(() => {
  fetchAgents()
}, [fetchAgents]) // Now safe to include
```

**Option C: Convert to useLayoutEffect (if needed synchronously)**
```typescript
useLayoutEffect(() => {
  fetchAgents()
}, [])
```

---

### Fix #2: game/page.tsx - Line 45

**Current Code:**
```typescript
useEffect(() => {
  if (!currentUser) {
    router.push('/login')
  } else {
    setUser(currentUser)
    setLoading(false)
    fetchAgents()
  }
```

**Issue:**
- Multiple state updates happening directly in effect
- Violates React's synchronization principle
- Can cause render inconsistencies

**Solution Options:**

**Option A: Use state initialization (Recommended)**
```typescript
const [user, setUser] = useState(currentUser)
const [loading, setLoading] = useState(!currentUser)

useEffect(() => {
  if (!currentUser) {
    router.push('/login')
  } else {
    fetchAgents()
  }
}, [currentUser, router])
```

**Option B: Use microtask scheduling**
```typescript
useEffect(() => {
  if (!currentUser) {
    router.push('/login')
  } else {
    // Schedule state updates in microtask queue
    Promise.resolve().then(() => {
      setUser(currentUser)
      setLoading(false)
      fetchAgents()
    })
  }
}, [currentUser, router])
```

**Option C: Create custom hook**
```typescript
const useUserInitialization = (currentUser) => {
  useEffect(() => {
    if (currentUser) {
      setUser(currentUser)
      setLoading(false)
      fetchAgents()
    }
  }, [currentUser])
}
```

---

## Secondary Issues (Warnings)

While not blocking deployment, these warnings should be addressed:

### Unused Variables (23 Warnings)
- `app/components/AgentVisualization.tsx:23` - `selectedAgents`
- `app/components/AgentVisualization.tsx:30` - `viewportRef`
- `app/page.tsx:3` - `useEffect`
- Multiple test files with unused imports

### Missing Dependencies
- `app/components/AgentVisualization.tsx:79` - Missing `updateSelectedAgents` in dependency array
- Multiple `react-hooks/exhaustive-deps` warnings

---

## Verification Checklist

After fixes are applied, verify:

```
✅ ESLint passes with 0 errors: npm run lint
✅ Build completes successfully: npm run build
✅ Tests pass (if applicable): npm run test
✅ No TypeScript errors: npx tsc --noEmit
✅ GitHub Actions deploy workflow can be triggered manually
✅ Docker image builds without errors: docker build .
✅ Application starts without runtime errors
```

---

## Prevention Measures

### 1. Restore PR Workflow Lint Check
**File:** `.github/workflows/pr-build-test.yml`

The lint check was removed (commit b8bcaa2), allowing ESLint errors to be merged. This must be restored:

```yaml
- name: Run linters
  run: npm run lint
```

### 2. Add Pre-commit Hook
Prevent committing ESLint violations locally:

```bash
npm install -D husky lint-staged

npx husky install
npx husky add .husky/pre-commit 'npm run lint -- --fix'
```

### 3. GitHub Branch Protection
Require passing checks before merge:
- Settings → Branches → Add rule for `main`
- Require status checks to pass before merging
- Require lint check to pass

### 4. GitHub Actions Status Checks
Ensure deploy workflow results are visible:
- Settings → Actions → General
- Enable "Required status checks"
- Add deploy workflow to required checks

---

## Related Documentation

- `DEPLOYMENT_63_COLOR_SCHEME_FAILURE_ANALYSIS.md` - Previous deployment issues
- `DEPLOYMENT_WORKFLOW_62_FAILURE_ANALYSIS.md` - Workflow debugging
- `.eslintrc` - ESLint configuration
- `.github/workflows/deploy.yml` - Deployment workflow
- `.github/workflows/pr-build-test.yml` - PR validation workflow

---

## Conclusion

**Root Cause:** PR #56 introduced 2 critical ESLint errors violating React Hook best practices.

**Specific Errors:**
1. GameCanvas.tsx:177 - Calling setState in useEffect
2. game/page.tsx:45 - Calling setState in useEffect

**Impact:** Deployment workflow blocked, unable to push changes to production.

**Resolution:** Fix React Hook violations to align with ESLint rules and React best practices.

**Next Steps:**
1. Fix GameCanvas.tsx setState in effect
2. Fix game/page.tsx setState in effect
3. Run `npm run lint` to verify all errors cleared
4. Run `npm run build` to ensure deployment-ready build
5. Commit and verify GitHub Actions deployment succeeds

---

**Status:** 🔴 CRITICAL - REQUIRES IMMEDIATE ACTION
**Blocking:** ❌ Production deployment
**Estimated Fix Time:** 15-30 minutes
**Risk Level:** HIGH - Prevents all deployments

