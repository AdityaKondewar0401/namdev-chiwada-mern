require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Process-level safety net ──────────────────────────
// Errors thrown outside the Express request/response cycle (e.g. inside
// a fire-and-forget async callback, a timer, a stray `.then()` with no
// `.catch()`) never reach errorHandler.js at all — Node just logs a
// generic warning (or, in newer Node versions, crashes silently) with no
// context about which request or code path caused it. These two handlers
// make sure EVERY error gets a full stack trace in the server logs no
// matter where it originated, then exits so the process manager
// (Railway) restarts to a clean state rather than continuing to run with
// potentially corrupted internal state.
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception (process will exit):', err.stack || err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Promise Rejection (process will exit):', reason?.stack || reason);
  process.exit(1);
});

// ── Trust proxy ────────────────────────────────────────
// Railway (and most PaaS hosts) sit behind a reverse proxy, so the real
// client IP arrives in X-Forwarded-For rather than as the raw socket
// address. Without this, express-rate-limit's per-IP limiters would key
// on the proxy's IP for every request — meaning ALL users would share
// one rate-limit bucket. `1` trusts exactly one hop (the platform's own
// proxy), which is the correct/safe value for Railway-style single-proxy
// deployments. Configurable in case the topology changes later (e.g.
// behind an additional CDN/load balancer, which would need `2`).
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 1));

// ── CORS ───────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://namdev-chiwada-mern.vercel.app',
  'https://namdev-chiwada-mern-adityakondewar0401s-projects.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

// Allow all Vercel preview deployments
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.vercel.app')) return true; // ← allows ALL vercel URLs
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked: ${origin}`);
      // Deliberately generic — doesn't echo the caller's own origin back
      // to them, and marked safe-to-expose via errorHandler's `err.expose`
      // convention so it doesn't fall through to the raw-message default.
      const err = new Error('This origin is not allowed to access this API.');
      err.statusCode = 403;
      err.expose = true;
      callback(err);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle preflight requests for all routes
app.options('*', cors());

// ── Middleware ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static Files ───────────────────────────────────────
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/upload',   require('./routes/upload'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/shipping', require('./routes/shipping'));

// ── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Namdev Chiwada API running 🎉',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/test', (req, res) => {
  res.json({ status: 'Server working ✅' });
});

// ── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ── Error Handler (must be last) ───────────────────────
app.use(errorHandler);

// ── Start Server After DB Connects ────────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  });