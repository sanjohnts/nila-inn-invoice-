/* Nila Inn Residency — backend
   API server for authentication (/api/auth) and serving the frontend application. */

import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';

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
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// CORS configuration for React dev server and client
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL
  ].filter(Boolean);

  if (origin && (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

/* ---------- api ---------- */
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
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = process.env.PORT || 3000;
connectDB(process.env.MONGODB_URI, process.env.MONGODB_DB || 'nila_invoice')
  .then(() => app.listen(port, err => {
    if (err) {
      console.error(err.code === 'EADDRINUSE' ? `Port ${port} is already in use. Close the other program using it, or set a different PORT in .env.` : `Could not start the server: ${err.message}`);
      process.exit(1);
    }
    console.log(`Nila Inn backend API running at http://localhost:${port}`);
  }))
  .catch(err => {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  });
