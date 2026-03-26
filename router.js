/**
 * Router
 * Maps incoming requests to the appropriate controller action
 */

const { listTasks, getTask, createTask, replaceTask, updateTask, deleteTask, getStats } = require('./controllers/tasksController');
const { health } = require('./controllers/healthController');
const { methodNotAllowed, notFound } = require('./response');

// Route definition: [method, pattern, handler]
// Patterns support :param segments
const routes = [
  ['GET',    '/api/health',        health],
  ['GET',    '/api/tasks/stats',   getStats],
  ['GET',    '/api/tasks',         listTasks],
  ['POST',   '/api/tasks',         createTask],
  ['GET',    '/api/tasks/:id',     getTask],
  ['PUT',    '/api/tasks/:id',     replaceTask],
  ['PATCH',  '/api/tasks/:id',     updateTask],
  ['DELETE', '/api/tasks/:id',     deleteTask],
];

/**
 * Convert a route pattern to a regex and extract param names
 * e.g. '/api/tasks/:id' → { regex: /^\/api\/tasks\/([^/]+)$/, params: ['id'] }
 */
function compileRoute(pattern) {
  const paramNames = [];
  const regexStr = pattern.replace(/:([a-zA-Z_]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  return { regex: new RegExp(`^${regexStr}$`), paramNames };
}

// Pre-compile all routes
const compiledRoutes = routes.map(([method, pattern, handler]) => ({
  method,
  handler,
  ...compileRoute(pattern),
}));

async function router(req, res) {
  const path = req.pathname;
  const method = req.method.toUpperCase();

  // Find matching routes (ignoring method first to detect 405)
  const pathMatches = [];

  for (const route of compiledRoutes) {
    const match = path.match(route.regex);
    if (!match) continue;

    // Extract named params
    const params = {};
    route.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    pathMatches.push({ route, params });

    if (route.method === method) {
      req.params = params;
      return await route.handler(req, res);
    }
  }

  if (pathMatches.length > 0) {
    return methodNotAllowed(res);
  }

  return notFound(res, 'Endpoint');
}

module.exports = { router };
