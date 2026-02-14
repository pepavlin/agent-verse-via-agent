#!/usr/bin/env node

/**
 * Database Maintenance Script
 * Performs VACUUM, cleanup, and optimization on SQLite database
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Database path
const DB_PATH = join(projectRoot, 'dev.db');

// Configuration
const CLEANUP_CONFIG = {
  // Delete messages older than this many days
  messageRetentionDays: 90,
  // Delete completed workflow executions older than this many days
  workflowRetentionDays: 30,
  // Delete expired sessions
  cleanExpiredSessions: true,
  // Delete expired verification tokens
  cleanExpiredTokens: true,
  // Run VACUUM to reclaim space
  runVacuum: true,
};

function getDbSize(path) {
  if (!existsSync(path)) {
    return 0;
  }
  const stats = statSync(path);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function runMaintenance() {
  console.log('=== Database Maintenance Started ===\n');

  if (!existsSync(DB_PATH)) {
    console.error(`Database not found at ${DB_PATH}`);
    process.exit(1);
  }

  const sizeBeforeMB = getDbSize(DB_PATH);
  console.log(`Database size before maintenance: ${formatBytes(sizeBeforeMB)}`);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Enable WAL mode for better concurrency

  try {
    // 1. Clean old messages
    if (CLEANUP_CONFIG.messageRetentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.messageRetentionDays);

      const deletedMessages = db.prepare(`
        DELETE FROM Message
        WHERE createdAt < ?
      `).run(cutoffDate.toISOString());

      console.log(`✓ Deleted ${deletedMessages.changes} old messages (older than ${CLEANUP_CONFIG.messageRetentionDays} days)`);
    }

    // 2. Clean completed workflow executions
    if (CLEANUP_CONFIG.workflowRetentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.workflowRetentionDays);

      const deletedWorkflows = db.prepare(`
        DELETE FROM WorkflowExecution
        WHERE status IN ('completed', 'failed', 'cancelled')
        AND completedAt < ?
      `).run(cutoffDate.toISOString());

      console.log(`✓ Deleted ${deletedWorkflows.changes} old workflow executions (older than ${CLEANUP_CONFIG.workflowRetentionDays} days)`);
    }

    // 3. Clean expired sessions
    if (CLEANUP_CONFIG.cleanExpiredSessions) {
      const now = new Date().toISOString();
      const deletedSessions = db.prepare(`
        DELETE FROM Session
        WHERE expires < ?
      `).run(now);

      console.log(`✓ Deleted ${deletedSessions.changes} expired sessions`);
    }

    // 4. Clean expired verification tokens
    if (CLEANUP_CONFIG.cleanExpiredTokens) {
      const now = new Date().toISOString();
      const deletedTokens = db.prepare(`
        DELETE FROM VerificationToken
        WHERE expires < ?
      `).run(now);

      console.log(`✓ Deleted ${deletedTokens.changes} expired verification tokens`);
    }

    // 5. Analyze database statistics
    console.log('\n--- Database Statistics ---');
    const tables = ['User', 'Agent', 'Message', 'Task', 'Department', 'WorkflowExecution', 'Session'];
    for (const table of tables) {
      const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ${table}: ${result.count} records`);
    }

    // 6. Run VACUUM to reclaim space
    if (CLEANUP_CONFIG.runVacuum) {
      console.log('\n--- Running VACUUM ---');
      console.log('This may take a while for large databases...');
      db.pragma('vacuum');
      console.log('✓ VACUUM completed');
    }

    // 7. Optimize database
    console.log('\n--- Optimizing Database ---');
    db.pragma('optimize');
    console.log('✓ Database optimized');

    const sizeAfterMB = getDbSize(DB_PATH);
    const savedBytes = sizeBeforeMB - sizeAfterMB;

    console.log(`\nDatabase size after maintenance: ${formatBytes(sizeAfterMB)}`);
    console.log(`Space reclaimed: ${formatBytes(savedBytes)}`);
    console.log(`Reduction: ${((savedBytes / sizeBeforeMB) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error('Error during maintenance:', error);
    process.exit(1);
  } finally {
    db.close();
  }

  console.log('\n=== Database Maintenance Completed ===');
}

runMaintenance().catch(console.error);
