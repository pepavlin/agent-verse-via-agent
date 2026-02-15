#!/usr/bin/env node

/**
 * Database Maintenance Script
 * Performs cleanup and optimization on PostgreSQL database
 */

import pg from 'pg';
const { Pool } = pg;

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

async function runMaintenance() {
  console.log('=== Database Maintenance Started ===\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    // 1. Clean old messages
    if (CLEANUP_CONFIG.messageRetentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.messageRetentionDays);

      const result = await pool.query(
        'DELETE FROM "Message" WHERE "createdAt" < $1',
        [cutoffDate]
      );
      console.log(`Deleted ${result.rowCount} old messages (older than ${CLEANUP_CONFIG.messageRetentionDays} days)`);
    }

    // 2. Clean completed workflow executions
    if (CLEANUP_CONFIG.workflowRetentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.workflowRetentionDays);

      const result = await pool.query(
        `DELETE FROM "WorkflowExecution" WHERE status IN ('completed', 'failed', 'cancelled') AND "completedAt" < $1`,
        [cutoffDate]
      );
      console.log(`Deleted ${result.rowCount} old workflow executions (older than ${CLEANUP_CONFIG.workflowRetentionDays} days)`);
    }

    // 3. Clean expired sessions
    if (CLEANUP_CONFIG.cleanExpiredSessions) {
      const result = await pool.query(
        'DELETE FROM "Session" WHERE expires < NOW()'
      );
      console.log(`Deleted ${result.rowCount} expired sessions`);
    }

    // 4. Clean expired verification tokens
    if (CLEANUP_CONFIG.cleanExpiredTokens) {
      const result = await pool.query(
        'DELETE FROM "VerificationToken" WHERE expires < NOW()'
      );
      console.log(`Deleted ${result.rowCount} expired verification tokens`);
    }

    // 5. Analyze database statistics
    console.log('\n--- Database Statistics ---');
    const tables = ['User', 'Agent', 'Message', 'Task', 'Department', 'WorkflowExecution', 'Session'];
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`  ${table}: ${result.rows[0].count} records`);
    }

    // 6. Run VACUUM ANALYZE to reclaim space and update statistics
    if (CLEANUP_CONFIG.runVacuum) {
      console.log('\n--- Running VACUUM ANALYZE ---');
      // VACUUM cannot run inside a transaction, use a separate client
      const client = await pool.connect();
      try {
        await client.query('VACUUM ANALYZE');
        console.log('VACUUM ANALYZE completed');
      } finally {
        client.release();
      }
    }

    // 7. Check database size
    console.log('\n--- Database Size ---');
    const sizeResult = await pool.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) as size`
    );
    console.log(`  Database size: ${sizeResult.rows[0].size}`);

  } catch (error) {
    console.error('Error during maintenance:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }

  console.log('\n=== Database Maintenance Completed ===');
}

runMaintenance().catch(console.error);
