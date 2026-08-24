const morgan = require('morgan');

// Custom token: request ID, so every log line can be traced back to a single request
morgan.token('id', (req) => req.id);

// Dev-friendly colored format, with the request ID prefixed
const devFormat = ':id :method :url :status :response-time ms - :res[content-length]';

// Compact, parseable format for production (no color codes)
const prodFormat = JSON.stringify({
  id: ':id',
  method: ':method',
  url: ':url',
  status: ':status',
  responseTimeMs: ':response-time',
  contentLength: ':res[content-length]',
});

const requestLogger = morgan(process.env.NODE_ENV === 'production' ? prodFormat : devFormat);

module.exports = requestLogger;
