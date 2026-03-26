/**
 * Centralized Error Handler Middleware
 */

const { serverError } = require('../response');

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

function errorHandler(err, req, res) {
  const requestId = req.requestId || 'unknown';

  // Log the error
  console.error(`\n[ERROR] [${requestId}] ${err.message}`);
  if (!err.isOperational) {
    console.error(err.stack);
  }

  if (err.isOperational) {
    const { sendJSON } = require('../response');
    sendJSON(res, err.statusCode, {
      success: false,
      error: {
        code: err.statusCode,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
      timestamp: new Date().toISOString(),
    });
  } else {
    serverError(res, 'An unexpected error occurred');
  }
}

module.exports = { errorHandler, AppError };
