const rateLimit = require('express-rate-limit');

// Read defaults from environment with safe fallbacks
const ENV_WINDOW_MS = parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 10);
const ENV_MAX = parseInt(process.env.PUBLIC_RATE_LIMIT_MAX, 10);

const defaultOptions = {
  windowMs: Number.isFinite(ENV_WINDOW_MS) ? ENV_WINDOW_MS : 60 * 1000, // default 1 minute
  max: Number.isFinite(ENV_MAX) ? ENV_MAX : 30, // default 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
};

// createPublicLimiter merges provided opts with environment-aware defaults
const createPublicLimiter = (opts = {}) => rateLimit({ ...defaultOptions, ...opts });

// default limiter uses the environment/defaults
const publicLimiter = createPublicLimiter();

module.exports = {
  publicLimiter,
  createPublicLimiter
};
