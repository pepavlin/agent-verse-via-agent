#!/usr/bin/env node

/**
 * Disk Space Monitor
 * Monitors disk usage and alerts when space is running low
 */

import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Thresholds
const CRITICAL_THRESHOLD = 95; // Alert when disk is 95% full
const WARNING_THRESHOLD = 85;  // Warn when disk is 85% full
const DB_SIZE_WARNING = 100 * 1024 * 1024; // Warn if DB is over 100MB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getDiskUsage() {
  try {
    const output = execSync('df -h /workspace 2>/dev/null || df -h /', { encoding: 'utf-8' });
    const lines = output.trim().split('\n');

    if (lines.length < 2) {
      return null;
    }

    // Parse the second line (data line)
    const parts = lines[1].split(/\s+/);
    const usePercent = parseInt(parts[4].replace('%', ''));

    return {
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usePercent: usePercent,
      mountPoint: parts[5] || parts[4]
    };
  } catch (error) {
    console.error('Error getting disk usage:', error.message);
    return null;
  }
}

async function getDbSize() {
  try {
    const pg = await import('pg');
    const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
    const result = await pool.query('SELECT pg_database_size(current_database()) as size');
    await pool.end();
    return parseInt(result.rows[0].size);
  } catch {
    return 0;
  }
}

function getDirectorySize(path) {
  try {
    const output = execSync(`du -sb "${path}" 2>/dev/null`, { encoding: 'utf-8' });
    const size = parseInt(output.split('\t')[0]);
    return size;
  } catch {
    return 0;
  }
}

async function checkDiskSpace() {
  console.log('=== Disk Space Monitor ===\n');

  const diskInfo = getDiskUsage();

  if (!diskInfo) {
    console.error('Failed to get disk usage information');
    process.exit(1);
  }

  console.log('Disk Usage:');
  console.log(`  Filesystem: ${diskInfo.filesystem}`);
  console.log(`  Size: ${diskInfo.size}`);
  console.log(`  Used: ${diskInfo.used}`);
  console.log(`  Available: ${diskInfo.available}`);
  console.log(`  Usage: ${diskInfo.usePercent}%`);
  console.log('');

  // Check disk usage level
  let status = 'OK';
  if (diskInfo.usePercent >= CRITICAL_THRESHOLD) {
    status = 'CRITICAL';
    console.log(`🚨 CRITICAL: Disk usage is at ${diskInfo.usePercent}%!`);
    console.log('   Action required: Run cleanup scripts immediately');
  } else if (diskInfo.usePercent >= WARNING_THRESHOLD) {
    status = 'WARNING';
    console.log(`⚠️  WARNING: Disk usage is at ${diskInfo.usePercent}%`);
    console.log('   Consider running cleanup scripts soon');
  } else {
    console.log(`✓ Disk space is healthy (${diskInfo.usePercent}% used)`);
  }
  console.log('');

  // Check database size
  const dbSize = await getDbSize();
  console.log('Database Size:');
  console.log(`  PostgreSQL: ${formatBytes(dbSize)}`);

  if (dbSize > DB_SIZE_WARNING) {
    console.log(`  ⚠️  Database is growing large. Consider running maintenance.`);
    if (status === 'OK') status = 'WARNING';
  } else {
    console.log(`  ✓ Database size is healthy`);
  }
  console.log('');

  // Check build artifacts
  const nextSize = getDirectorySize(join(projectRoot, '.next'));
  const nodeModulesSize = getDirectorySize(join(projectRoot, 'node_modules'));

  console.log('Build Artifacts:');
  console.log(`  .next: ${formatBytes(nextSize)}`);
  console.log(`  node_modules: ${formatBytes(nodeModulesSize)}`);
  console.log('');

  // Recommendations
  console.log('Maintenance Commands:');
  console.log('  Database maintenance: npm run db:maintenance');
  console.log('  Disk cleanup:         npm run cleanup:disk');
  console.log('  Rebuild (if needed):  npm run build');
  console.log('');

  // Exit code based on status
  if (status === 'CRITICAL') {
    console.log('Status: CRITICAL - Immediate action required');
    process.exit(2);
  } else if (status === 'WARNING') {
    console.log('Status: WARNING - Maintenance recommended');
    process.exit(1);
  } else {
    console.log('Status: OK - All systems healthy');
    process.exit(0);
  }
}

checkDiskSpace();
