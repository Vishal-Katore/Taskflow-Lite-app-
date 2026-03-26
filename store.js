/**
 * In-Memory Data Store
 * Thread-safe task storage with full CRUD support
 * (Designed to be swapped for a real DB in the next phase)
 */

function generateId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const VALID_STATUSES = ['todo', 'in-progress', 'done'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];

class TaskStore {
  constructor() {
    this._tasks = new Map();
    this._seed();
  }

  _seed() {
    const seeds = [
      {
        title: 'Set up project repository',
        description: 'Initialize Git repo and configure CI/CD pipeline',
        status: 'done',
        priority: 'high',
        tags: ['devops', 'setup'],
        dueDate: '2026-01-10',
      },
      {
        title: 'Design API schema',
        description: 'Define RESTful endpoints and request/response models',
        status: 'done',
        priority: 'high',
        tags: ['backend', 'api'],
        dueDate: '2026-01-15',
      },
      {
        title: 'Implement authentication',
        description: 'Add JWT-based auth middleware and user sessions',
        status: 'in-progress',
        priority: 'high',
        tags: ['security', 'backend'],
        dueDate: '2026-02-28',
      },
      {
        title: 'Write unit tests',
        description: 'Cover all controllers and middleware with >80% coverage',
        status: 'todo',
        priority: 'medium',
        tags: ['testing', 'quality'],
        dueDate: '2026-03-10',
      },
      {
        title: 'Deploy to production',
        description: 'Configure cloud infrastructure and deploy v1.0',
        status: 'todo',
        priority: 'medium',
        tags: ['devops', 'deployment'],
        dueDate: '2026-03-20',
      },
    ];

    seeds.forEach((seed) => {
      const id = generateId();
      const now = new Date().toISOString();
      this._tasks.set(id, {
        id,
        ...seed,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  findAll({ status, priority, tag, search, sortBy = 'createdAt', order = 'desc' } = {}) {
    let tasks = Array.from(this._tasks.values());

    if (status) tasks = tasks.filter((t) => t.status === status);
    if (priority) tasks = tasks.filter((t) => t.priority === priority);
    if (tag) tasks = tasks.filter((t) => t.tags?.includes(tag));
    if (search) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    tasks.sort((a, b) => {
      const valA = a[sortBy] ?? '';
      const valB = b[sortBy] ?? '';
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0;
      return order === 'asc' ? cmp : -cmp;
    });

    return tasks;
  }

  findById(id) {
    return this._tasks.get(id) || null;
  }

  create(data) {
    const id = generateId();
    const now = new Date().toISOString();
    const task = {
      id,
      title: data.title.trim(),
      description: data.description?.trim() || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      tags: Array.isArray(data.tags) ? data.tags.map((t) => t.trim().toLowerCase()) : [],
      dueDate: data.dueDate || null,
      createdAt: now,
      updatedAt: now,
    };
    this._tasks.set(id, task);
    return task;
  }

  update(id, data) {
    const existing = this._tasks.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.tags !== undefined && {
        tags: Array.isArray(data.tags) ? data.tags.map((t) => t.trim().toLowerCase()) : existing.tags,
      }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
      updatedAt: new Date().toISOString(),
    };

    this._tasks.set(id, updated);
    return updated;
  }

  delete(id) {
    if (!this._tasks.has(id)) return false;
    this._tasks.delete(id);
    return true;
  }

  stats() {
    const tasks = Array.from(this._tasks.values());
    return {
      total: tasks.length,
      byStatus: {
        todo: tasks.filter((t) => t.status === 'todo').length,
        'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
        done: tasks.filter((t) => t.status === 'done').length,
      },
      byPriority: {
        low: tasks.filter((t) => t.priority === 'low').length,
        medium: tasks.filter((t) => t.priority === 'medium').length,
        high: tasks.filter((t) => t.priority === 'high').length,
      },
    };
  }
}

const store = new TaskStore();

module.exports = { store, VALID_STATUSES, VALID_PRIORITIES };
