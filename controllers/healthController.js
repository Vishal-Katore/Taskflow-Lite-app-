/**
 * Health Controller
 * System health and uptime monitoring
 */

const { success } = require('../response');
const { store } = require('../store');

const startTime = Date.now();

function health(req, res) {
  const stats = store.stats();
  success(res, {
    status: 'healthy',
    service: 'TaskFlow Lite API',
    version: '1.0.0',
    uptime: `${Math.floor((Date.now() - startTime) / 1000)}s`,
    store: {
      type: 'in-memory',
      tasks: stats.total,
    },
    environment: process.env.NODE_ENV || 'development',
  });
}

module.exports = { health };
