/**
 * Request Logger Middleware
 * Structured logging with timing, request IDs, and colorized output
 */

const { randomBytes } = require('crypto');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
};

function colorStatus(code) {
  if (code >= 500) return `${COLORS.red}${code}${COLORS.reset}`;
  if (code >= 400) return `${COLORS.yellow}${code}${COLORS.reset}`;
  if (code >= 300) return `${COLORS.cyan}${code}${COLORS.reset}`;
  return `${COLORS.green}${code}${COLORS.reset}`;
}

function colorMethod(method) {
  const colors = {
    GET: COLORS.blue,
    POST: COLORS.green,
    PUT: COLORS.yellow,
    PATCH: COLORS.magenta,
    DELETE: COLORS.red,
    OPTIONS: COLORS.dim,
  };
  return `${colors[method] || COLORS.white}${method.padEnd(7)}${COLORS.reset}`;
}

function requestLogger(req, res, next) {
  const requestId = req.headers['x-request-id'] || randomBytes(4).toString('hex');
  const startTime = Date.now();

  req.requestId = requestId;
  req.startTime = startTime;

  // Attach request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  const now = new Date().toISOString();
  process.stdout.write(
    `${COLORS.dim}${now}${COLORS.reset} ` +
      `${colorMethod(req.method)} ` +
      `${COLORS.white}${req.pathname || req.url}${COLORS.reset} ` +
      `${COLORS.dim}[${requestId}]${COLORS.reset}\n`
  );

  // Intercept writeHead to capture status code
  const originalWriteHead = res.writeHead.bind(res);
  res.writeHead = function (statusCode, headers) {
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);

    const logLine =
      `${COLORS.dim}${new Date().toISOString()}${COLORS.reset} ` +
      `${colorMethod(req.method)} ` +
      `${COLORS.white}${req.pathname || req.url}${COLORS.reset} ` +
      `${colorStatus(statusCode)} ` +
      `${COLORS.dim}+${duration}ms [${requestId}]${COLORS.reset}\n`;

    process.stdout.write(logLine);

    return originalWriteHead(statusCode, headers);
  };

  next();
}

module.exports = { requestLogger };
