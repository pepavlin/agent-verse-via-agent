import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function checkDatabase() {
  try {
    console.log('=== DATABASE STATUS CHECK ===\n');

    // Check all tables
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `;

    console.log(`✓ Found ${tables.length} tables in database`);
    console.log('Tables:', tables.map(t => t.name).join(', '));
    console.log('\n');

    // Check critical tables and their counts
    console.log('=== TABLE ROW COUNTS ===\n');

    try {
      const userCount = await prisma.user.count();
      console.log(`✓ User table: ${userCount} rows`);
    } catch (e) {
      console.log(`✗ User table: ERROR - ${e.message}`);
    }

    try {
      const agentCount = await prisma.agent.count();
      console.log(`✓ Agent table: ${agentCount} rows`);
    } catch (e) {
      console.log(`✗ Agent table: ERROR - ${e.message}`);
    }

    try {
      const messageCount = await prisma.message.count();
      console.log(`✓ Message table: ${messageCount} rows`);
    } catch (e) {
      console.log(`✗ Message table: ERROR - ${e.message}`);
    }

    try {
      const departmentCount = await prisma.department.count();
      console.log(`✓ Department table: ${departmentCount} rows`);
    } catch (e) {
      console.log(`✗ Department table: ERROR - ${e.message}`);
    }

    try {
      const taskCount = await prisma.task.count();
      console.log(`✓ Task table: ${taskCount} rows`);
    } catch (e) {
      console.log(`✗ Task table: ERROR - ${e.message}`);
    }

    try {
      const workflowCount = await prisma.workflowExecution.count();
      console.log(`✓ WorkflowExecution table: ${workflowCount} rows`);
    } catch (e) {
      console.log(`✗ WorkflowExecution table: ERROR - ${e.message}`);
    }

    try {
      const stepCount = await prisma.workflowStep.count();
      console.log(`✓ WorkflowStep table: ${stepCount} rows`);
    } catch (e) {
      console.log(`✗ WorkflowStep table: ERROR - ${e.message}`);
    }

    try {
      const queryCount = await prisma.userQuery.count();
      console.log(`✓ UserQuery table: ${queryCount} rows`);
    } catch (e) {
      console.log(`✗ UserQuery table: ERROR - ${e.message}`);
    }

    console.log('\n=== SAMPLE DATA ===\n');

    // Get sample agents
    const agents = await prisma.agent.findMany({ take: 3 });
    if (agents.length > 0) {
      console.log('Sample Agents:');
      agents.forEach(a => {
        console.log(`  - ${a.name} (${a.role || 'no role'}) - created: ${a.createdAt.toISOString()}`);
      });
    } else {
      console.log('No agents found in database');
    }

    // Get sample departments
    const departments = await prisma.department.findMany({ take: 3 });
    if (departments.length > 0) {
      console.log('\nSample Departments:');
      departments.forEach(d => {
        console.log(`  - ${d.name}: ${d.description}`);
      });
    } else {
      console.log('\nNo departments found in database');
    }

    console.log('\n✓ Database check completed successfully!');

  } catch (error) {
    console.error('\n✗ Database check failed:');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
