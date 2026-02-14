async function testHTTPAPI() {
  console.log('🧪 Testing HTTP API endpoints...\n')

  const BASE_URL = 'http://localhost:3000'

  try {
    // Test 1: GET /api/agents
    console.log('1️⃣ Testing GET /api/agents...')
    const getResponse = await fetch(`${BASE_URL}/api/agents`)
    if (!getResponse.ok) {
      throw new Error(`GET failed: ${getResponse.status} ${getResponse.statusText}`)
    }
    const agents = await getResponse.json()
    console.log(`✅ GET successful - Found ${agents.length} agents`)

    // Test 2: POST /api/agents
    console.log('\n2️⃣ Testing POST /api/agents...')
    const newAgent = {
      name: 'APITestBot',
      description: 'Created via HTTP API test',
      model: 'claude-3-5-sonnet-20241022',
      role: 'ideator',
      personality: 'creative and enthusiastic',
      specialization: 'innovation',
      color: '#f59e0b',
      size: 30
    }

    const postResponse = await fetch(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAgent)
    })

    if (!postResponse.ok) {
      const error = await postResponse.json()
      throw new Error(`POST failed: ${JSON.stringify(error)}`)
    }

    const createdAgent = await postResponse.json()
    console.log('✅ POST successful - Agent created:', {
      id: createdAgent.id,
      name: createdAgent.name,
      role: createdAgent.role
    })

    // Test 3: GET /api/agents again to verify
    console.log('\n3️⃣ Verifying agent was created...')
    const getResponse2 = await fetch(`${BASE_URL}/api/agents`)
    const agents2 = await getResponse2.json()
    console.log(`✅ Found ${agents2.length} agents (should be 1)`)

    // Test 4: GET specific agent
    console.log('\n4️⃣ Testing GET /api/agents/{id}...')
    const getOneResponse = await fetch(`${BASE_URL}/api/agents/${createdAgent.id}`)
    if (!getOneResponse.ok) {
      throw new Error(`GET one failed: ${getOneResponse.status}`)
    }
    const agent = await getOneResponse.json()
    console.log('✅ GET one successful:', agent.name)

    // Test 5: DELETE agent
    console.log('\n5️⃣ Testing DELETE /api/agents/{id}...')
    const deleteResponse = await fetch(`${BASE_URL}/api/agents/${createdAgent.id}`, {
      method: 'DELETE'
    })
    if (!deleteResponse.ok) {
      throw new Error(`DELETE failed: ${deleteResponse.status}`)
    }
    console.log('✅ DELETE successful')

    console.log('\n✅ All HTTP API tests passed!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    console.error('\n⚠️  Make sure the dev server is running: npm run dev')
    process.exit(1)
  }
}

testHTTPAPI()
