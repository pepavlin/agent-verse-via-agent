# Disk Space Maintenance Guide

## Overview

This document provides comprehensive guidance for managing disk space and maintaining database health in the Agent Verse application.

## Problem Summary

The application was experiencing critical disk space issues that caused PostgreSQL/SQLite database operations to fail with "No space left on device" errors (code 53100). This blocked all memory operations and database functionality.

## Resolution

We've implemented the following solutions:

### 1. Immediate Cleanup (Completed)

- Removed old instance directories' `node_modules` (freed ~3.4GB)
- Cleaned Next.js build cache and Turbopack cache (~150MB)
- Removed standalone build artifacts
- Disk usage improved from 100% (24M free) to 92% (2.9GB free)

### 2. Maintenance Scripts

Three automated scripts have been added to help prevent future disk space issues:

#### a. Database Maintenance (`npm run db:maintenance`)

**Purpose:** Cleans up old database records and optimizes the database file.

**What it does:**
- Deletes messages older than 90 days (configurable)
- Removes completed workflow executions older than 30 days (configurable)
- Cleans expired sessions and verification tokens
- Runs VACUUM to reclaim disk space
- Optimizes database indices
- Reports space savings

**Usage:**
```bash
npm run db:maintenance
```

**Configuration:** Edit `scripts/db-maintenance.mjs` to adjust retention periods:
```javascript
const CLEANUP_CONFIG = {
  messageRetentionDays: 90,        // Adjust as needed
  workflowRetentionDays: 30,       // Adjust as needed
  cleanExpiredSessions: true,
  cleanExpiredTokens: true,
  runVacuum: true,
};
```

**Recommended frequency:** Weekly or monthly, depending on usage

#### b. Disk Space Cleanup (`npm run cleanup:disk`)

**Purpose:** Removes temporary files and build artifacts that can safely be regenerated.

**What it does:**
- Cleans Next.js dev cache and Turbopack cache
- Removes standalone build artifacts
- Clears npm cache
- Deletes test results and temporary test files
- Removes log files older than 7 days
- Cleans Playwright artifacts (if present)

**Usage:**
```bash
npm run cleanup:disk
```

**Recommended frequency:** Weekly or when disk space is running low

#### c. Disk Space Monitor (`npm run monitor:disk`)

**Purpose:** Provides real-time visibility into disk usage and alerts when space is running low.

**What it monitors:**
- Overall disk usage (warns at 85%, critical at 95%)
- Database file size (warns if > 100MB)
- Build artifact sizes (.next, node_modules)

**Usage:**
```bash
npm run monitor:disk
```

**Exit codes:**
- 0: OK - All systems healthy
- 1: WARNING - Maintenance recommended
- 2: CRITICAL - Immediate action required

**Recommended frequency:** Daily or as part of CI/CD pipeline

## Preventive Measures

### 1. Regular Maintenance Schedule

Set up a cron job or scheduled task to run maintenance scripts regularly:

```bash
# Weekly database maintenance (every Sunday at 2 AM)
0 2 * * 0 cd /path/to/project && npm run db:maintenance

# Weekly disk cleanup (every Sunday at 3 AM)
0 3 * * 0 cd /path/to/project && npm run cleanup:disk

# Daily monitoring (every day at 9 AM)
0 9 * * * cd /path/to/project && npm run monitor:disk
```

### 2. Development Best Practices

- Run `npm run cleanup:disk` before long breaks or after intensive development sessions
- Don't commit build artifacts (.next, node_modules) to git
- Use `.gitignore` to prevent accidental commits of large files
- Regularly review and remove unused dependencies

### 3. Database Best Practices

- Implement pagination for large data sets
- Archive old data instead of keeping everything indefinitely
- Use appropriate data types to minimize storage
- Regularly review and optimize database schema
- Monitor database growth trends

### 4. Build Optimization

- Clean build cache periodically: `rm -rf .next/dev/cache`
- Use production builds sparingly during development
- Consider using `npm ci` instead of `npm install` in CI/CD to avoid cache bloat

### 5. Monitoring and Alerts

Integrate the disk space monitor into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Check Disk Space
  run: npm run monitor:disk
  continue-on-error: true
```

## Disk Space Thresholds

### Current Configuration

- **Warning Level:** 85% disk usage
- **Critical Level:** 95% disk usage
- **Database Size Warning:** 100MB

These thresholds can be adjusted in `scripts/monitor-disk-space.mjs`:

```javascript
const CRITICAL_THRESHOLD = 95; // Alert when disk is 95% full
const WARNING_THRESHOLD = 85;  // Warn when disk is 85% full
const DB_SIZE_WARNING = 100 * 1024 * 1024; // 100MB
```

## Emergency Procedures

If disk space reaches critical levels (>95%):

1. **Immediate Actions:**
   ```bash
   # Clean all caches and temporary files
   npm run cleanup:disk

   # Clean database
   npm run db:maintenance

   # Remove old build artifacts
   rm -rf .next

   # Clean npm cache
   npm cache clean --force
   ```

2. **Check for large files:**
   ```bash
   # Find files larger than 10MB
   find . -type f -size +10M -not -path "./node_modules/*"

   # Check directory sizes
   du -h --max-depth=1 | sort -rh | head -20
   ```

3. **Docker cleanup (if using Docker):**
   ```bash
   # Remove unused Docker resources
   docker system prune -af
   docker volume prune -f
   ```

4. **Database optimization:**
   ```bash
   # For SQLite, manually run VACUUM
   sqlite3 dev.db "VACUUM;"

   # Check database size
   ls -lh dev.db
   ```

## Monitoring Disk Usage

### Manual Checks

```bash
# Check overall disk usage
df -h

# Check specific directory sizes
du -sh .next node_modules dev.db

# Find largest files in project
find . -type f -size +1M -exec ls -lh {} \; | sort -k5 -rh | head -20
```

### Automated Monitoring

The `monitor:disk` script provides comprehensive monitoring:

```bash
npm run monitor:disk
```

**Sample output:**
```
=== Disk Space Monitor ===

Disk Usage:
  Filesystem: /dev/sda1
  Size: 38G
  Used: 33G
  Available: 2.9G
  Usage: 92%

⚠️  WARNING: Disk usage is at 92%
   Consider running cleanup scripts soon

Database Size:
  dev.db: 232 KB
  ✓ Database size is healthy

Build Artifacts:
  .next: 0 Bytes
  node_modules: 998.02 MB

Maintenance Commands:
  Database maintenance: npm run db:maintenance
  Disk cleanup:         npm run cleanup:disk
  Rebuild (if needed):  npm run build

Status: WARNING - Maintenance recommended
```

## Optimization Tips

### 1. Node Modules

- Use `npm prune` to remove unused packages
- Consider using `pnpm` or `yarn` with workspace features for monorepos
- Regularly audit and remove unused dependencies

### 2. Build Artifacts

- Use `.dockerignore` to exclude build artifacts from Docker images
- Configure Next.js to optimize build output
- Enable compression for production builds

### 3. Database

- Implement data archival strategy for old records
- Use database replication for read-heavy workloads
- Consider using connection pooling to reduce overhead

### 4. Logs

- Implement log rotation (configured in cleanup script)
- Use appropriate log levels (debug only in development)
- Consider using external logging service for production

## Troubleshooting

### "No space left on device" Error

**Symptoms:** Database operations fail, build fails, npm install fails

**Solution:**
1. Run `npm run monitor:disk` to check disk usage
2. Run `npm run cleanup:disk` to free up space
3. If still critical, manually remove large files or old backups
4. Check for runaway processes writing to disk

### Database Growing Too Large

**Symptoms:** dev.db file > 100MB, slow queries

**Solution:**
1. Run `npm run db:maintenance` to clean old records
2. Review data retention policies
3. Consider implementing data archival
4. Optimize database schema and indices

### Build Cache Issues

**Symptoms:** Build fails, outdated assets served

**Solution:**
1. Clear Next.js cache: `rm -rf .next`
2. Clear npm cache: `npm cache clean --force`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Rebuild: `npm run build`

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [SQLite VACUUM](https://www.sqlite.org/lang_vacuum.html)
- [Node.js File System](https://nodejs.org/api/fs.html)

## Changelog

### 2026-02-14
- Initial implementation of disk space maintenance system
- Created database maintenance script
- Created disk cleanup script
- Created disk space monitoring script
- Freed up 5.7GB of disk space from critical situation
- Added maintenance scripts to package.json
- Documented all procedures and best practices
