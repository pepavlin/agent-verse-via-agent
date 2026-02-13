import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db'
});

const prisma = new PrismaClient({ adapter });

async function testDatabaseOperations() {
  console.log('=== TESTING DATABASE READ/WRITE OPERATIONS ===\n');

  try {
    // Test 1: Create a Department
    console.log('Test 1: Creating a test department...');
    const department = await prisma.department.create({
      data: {
        name: 'Test Department',
        description: 'A test department for database verification'
      }
    });
    console.log(`✓ Created department: ${department.name} (ID: ${department.id})`);

    // Test 2: Create an Agent
    console.log('\nTest 2: Creating a test agent...');
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No user found in database. Run seed script first.');
    }

    const agent = await prisma.agent.create({
      data: {
        name: 'Test Agent',
        description: 'A test agent for database verification',
        model: 'claude-3-5-sonnet-20241022',
        userId: user.id,
        role: 'researcher',
        personality: 'analytical and detail-oriented',
        specialization: 'data analysis',
        departmentId: department.id,
        color: '#10b981',
        size: 25
      }
    });
    console.log(`✓ Created agent: ${agent.name} (ID: ${agent.id})`);

    // Test 3: Create a Task
    console.log('\nTest 3: Creating a test task...');
    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        description: 'A test task for database verification',
        status: 'pending',
        priority: 'medium',
        assignedTo: agent.id,
        createdBy: agent.id,
        departmentId: department.id
      }
    });
    console.log(`✓ Created task: ${task.title} (ID: ${task.id})`);

    // Test 4: Create a Message
    console.log('\nTest 4: Creating a test message...');
    const message = await prisma.message.create({
      data: {
        content: 'This is a test message',
        role: 'user',
        agentId: agent.id,
        fromAgent: 'system',
        toAgent: agent.id,
        taskId: task.id,
        priority: 'low',
        type: 'notification'
      }
    });
    console.log(`✓ Created message: ${message.content.substring(0, 30)}... (ID: ${message.id})`);

    // Test 5: Create a WorkflowExecution
    console.log('\nTest 5: Creating a test workflow execution...');
    const workflow = await prisma.workflowExecution.create({
      data: {
        workflowId: 'test-workflow-001',
        departmentId: department.id,
        userId: user.id,
        input: 'Test workflow input',
        status: 'in_progress'
      }
    });
    console.log(`✓ Created workflow execution (ID: ${workflow.id})`);

    // Test 6: Create a WorkflowStep
    console.log('\nTest 6: Creating a test workflow step...');
    const step = await prisma.workflowStep.create({
      data: {
        workflowExecutionId: workflow.id,
        stepNumber: 1,
        agentRole: 'researcher',
        agentId: agent.id,
        description: 'First step of the test workflow',
        status: 'completed',
        output: 'Test step output'
      }
    });
    console.log(`✓ Created workflow step ${step.stepNumber} (ID: ${step.id})`);

    // Test 7: Read operations with relations
    console.log('\nTest 7: Testing read operations with relations...');
    const agentWithRelations = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        department: true,
        messages: true,
        tasksAssigned: true,
        tasksCreated: true,
        user: true
      }
    });
    console.log(`✓ Read agent with relations:`);
    console.log(`  - Agent: ${agentWithRelations.name}`);
    console.log(`  - Department: ${agentWithRelations.department.name}`);
    console.log(`  - Messages: ${agentWithRelations.messages.length}`);
    console.log(`  - Tasks Assigned: ${agentWithRelations.tasksAssigned.length}`);
    console.log(`  - Tasks Created: ${agentWithRelations.tasksCreated.length}`);

    // Test 8: Update operations
    console.log('\nTest 8: Testing update operations...');
    const updatedTask = await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        result: 'Test task completed successfully',
        completedAt: new Date()
      }
    });
    console.log(`✓ Updated task status to: ${updatedTask.status}`);

    // Test 9: Query operations
    console.log('\nTest 9: Testing query operations...');
    const agents = await prisma.agent.findMany({
      where: {
        role: 'researcher',
        departmentId: department.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log(`✓ Found ${agents.length} researcher agents in test department`);

    // Test 10: Aggregate operations
    console.log('\nTest 10: Testing aggregate operations...');
    const agentCount = await prisma.agent.count();
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      _count: true
    });
    console.log(`✓ Total agents: ${agentCount}`);
    console.log(`✓ Tasks by status:`, tasksByStatus);

    // Test 11: Clean up test data
    console.log('\nTest 11: Cleaning up test data...');
    await prisma.workflowStep.delete({ where: { id: step.id } });
    await prisma.workflowExecution.delete({ where: { id: workflow.id } });
    await prisma.message.delete({ where: { id: message.id } });
    await prisma.task.delete({ where: { id: task.id } });
    await prisma.agent.delete({ where: { id: agent.id } });
    await prisma.department.delete({ where: { id: department.id } });
    console.log('✓ All test data cleaned up');

    console.log('\n=== ALL DATABASE TESTS PASSED ✓ ===\n');

  } catch (error) {
    console.error('\n✗ Database test failed:');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseOperations();
