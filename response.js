/**
 * Standardized HTTP response helpers
 */

function sendJSON(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function success(res, data, statusCode = 200, meta = {}) {
  sendJSON(res, statusCode, {
    success: true,
    data,
    ...(Object.keys(meta).length ? { meta } : {}),
    timestamp: new Date().toISOString(),
  });
}

function created(res, data) {
  success(res, data, 201);
}

function noContent(res) {
  res.writeHead(204);
  res.end();
}

function error(res, statusCode, message, details = null) {
  sendJSON(res, statusCode, {
    success: false,
    error: {
      code: statusCode,
      message,
      ...(details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
  });
}

function badRequest(res, message, details = null) {
  error(res, 400, message, details);
}

function notFound(res, resource = 'Resource') {
  error(res, 404, `${resource} not found`);
}

function methodNotAllowed(res) {
  error(res, 405, 'Method not allowed');
}

function serverError(res, message = 'Internal server error') {
  error(res, 500, message);
}

module.exports = { success, created, noContent, badRequest, notFound, methodNotAllowed, serverError, sendJSON };
