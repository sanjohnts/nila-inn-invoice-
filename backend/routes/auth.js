import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js';

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const signupOpen = () => process.env.ALLOW_SIGNUP !== 'false';

/* slow down password guessing: 20 failed tries per 15 minutes per IP (successful logins are not counted,
   so staff sharing the hotel Wi-Fi do not lock each other out) */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 20, skipSuccessfulRequests: true, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' }
});

function fields(body){
  body = body || {};
  return {
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || '')
  };
}

router.get('/config', (req, res) => {
  res.json({ signup: signupOpen() });
});

router.post('/register', limiter, async (req, res) => {
  if(!signupOpen()) return res.status(403).json({ error: 'New accounts are turned off. Ask the owner to add you.' });
  const { name, email, password } = fields(req.body);
  if(!name) return res.status(400).json({ error: 'Enter your name.' });
  if(!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if(password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  // bcrypt ignores everything after 72 bytes
  if(Buffer.byteLength(password) > 72) return res.status(400).json({ error: 'Password is too long (72 characters at most).' });
  if(await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: user.toPublic() });
});

router.post('/login', limiter, async (req, res) => {
  const { email, password } = fields(req.body);
  if(!email || !password) return res.status(400).json({ error: 'Enter your email and password.' });

  const user = await User.findOne({ email });
  // one message for both cases, so the form does not reveal which emails have accounts
  if(!user || !(await bcrypt.compare(password, user.passwordHash))){
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  setAuthCookie(res, signToken(user));
  res.json({ user: user.toPublic() });
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if(!user){ clearAuthCookie(res); return res.status(401).json({ error: 'Please log in.' }); }
  res.json({ user: user.toPublic() });
});

export default router;
