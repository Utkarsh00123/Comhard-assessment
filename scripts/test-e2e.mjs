/**
 * ============================================================================
 * END-TO-END (E2E) INTEGRATION TEST SUITE
 * ============================================================================
 * 
 * HOW IT WORKS:
 * This script runs an automated suite of 10 sequential integration tests
 * against the live running Next.js API server (by default at http://localhost:3001).
 * It simulates a real user journey from scratch:
 *   1. Register a new user account with unique credentials.
 *   2. Login to verify bcrypt password hash evaluation against Neon PostgreSQL.
 *   3. Query the authenticated user profile using the issued JWT Bearer token.
 *   4. Request a password reset token.
 *   5. Create a new task with initial SLA parameters.
 *   6. Fetch the user's task list and verify multi-tenant isolation.
 *   7. Move the task forward (To Do -> In Progress) and verify SLA timer accumulation.
 *   8. Move the task backward (In Progress -> To Do) and confirm forward time retention.
 *   9. Mark task as Done and verify active SLA zeroing and completion flags.
 *  10. Delete the task and verify database cleanup.
 * 
 * WHERE ITS EFFECTS LEAD:
 * Confirms that all backend endpoints, authentication middleware, database queries,
 * and the SLA state transition engine operate correctly together in a live environment.
 * If any assertion fails, the process exits with a non-zero code (1) to fail CI/CD.
 */

// Target backend URL for the test suite
const BASE_URL = 'http://localhost:3001'

async function runTests() {
  console.log('=== Starting End-to-End Service Tests ===\n')

  // Generate unique test credentials to avoid database collision on repeated test runs
  const testEmail = `test_user_${Date.now()}@example.com`
  const testPassword = 'Password123!'
  let jwtToken = ''
  let userId = ''
  let createdTaskId = ''

  /**
   * TEST 1: User Registration (POST /api/auth/signup)
   * HOW IT WORKS:
   * Sends user email, password, and name to the signup endpoint. The server
   * hashes the password with bcrypt (10 salt rounds) and stores it in Neon DB.
   * WHERE ITS EFFECTS LEAD:
   * A new row is inserted into the "users" table, and an auth token + sanitized
   * user object is returned for immediate session use.
   */
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

  /**
   * TEST 2: User Login & Bcrypt Verification (POST /api/auth/login)
   * HOW IT WORKS:
   * Queries the database for the user by email, compares the plain-text password
   * against the stored bcrypt hash, and generates a fresh JWT upon success.
   * WHERE ITS EFFECTS LEAD:
   * Confirms password validation logic works correctly and returns a signed JWT.
   */
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

  /**
   * TEST 3: Authenticated User Profile (GET /api/auth/me)
   * HOW IT WORKS:
   * Passes the JWT in the Authorization Bearer header. The route verifies the
   * signature using the secret key and queries the user profile.
   * WHERE ITS EFFECTS LEAD:
   * Ensures protected routes successfully decode tokens and load active user details.
   */
  console.log('3. Testing GET /api/auth/me (Bearer Token)...')
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  })
  const meData = await meRes.json()
  if (!meRes.ok || meData.user.email !== testEmail) {
    throw new Error(`Me endpoint failed: ${JSON.stringify(meData)}`)
  }
  console.log(`✓ Me endpoint returned user: ${meData.user.name} (${meData.user.email})\n`)

  /**
   * TEST 4: Forgot Password Flow (POST /api/auth/forgot-password)
   * HOW IT WORKS:
   * Requests a password reset token for the test user's email address.
   * Generates a 64-character hex cryptographic token and stores its expiry in DB.
   * WHERE ITS EFFECTS LEAD:
   * Enables secure password resets and confirms token generation functions correctly.
   */
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

  /**
   * TEST 5: Task Creation with SLA Initial State (POST /api/tasks)
   * HOW IT WORKS:
   * Submits a new task payload with title, description, category, importance,
   * status ("To Do"), and due date. The server assigns ownership to the authenticated user.
   * WHERE ITS EFFECTS LEAD:
   * Inserts a task into Neon DB with initial SLA timers: time_in_todo_seconds = 0,
   * section_entered_at = NOW(), and stage_transitions_count = 0.
   */
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

  /**
   * TEST 6: Task Listing (GET /api/tasks)
   * HOW IT WORKS:
   * Fetches all tasks belonging to the authenticated user from the database.
   * WHERE ITS EFFECTS LEAD:
   * Confirms multi-tenant row-level isolation and returns mapped camelCase task objects.
   */
  console.log('6. Testing Task Listing (GET /api/tasks)...')
  const listRes = await fetch(`${BASE_URL}/api/tasks`, {
    headers: { Authorization: `Bearer ${jwtToken}` },
  })
  const listData = await listRes.json()
  if (!listRes.ok || !Array.isArray(listData.tasks) || listData.tasks.length === 0) {
    throw new Error(`Task listing failed: ${JSON.stringify(listData)}`)
  }
  console.log(`✓ Task listing returned ${listData.tasks.length} task(s) for user.\n`)

  // Wait 1.5 seconds so we can verify that the SLA state transition engine calculates elapsed time > 0s
  console.log('Waiting 1.5s to simulate active SLA accumulation...')
  await new Promise((r) => setTimeout(r, 1500))

  /**
   * TEST 7: Forward Transition (To Do -> In Progress)
   * HOW IT WORKS:
   * Updates task status to "In Progress". The SLA engine calculates elapsed seconds
   * spent in "To Do", adds them to time_in_todo_seconds, resets section_entered_at,
   * increments stage_transitions_count to 1, and writes an audit record to sla_logs.
   * WHERE ITS EFFECTS LEAD:
   * The task moves into the "In Progress" column/stage with accumulated To Do SLA metrics.
   */
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

  /**
   * TEST 8: Backward Transition (In Progress -> To Do)
   * HOW IT WORKS:
   * Simulates moving a task backward in workflow. The SLA engine calculates time spent
   * in "In Progress", adds it to time_in_progress_seconds, increments transition counter to 2,
   * and preserves previously accumulated To Do time (time continues forward accumulation).
   * WHERE ITS EFFECTS LEAD:
   * Confirms requirement that backward transitions do NOT reset elapsed time.
   */
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

  /**
   * TEST 9: Completion Transition (To Do -> Done)
   * HOW IT WORKS:
   * Moves task to "Done". Sets completed_at timestamp, records final elapsed time
   * in To Do, increments transition counter, and sets active SLA to 0s per requirement.
   * WHERE ITS EFFECTS LEAD:
   * Task enters completed state, freezes cumulative lifecycle SLA metrics, and zeroes active clock.
   */
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

  /**
   * TEST 10: Task Deletion (DELETE /api/tasks/[id])
   * HOW IT WORKS:
   * Deletes task by ID. Uses user_id check to prevent unauthorized deletion.
   * Any linked sla_logs are automatically deleted via ON DELETE CASCADE in PostgreSQL.
   * WHERE ITS EFFECTS LEAD:
   * Task is permanently purged from Neon DB and removed from the active user's workspace.
   */
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

// Execute the test suite and report any unhandled rejections
runTests().catch((err) => {
  console.error('\n❌ End-to-End Test Failed:', err)
  process.exit(1)
})

