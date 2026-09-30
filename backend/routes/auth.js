import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../middleware/auth.js';

const router = Router();

/* Rate limit: 20 failed login attempts per 15 minutes per IP */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again in a few minutes.' }
});

function fields(body) {
  body = body || {};
  return {
    email: String(body.email || '').trim().toLowerCase(),
    password: String(body.password || '')
  };
}

router.post('/login', limiter, async (req, res) => {
  const { email, password } = fields(req.body);
  if (!email || !password) {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
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
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Please log in.' });
  }
  res.json({ user: user.toPublic() });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Enter your current password and a new password.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  if (Buffer.byteLength(newPassword) > 72) {
    return res.status(400).json({ error: 'Password is too long (72 characters at most).' });
  }

  const user = await User.findById(req.userId);
  if (!user) {
    clearAuthCookie(res);
    return res.status(401).json({ error: 'Please log in again.' });
  }

  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  setAuthCookie(res, signToken(user));
  res.json({ ok: true, message: 'Password updated successfully.' });
});

export default router;
