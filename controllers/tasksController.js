/**
 * Tasks Controller
 * Full CRUD operations for task resources
 */

const { store } = require('../store');
const { validateCreate, validateUpdate } = require('../validators/taskValidator');
const { success, created, noContent, badRequest, notFound } = require('../response');

/**
 * GET /api/tasks
 * List all tasks with optional filtering, search, and sorting
 */
function listTasks(req, res) {
  const { status, priority, tag, search, sortBy, order } = req.query;

  // Validate sort field
  const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'dueDate'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return badRequest(res, `sortBy must be one of: ${validSortFields.join(', ')}`);
  }
  if (order && !['asc', 'desc'].includes(order)) {
    return badRequest(res, "order must be 'asc' or 'desc'");
  }

  const tasks = store.findAll({ status, priority, tag, search, sortBy, order });

  success(res, tasks, 200, {
    count: tasks.length,
    filters: { status, priority, tag, search },
    sort: { sortBy: sortBy || 'createdAt', order: order || 'desc' },
  });
}

/**
 * GET /api/tasks/:id
 * Retrieve a single task by ID
 */
function getTask(req, res) {
  const task = store.findById(req.params.id);
  if (!task) return notFound(res, 'Task');
  success(res, task);
}

/**
 * POST /api/tasks
 * Create a new task
 */
function createTask(req, res) {
  const errors = validateCreate(req.body);
  if (errors.length) return badRequest(res, 'Validation failed', errors);

  const task = store.create(req.body);
  created(res, task);
}

/**
 * PUT /api/tasks/:id
 * Full replacement update of a task
 */
function replaceTask(req, res) {
  const existing = store.findById(req.params.id);
  if (!existing) return notFound(res, 'Task');

  // For PUT, treat as a full replacement — title is required
  const errors = validateCreate(req.body);
  if (errors.length) return badRequest(res, 'Validation failed', errors);

  const task = store.update(req.params.id, {
    title: req.body.title,
    description: req.body.description ?? '',
    status: req.body.status ?? 'todo',
    priority: req.body.priority ?? 'medium',
    tags: req.body.tags ?? [],
    dueDate: req.body.dueDate ?? null,
  });

  success(res, task);
}

/**
 * PATCH /api/tasks/:id
 * Partial update of a task
 */
function updateTask(req, res) {
  const existing = store.findById(req.params.id);
  if (!existing) return notFound(res, 'Task');

  const errors = validateUpdate(req.body);
  if (errors.length) return badRequest(res, 'Validation failed', errors);

  const task = store.update(req.params.id, req.body);
  success(res, task);
}

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
function deleteTask(req, res) {
  const deleted = store.delete(req.params.id);
  if (!deleted) return notFound(res, 'Task');
  noContent(res);
}

/**
 * GET /api/tasks/stats
 * Get task statistics summary
 */
function getStats(req, res) {
  success(res, store.stats());
}

module.exports = { listTasks, getTask, createTask, replaceTask, updateTask, deleteTask, getStats };
