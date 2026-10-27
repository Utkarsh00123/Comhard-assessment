const BASE_URL = 'http://localhost:3001'

async function runTests() {
  console.log('=== Starting End-to-End Service Tests ===\n')

  const testEmail = `test_user_${Date.now()}@example.com`
  const testPassword = 'Password123!'
  let jwtToken = ''
  let userId = ''
  let createdTaskId = ''

  // Test 1: Signup
  console.log('1. Testing User Signup with Neon DB...')
  const signupRes = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Neon Tester',
    }),
  })
  const signupData = await signupRes.json()
  if (!signupRes.ok || !signupData.token) {
    throw new Error(`Signup failed: ${JSON.stringify(signupData)}`)
  }
  jwtToken = signupData.token
  userId = signupData.user.id
  console.log(`✓ Signup successful! Created User ID: ${userId}, received JWT.\n`)

  // Test 2: Login (Bcrypt verification against Neon DB)
  console.log('2. Testing User Login with bcrypt password hash verification...')
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  })
  const loginData = await loginRes.json()
  if (!loginRes.ok || !loginData.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`)
  }
  console.log('✓ Login successful! Bcrypt hash validated against Neon database.\n')

  // Test 3: Authenticated User Profile via Bearer token
  console.log('3. Testing GET /api/auth/me (Bearer Token)...')
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  })
  const meData = await meRes.json()
  if (!meRes.ok || meData.user.email !== testEmail) {
    throw new Error(`Me endpoint failed: ${JSON.stringify(meData)}`)
  }
  console.log(`✓ Me endpoint returned user: ${meData.user.name} (${meData.user.email})\n`)

  // Test 4: Forgot Password Token Generation
  console.log('4. Testing POST /api/auth/forgot-password...')
  const fpRes = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail }),
  })
  const fpData = await fpRes.json()
  if (!fpRes.ok || !fpData.resetToken) {
    throw new Error(`Forgot password failed: ${JSON.stringify(fpData)}`)
  }
  console.log(`✓ Forgot password generated reset token: ${fpData.resetToken.substring(0, 16)}...\n`)

  // Test 5: Create Task in Neon DB
  console.log('5. Testing Task Creation (POST /api/tasks)...')
  const taskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({
      title: 'Neon DB Integration Task',
      description: 'Verify serverless PostgreSQL and SLA calculations end to end',
      category: 'Backend',
      importance: 'High',
      status: 'To Do',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    }),
  })
  const taskData = await taskRes.json()
  if (!taskRes.ok || !taskData.task) {
    throw new Error(`Task creation failed: ${JSON.stringify(taskData)}`)
  }
  createdTaskId = taskData.task.id
  console.log(`✓ Task created in Neon DB! ID: ${createdTaskId}, Status: ${taskData.task.status}\n`)

  // Test 6: Fetch Tasks
  console.log('6. Testing Task Listing (GET /api/tasks)...')
  const listRes = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  })
  const listData = await listRes.json()
  if (!listRes.ok || !Array.isArray(listData.tasks) || listData.tasks.length === 0) {
    throw new Error(`Task listing failed: ${JSON.stringify(listData)}`)
  }
  console.log(`✓ Task listing returned ${listData.tasks.length} task(s) for user.\n`)

  // Wait 1.5 seconds to accumulate active section time
  console.log('Waiting 1.5s to simulate active SLA accumulation...')
  await new Promise((r) => setTimeout(r, 1500))

  // Test 7: Forward Transition to "In Progress"
  console.log('7. Testing Status Transition To Do -> In Progress with SLA Engine...')
  const patchRes1 = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ status: 'In Progress' }),
  })
  const patchData1 = await patchRes1.json()
  if (!patchRes1.ok || patchData1.task.status !== 'In Progress') {
    throw new Error(`Status update failed: ${JSON.stringify(patchData1)}`)
  }
  console.log(`✓ Task moved to In Progress! Transitions: ${patchData1.task.stageTransitionsCount}, Time in To Do: ${patchData1.task.timeInTodoSeconds}s\n`)

  // Test 8: Backward Transition ("In Progress" -> "To Do")
  console.log('8. Testing Backward Transition (In Progress -> To Do, verifying forward SLA movement)...')
  await new Promise((r) => setTimeout(r, 1000))
  const patchRes2 = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ status: 'To Do' }),
  })
  const patchData2 = await patchRes2.json()
  if (!patchRes2.ok || patchData2.task.status !== 'To Do') {
    throw new Error(`Backward update failed: ${JSON.stringify(patchData2)}`)
  }
  console.log(`✓ Task moved back to To Do! Transitions: ${patchData2.task.stageTransitionsCount}, Time in Progress: ${patchData2.task.timeInProgressSeconds}s\n`)

  // Test 9: Complete Task ("To Do" -> "Done")
  console.log('9. Testing Completion Transition (To Do -> Done)...')
  const patchRes3 = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ status: 'Done' }),
  })
  const patchData3 = await patchRes3.json()
  if (!patchRes3.ok || patchData3.task.status !== 'Done') {
    throw new Error(`Completion update failed: ${JSON.stringify(patchData3)}`)
  }
  console.log(`✓ Task marked as Done! Total transitions: ${patchData3.task.stageTransitionsCount}\n`)

  // Test 10: Delete Task
  console.log('10. Testing Task Deletion (DELETE /api/tasks/[id])...')
  const delRes = await fetch(`${BASE_URL}/api/tasks/${createdTaskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${jwtToken}` },
  })
  const delData = await delRes.json()
  if (!delRes.ok) {
    throw new Error(`Task deletion failed: ${JSON.stringify(delData)}`)
  }
  console.log('✓ Task deleted successfully from Neon DB.\n')

  console.log('=== All 10 End-to-End Tests Passed Successfully! ===')
}

runTests().catch((err) => {
  console.error('\n❌ End-to-End Test Failed:', err)
  process.exit(1)
})
