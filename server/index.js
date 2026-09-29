/* Nila Inn Residency — backend
   Serves the invoice app and the login page, and handles accounts at /api/auth.
   Only the files listed below are public; .env, server code and .git are never served. */

import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import { readToken } from './middleware/auth.js';

const ROOT = path.join(import.meta.dirname, '..');

try{ process.loadEnvFile(path.join(ROOT, '.env')); }
catch(e){ if(e.code !== 'ENOENT') throw e; /* no .env: use the host's environment variables */ }

for(const key of ['MONGODB_URI', 'JWT_SECRET']){
  if(!process.env[key]){ console.error('Missing ' + key + '. Copy .env.example to .env and fill it in.'); process.exit(1); }
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

/* ---------- api ---------- */
app.use('/api/auth', authRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

/* ---------- pages ---------- */
// the invoice app needs a valid session; no-store so Back after logout does not show a cached copy
app.get('/', (req, res) => {
  if(!readToken(req)) return res.redirect('/login');
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(ROOT, 'index.html'));
});
app.get('/login', (req, res) => {
  if(readToken(req)) return res.redirect('/');
  res.sendFile(path.join(ROOT, 'login', 'login.html'));
});
app.use('/login', express.static(path.join(ROOT, 'login')));
app.use('/images', express.static(path.join(ROOT, 'images')));

/* ---------- errors ---------- */
app.use((err, req, res, next) => {
  if(err.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
  if(err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request.' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const port = process.env.PORT || 3000;
connectDB(process.env.MONGODB_URI, process.env.MONGODB_DB || 'nila_invoice')
  .then(() => app.listen(port, err => {
    if(err){
      console.error(err.code === 'EADDRINUSE' ? 'Port ' + port + ' is already in use. Close the other program using it, or set a different PORT in .env.' : 'Could not start the server: ' + err.message);
      process.exit(1);
    }
    console.log('Nila Inn invoices running at http://localhost:' + port);
  }))
  .catch(err => { console.error('Could not connect to MongoDB: ' + err.message); process.exit(1); });
