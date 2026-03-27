/**
 * TaskFlow Lite API Server
 * Built with Node.js built-in http module (no external dependencies)
 */

const http = require('http');
const { router } = require('./router');
const { corsMiddleware } = require('./middleware/cors');
const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Middleware pipeline
const middlewares = [corsMiddleware, requestLogger];



async function handleRequest(req, res) {
  // 1️⃣ Parse query string + pathname FIRST
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(urlObj.searchParams);
  req.pathname = urlObj.pathname;

  // 2️⃣ Serve index.html
  if (req.pathname === '/' || req.pathname === '/index.html') {
    const fs = require('fs');
    const html = fs.readFileSync('./public/taskflow-lite-frontend.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // 3️⃣ Parse body AFTER static check
  req.body = await parseBody(req);

  // 4️⃣ Run middleware
  try {
    for (const mw of middlewares) {
      await new Promise((resolve, reject) => {
        mw(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    // 5️⃣ Route
    await router(req, res);
  } catch (err) {
    errorHandler(err, req, res);
  }
}
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║       TaskFlow Lite API  v1.0.0        ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║  Server  → http://${HOST}:${PORT}          ║`);
  console.log(`║  Health  → GET /api/health             ║`);
  console.log(`║  Tasks   → /api/tasks                  ║`);
  console.log('╚════════════════════════════════════════╝\n');
});

module.exports = { server };
