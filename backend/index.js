/* Nila Inn Residency — backend
   API server for authentication (/api/auth) and serving the frontend application. */

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import User from './models/User.js';

const BACKEND_DIR = import.meta.dirname;
const ROOT = path.join(BACKEND_DIR, '..');

// Load .env from backend folder or project root
const envFiles = [
  path.join(BACKEND_DIR, '.env'),
  path.join(ROOT, '.env')
];

for (const envFile of envFiles) {
  if (fs.existsSync(envFile)) {
    try {
      process.loadEnvFile(envFile);
      break;
    } catch (e) {
      if (e.code !== 'ENOENT') console.warn('Warning loading env file:', e.message);
    }
  }
}

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

/* ---------- security & performance middleware ---------- */
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,  // disable CSP in dev for Vite HMR
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// CORS configuration
const allowedOrigins = isProduction
  ? [
      process.env.CLIENT_URL,
      'https://invoice.nilainnresidency.com',
      'https://api.nilainnresidency.com',
      'https://www.nilainnresidency.com',
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ---------- api ---------- */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);

// Static assets (like hotel emblem) from frontend
const frontendPublicImages = path.join(ROOT, 'frontend', 'public', 'images');
const frontendDistImages = path.join(ROOT, 'frontend', 'dist', 'images');

if (fs.existsSync(frontendDistImages)) {
  app.use('/images', express.static(frontendDistImages));
} else if (fs.existsSync(frontendPublicImages)) {
  app.use('/images', express.static(frontendPublicImages));
}

// Serve production React build if present
const frontendDist = path.join(ROOT, 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/{*splat}', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

/* ---------- errors ---------- */
app.use((err, req, res, next) => {
  if (err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
  if (!isProduction) console.error(err);
  else console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// Auto-seed admin user if no users exist in database
async function autoSeedAdmin() {
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@nilainn.com').toLowerCase().trim();
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
      const adminName = process.env.ADMIN_NAME || 'Admin';
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await User.create({ name: adminName, email: adminEmail, passwordHash });
      console.log(`\n✔ Auto-seeded default admin account:`);
      console.log(`  Email:    ${adminEmail}`);
      console.log(`  Password: ********** (set via ADMIN_PASSWORD env var)\n`);
    }
  } catch (e) {
    console.warn('Auto-seed check notice:', e.message);
  }
}

const port = process.env.PORT || 3000;
connectDB(process.env.MONGODB_URI, process.env.MONGODB_DB || 'nila_invoice')
  .then(async () => {
    await autoSeedAdmin();
    const server = app.listen(port, err => {
      if (err) {
        console.error(err.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the other program using it, or set a different PORT in .env.` : `Could not start the server: ${err.message}`);
        process.exit(1);
      }
      console.log(`Nila Inn backend API running at http://localhost:${port} [${isProduction ? 'production' : 'development'}]`);
    });

    // Graceful shutdown
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => { console.error('Forced shutdown.'); process.exit(1); }, 10000);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  })
  .catch(err => {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  });
