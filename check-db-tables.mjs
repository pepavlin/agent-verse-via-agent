import Database from 'better-sqlite3';

const db = new Database('./dev.db', { readonly: true });

try {
  console.log('=== DATABASE TABLES CHECK ===\n');

  // Get all tables
  const tables = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type='table'
    ORDER BY name
  `).all();

  console.log('Tables found:', tables.length);
  console.log('Tables:', tables.map(t => t.name).join(', '));
  console.log('\n');

  // Check each expected table
  const expectedTables = [
    'User', 'Account', 'Session', 'VerificationToken',
    'Agent', 'Message', 'Department', 'Task',
    'WorkflowExecution', 'WorkflowStep', 'UserQuery',
    '_prisma_migrations'
  ];

  const existingTableNames = tables.map(t => t.name);

  console.log('=== TABLE STATUS ===\n');
  expectedTables.forEach(tableName => {
    const exists = existingTableNames.includes(tableName);
    console.log(`${exists ? '✓' : '✗'} ${tableName}`);

    if (exists && tableName !== '_prisma_migrations') {
      // Get row count
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  Rows: ${count.count}`);

      // Get schema
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(`  Columns: ${schema.length} (${schema.map(c => c.name).join(', ')})`);
      console.log('');
    }
  });

  // Check for missing tables
  const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
  if (missingTables.length > 0) {
    console.log('\n⚠️  MISSING TABLES:', missingTables.join(', '));
  } else {
    console.log('\n✓ All expected tables exist!');
  }

} catch (error) {
  console.error('Error:', error.message);
} finally {
  db.close();
}
