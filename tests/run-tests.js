/**
 * TaskFlow Lite API - Automated Test Suite
 * Uses Node.js built-in http module — no test framework required
 * Run: node tests/run-tests.js
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let passed = 0;
let failed = 0;
let createdId = null;

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ─── Assertion Helpers ────────────────────────────────────────────────────────

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, label) {
  assert(actual === expected, `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ─── Test Runner ──────────────────────────────────────────────────────────────

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    → ${err.message}`);
  }
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n📋 Health Endpoint');

  await test('GET /api/health returns 200', async () => {
    const r = await request('GET', '/api/health');
    assertEqual(r.status, 200, 'status');
    assert(r.body.success === true, 'success flag');
    assert(r.body.data.status === 'healthy', 'health status');
  });
}

async function testListTasks() {
  console.log('\n📋 List Tasks');

  await test('GET /api/tasks returns 200 with array', async () => {
    const r = await request('GET', '/api/tasks');
    assertEqual(r.status, 200, 'status');
    assert(Array.isArray(r.body.data), 'data is array');
    assert(r.body.meta.count >= 0, 'meta.count present');
  });

  await test('GET /api/tasks?status=todo filters correctly', async () => {
    const r = await request('GET', '/api/tasks?status=todo');
    assertEqual(r.status, 200, 'status');
    assert(r.body.data.every((t) => t.status === 'todo'), 'all tasks are todo');
  });

  await test('GET /api/tasks?priority=high filters correctly', async () => {
    const r = await request('GET', '/api/tasks?priority=high');
    assertEqual(r.status, 200, 'status');
    assert(r.body.data.every((t) => t.priority === 'high'), 'all tasks are high priority');
  });

  await test('GET /api/tasks?search=design returns filtered results', async () => {
    const r = await request('GET', '/api/tasks?search=design');
    assertEqual(r.status, 200, 'status');
    assert(Array.isArray(r.body.data), 'data is array');
  });

  await test('GET /api/tasks?sortBy=invalid returns 400', async () => {
    const r = await request('GET', '/api/tasks?sortBy=invalid');
    assertEqual(r.status, 400, 'status');
    assert(r.body.success === false, 'success flag is false');
  });
}

async function testCreateTask() {
  console.log('\n📋 Create Task');

  await test('POST /api/tasks creates task and returns 201', async () => {
    const r = await request('POST', '/api/tasks', {
      title: 'Test Task from Automated Suite',
      description: 'Created by the automated test runner',
      status: 'todo',
      priority: 'high',
      tags: ['testing', 'automated'],
      dueDate: '2026-12-31',
    });
    assertEqual(r.status, 201, 'status');
    assert(r.body.success === true, 'success flag');
    assert(r.body.data.id, 'task has id');
    assert(r.body.data.createdAt, 'task has createdAt');
    createdId = r.body.data.id;
  });

  await test('POST /api/tasks without title returns 400', async () => {
    const r = await request('POST', '/api/tasks', { description: 'No title here' });
    assertEqual(r.status, 400, 'status');
    assert(r.body.success === false, 'success is false');
    assert(Array.isArray(r.body.error.details), 'validation errors returned');
  });

  await test('POST /api/tasks with invalid status returns 400', async () => {
    const r = await request('POST', '/api/tasks', { title: 'Bad Status', status: 'flying' });
    assertEqual(r.status, 400, 'status');
  });

  await test('POST /api/tasks with invalid priority returns 400', async () => {
    const r = await request('POST', '/api/tasks', { title: 'Bad Priority', priority: 'ultra' });
    assertEqual(r.status, 400, 'status');
  });

  await test('POST /api/tasks with invalid dueDate returns 400', async () => {
    const r = await request('POST', '/api/tasks', { title: 'Bad Date', dueDate: 'not-a-date' });
    assertEqual(r.status, 400, 'status');
  });

  await test('POST /api/tasks with empty body returns 400', async () => {
    const r = await request('POST', '/api/tasks', {});
    assertEqual(r.status, 400, 'status');
  });
}

async function testGetTask() {
  console.log('\n📋 Get Single Task');

  await test('GET /api/tasks/:id returns task', async () => {
    assert(createdId, 'need a createdId from previous test');
    const r = await request('GET', `/api/tasks/${createdId}`);
    assertEqual(r.status, 200, 'status');
    assertEqual(r.body.data.id, createdId, 'id matches');
  });

  await test('GET /api/tasks/nonexistent returns 404', async () => {
    const r = await request('GET', '/api/tasks/task_does_not_exist_xyz');
    assertEqual(r.status, 404, 'status');
    assert(r.body.success === false, 'success is false');
  });
}

async function testUpdateTask() {
  console.log('\n📋 Update Task (PATCH)');

  await test('PATCH /api/tasks/:id updates specific fields', async () => {
    const r = await request('PATCH', `/api/tasks/${createdId}`, {
      status: 'in-progress',
      priority: 'medium',
    });
    assertEqual(r.status, 200, 'status');
    assertEqual(r.body.data.status, 'in-progress', 'status updated');
    assertEqual(r.body.data.priority, 'medium', 'priority updated');
  });

  await test('PATCH /api/tasks/:id with empty body returns 400', async () => {
    const r = await request('PATCH', `/api/tasks/${createdId}`, {});
    assertEqual(r.status, 400, 'status');
  });

  await test('PATCH /api/tasks/:id with invalid status returns 400', async () => {
    const r = await request('PATCH', `/api/tasks/${createdId}`, { status: 'purple' });
    assertEqual(r.status, 400, 'status');
  });

  await test('PATCH /api/tasks/nonexistent returns 404', async () => {
    const r = await request('PATCH', '/api/tasks/task_does_not_exist_xyz', { status: 'done' });
    assertEqual(r.status, 404, 'status');
  });

  await test('PATCH blocks updating read-only field id', async () => {
    const r = await request('PATCH', `/api/tasks/${createdId}`, { id: 'hacked_id' });
    assertEqual(r.status, 400, 'status');
  });
}

async function testReplaceTask() {
  console.log('\n📋 Replace Task (PUT)');

  await test('PUT /api/tasks/:id fully replaces task', async () => {
    const r = await request('PUT', `/api/tasks/${createdId}`, {
      title: 'Fully Replaced Task',
      description: 'Replaced via PUT',
      status: 'done',
      priority: 'low',
      tags: ['replaced'],
    });
    assertEqual(r.status, 200, 'status');
    assertEqual(r.body.data.title, 'Fully Replaced Task', 'title updated');
    assertEqual(r.body.data.status, 'done', 'status updated');
  });

  await test('PUT /api/tasks/:id without title returns 400', async () => {
    const r = await request('PUT', `/api/tasks/${createdId}`, { status: 'todo' });
    assertEqual(r.status, 400, 'status');
  });

  await test('PUT /api/tasks/nonexistent returns 404', async () => {
    const r = await request('PUT', '/api/tasks/nonexistent_xyz', { title: 'Ghost Task' });
    assertEqual(r.status, 404, 'status');
  });
}

async function testStats() {
  console.log('\n📋 Task Stats');

  await test('GET /api/tasks/stats returns statistics', async () => {
    const r = await request('GET', '/api/tasks/stats');
    assertEqual(r.status, 200, 'status');
    assert(typeof r.body.data.total === 'number', 'total is number');
    assert(r.body.data.byStatus, 'byStatus present');
    assert(r.body.data.byPriority, 'byPriority present');
  });
}

async function testDeleteTask() {
  console.log('\n📋 Delete Task');

  await test('DELETE /api/tasks/:id returns 204', async () => {
    const r = await request('DELETE', `/api/tasks/${createdId}`);
    assertEqual(r.status, 204, 'status');
  });

  await test('GET /api/tasks/:id after delete returns 404', async () => {
    const r = await request('GET', `/api/tasks/${createdId}`);
    assertEqual(r.status, 404, 'status');
  });

  await test('DELETE /api/tasks/nonexistent returns 404', async () => {
    const r = await request('DELETE', '/api/tasks/task_does_not_exist_xyz');
    assertEqual(r.status, 404, 'status');
  });
}

async function testCORS() {
  console.log('\n📋 CORS & Headers');

  await test('Response includes X-Request-ID header', async () => {
    const r = await request('GET', '/api/health');
    assert(r.headers['x-request-id'], 'X-Request-ID header present');
  });

  await test('Response includes Access-Control-Allow-Origin', async () => {
    const r = await request('GET', '/api/health');
    assert(r.headers['access-control-allow-origin'], 'CORS header present');
  });
}

async function testNotFound() {
  console.log('\n📋 Edge Cases');

  await test('Unknown endpoint returns 404', async () => {
    const r = await request('GET', '/api/unknown-endpoint');
    assertEqual(r.status, 404, 'status');
    assert(r.body.success === false, 'success is false');
  });

  await test('Wrong method on known route returns 405', async () => {
    const r = await request('DELETE', '/api/tasks'); // DELETE on collection not allowed
    assertEqual(r.status, 405, 'status');
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║  TaskFlow Lite API — Test Suite v1.0.0  ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Target: ${BASE}`);

  // Wait for server to be ready
  await new Promise((res) => setTimeout(res, 500));

  try {
    await testHealth();
    await testListTasks();
    await testCreateTask();
    await testGetTask();
    await testUpdateTask();
    await testReplaceTask();
    await testStats();
    await testDeleteTask();
    await testCORS();
    await testNotFound();
  } catch (err) {
    console.error('\nFatal test error:', err.message);
  }

  const total = passed + failed;
  console.log('\n─────────────────────────────────────────');
  console.log(`  Results: ${passed}/${total} tests passed`);
  if (failed > 0) {
    console.log(`  ✗ ${failed} test(s) failed`);
  } else {
    console.log('  ✓ All tests passed!');
  }
  console.log('─────────────────────────────────────────\n');

  process.exit(failed > 0 ? 1 : 0);
}

main();
