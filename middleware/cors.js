/**
 * CORS Middleware
 * Handles cross-origin requests for TaskFlow Lite frontend clients
 */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',');

function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;

  // Determine allowed origin
  let allowedOrigin = '*';
  if (ALLOWED_ORIGINS[0] !== '*' && origin) {
    allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : false;
  }

  if (allowedOrigin === false) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: { code: 403, message: 'CORS: Origin not allowed' } }));
    return;
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24h preflight cache
  res.setHeader('Vary', 'Origin');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  next();
}

module.exports = { corsMiddleware };
