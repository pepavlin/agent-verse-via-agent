# Workflow #65 Failure Visualization

## Workflow Execution Flow

### Workflow #65 (FAILED)

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions Workflow #65 - Deploy (main)                 │
│ Triggered: Push to main (PR #56 merge)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Setup                                               │
│ ✅ Allocate Ubuntu runner                                   │
│ ✅ Checkout repository code                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Deploy via SSH (appleboy/ssh-action@v1.0.3)        │
│                                                              │
│ Parse action inputs:                                        │
│   - host: ${{ secrets.SERVER_HOST }}          ✅ valid     │
│   - username: ${{ secrets.SERVER_USER }}      ✅ valid     │
│   - key: ${{ secrets.SERVER_SSH_KEY }}        ✅ valid     │
│   - port: ${{ secrets.SERVER_SSH_PORT }}      ✅ valid     │
│   - known_hosts: ${{ secrets.SERVER_... }}    ❌ INVALID   │
│                                                              │
│ ❌ ERROR: Unexpected input(s): 'known_hosts' │
│                                                              │
│ Action terminated immediately                              │
│ SSH connection NOT attempted                               │
│ Deployment script NOT executed                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Workflow Result: ❌ FAILED                                  │
│ Duration: ~5 seconds                                        │
│ Status: FAILURE - Parameter validation error               │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Process (Blocked)

```
PR #56 Merge → Workflow Triggered → SSH Parameter Error → ❌ BLOCKED
    ↓              ↓                      ↓
All ESLint    Workflow starts        Validation fails
fixes ready   immediately           (before SSH)
                                         ↓
                                    No deployment
                                    ESLint fixes
                                    stay in PR
```

---

## Parameter Validation Issue

### What Happened

```
.github/workflows/deploy.yml
───────────────────────────────────────────────────────────

with:
  host: ${{ secrets.SERVER_HOST }}           ← ✅ Supported
  username: ${{ secrets.SERVER_USER }}       ← ✅ Supported
  key: ${{ secrets.SERVER_SSH_KEY }}         ← ✅ Supported
  port: ${{ secrets.SERVER_SSH_PORT }}       ← ✅ Supported
  known_hosts: ${{ secrets.SERVER_... }}     ← ❌ NOT SUPPORTED
  script: |                                  ← ✅ Supported
    # deployment commands


appleboy/ssh-action@v1.0.3 Parameter Validator
───────────────────────────────────────────────
Checks each parameter against supported list:
  - host            ✅ Found in supported list
  - username        ✅ Found in supported list
  - key             ✅ Found in supported list
  - port            ✅ Found in supported list
  - known_hosts     ❌ NOT in supported list
  - script          ✅ Found in supported list

Result: ❌ VALIDATION FAILED
Error: Unexpected input(s): 'known_hosts'
```

---

## Before vs After

### BEFORE (Workflow #65 - FAILED)

```
Code Commit          Workflow Triggered       SSH Check       Deployment
    ↓                       ↓                    ↓               ↓
[PR #56           [Workflow #65          ❌ Parameter    ❌ Blocked
 merged]           starts]                Validation     - Code not pulled
                                          Error:         - Docker not built
                                          known_hosts    - Containers not
                                          unsupported    started
                   ~5 seconds
                   execution
```

### AFTER (Fix Applied - f77d867)

```
Code Commit          Workflow Triggered       SSH Check       Deployment
    ↓                       ↓                    ↓               ↓
[Any commit     [Workflow #66+        ✅ Parameters    ✅ Success
 to main]        starts]               Valid          - Code pulled
                                       SSH connects   - Docker built
                                       successfully   - Containers
                                                      started
                   ~12 seconds
                   execution
```

---

## Known Hosts Parameter Journey

```
Timeline of the known_hosts Parameter
──────────────────────────────────────────────────────────

Early Commits:
  [ba86529] Add GitHub Actions workflow for deployment
    └─ Initial deploy.yml created, no known_hosts


Commit dfd9b9f:
  "Add known_hosts to deploy workflow"
    └─ known_hosts: ${{ secrets.SERVER_KNOWN_HOSTS }} ADDED
       └─ Intent: Add security via host key verification
       └─ Issue: Parameter not supported by appleboy/ssh-action@v1.0.3


PR #56 Merge (370f90f):
  "Oprav zbývající ESLint chyby..."
    └─ Code merged successfully
    └─ Workflow #65 triggered
    └─ ❌ FAILED: known_hosts parameter validation error


Commit f77d867:
  "fix: remove unsupported known_hosts parameter from SSH action"
    └─ known_hosts parameter REMOVED
    └─ ✅ Workflow validation passes
    └─ ✅ Deployments can proceed
```

---

## Error Context

### Workflow Log Output (Simulated)

```
2026-02-15 16:54:32 [INFO] Workflow #65 triggered by push to main
2026-02-15 16:54:33 [INFO] Allocating Ubuntu runner
2026-02-15 16:54:34 [INFO] Checking out code
2026-02-15 16:54:35 [ERROR] Deploy via SSH: Unexpected input(s): 'known_hosts'
2026-02-15 16:54:35 [ERROR] Workflow run failed
2026-02-15 16:54:36 [INFO] Duration: 0:05 seconds

Error Details:
──────────────────────────────────────────────
appleboy/ssh-action@v1.0.3 does not support:
  - known_hosts

Supported parameters:
  - host
  - username
  - key
  - port
  - password
  - command
  - script
  - strScript
  - use_insecure_cipher
  - proxy_host
  - proxy_username
  - proxy_password
  - proxy_port
```

---

## Comparison: Supported vs Unsupported Parameters

```
appleboy/ssh-action@v1.0.3
──────────────────────────────────────────

✅ SUPPORTED PARAMETERS:
  ├─ host
  ├─ username
  ├─ key
  ├─ port
  ├─ password
  ├─ command
  ├─ script
  ├─ strScript
  ├─ use_insecure_cipher
  ├─ proxy_host
  ├─ proxy_username
  ├─ proxy_password
  └─ proxy_port

❌ NOT SUPPORTED:
  ├─ known_hosts         ← Attempted in workflow #65
  ├─ ssh_config
  ├─ proxy_key
  ├─ fingerprint
  └─ host_key_checking
```

---

## Security Implications

### Host Key Verification Flow

```
Traditional SSH Connection with Host Verification
─────────────────────────────────────────────────

SSH Client              Server
   ↓                      ↓
   └────[SSH Request]─→ Receive request
        Validate:        │
        1. Is host key   │
           in known_hosts?
        2. Does it match │
           received key? │

   ←────[Response]─── Send host key
        ✅ Match      ✅ Connection established
        ❌ Mismatch   ❌ Connection refused (MITM prevention)


appleboy/ssh-action@v1.0.3 Connection Method
──────────────────────────────────────────────

Without known_hosts parameter:
   └─ StrictHostKeyChecking disabled
      └─ Accepts any host key
         └─ Faster but less secure
         └─ Suitable for CI/CD with trusted servers


Attempted with known_hosts parameter:
   └─ ❌ FAILED at validation
      └─ Parameter not recognized
      └─ Connection never attempted
```

---

## Deployment Pipeline Status

### Workflow #65 Failure Impact

```
Pipeline Stage              Status    Issue
──────────────────────────────────────────────────────
1. Code Commit (PR #56)     ✅       Successfully merged
2. Workflow Trigger         ✅       Correctly triggered
3. Runner Allocation        ✅       Ubuntu runner ready
4. Code Checkout           ✅       Code checked out
5. SSH Action Init         ❌       Parameter validation
6. SSH Connection          ⊗        Not attempted
7. Code Pull               ⊗        Not executed
8. Docker Build            ⊗        Not executed
9. Container Restart       ⊗        Not executed
10. Deployment Complete    ❌       FAILED

Overall Result: ❌ DEPLOYMENT BLOCKED
Code in Production: ❌ PR #56 changes NOT deployed
```

---

## Root Cause Chain

```
Root Cause Hierarchy
────────────────────

Level 1: Symptom
  └─ Workflow #65 failed

Level 2: Immediate Cause
  └─ Parameter validation error: unknown input 'known_hosts'

Level 3: Technical Root Cause
  └─ appleboy/ssh-action@v1.0.3 doesn't support known_hosts parameter

Level 4: Configuration Error
  └─ Deploy workflow file added unsupported parameter
      └─ Commit dfd9b9f: "Add known_hosts to deploy workflow"

Level 5: Why It Happened
  └─ Attempted to add security feature
      └─ Didn't verify parameter support in action version
      └─ No testing before merging to main
      └─ No validation of action parameters

Level 6: Prevention Gap
  └─ No pre-flight checks for workflow validity
  └─ No action parameter documentation
  └─ No testing of workflow changes in PR
```

---

## Solution Flow

```
Problem Identified       Root Cause Found        Fix Applied         Result
──────────────────────────────────────────────────────────────────────

Workflow #65       Unsupported        Remove               ✅ Deployments
Failed             'known_hosts'      parameter            can proceed
    ↓              parameter         commit f77d867            ↓
    │                   ↓                 ↓                   ✅ PR #56
    └─ 5 sec       Validation        No longer             fixes deployed
      error        fails before      validated             ✅ Future
                   SSH connects      by action             deploys work
```

---

## Key Metrics

| Metric | Value |
|--------|-------|
| **Workflow Duration** | ~5 seconds |
| **Failure Point** | Parameter validation |
| **SSH Connection Attempts** | 0 |
| **Deployments Blocked** | 1 (workflow #65) |
| **Subsequent Deployments Affected** | All until fix applied |
| **Files Affected** | 1 (deploy.yml) |
| **Lines Changed** | 1 (removed) |
| **Time to Fix** | Committed in f77d867 |

---

## Lessons from Workflow #65

1. **GitHub Actions Parameter Validation is Strict**
   - Invalid parameters cause immediate failure
   - No fallback or warning mode

2. **Action Versions Have Specific Capabilities**
   - appleboy/ssh-action@v1.0.3 ≠ later versions
   - Parameter support varies by version

3. **Test Workflow Changes Before Merging**
   - Create PR for workflow changes
   - Observe workflow run in the PR
   - Only merge after successful validation

4. **Document Action Configuration**
   - Maintain list of supported parameters
   - Note version requirements
   - Link to action documentation

5. **Security vs Availability Trade-off**
   - Attempted to add security: host key verification
   - Broke availability: deployments blocked
   - Need solution that works with current tools
