/* The session is a signed JWT kept in an httpOnly cookie, so page scripts can never read it. */
import jwt from 'jsonwebtoken';

export const COOKIE = 'nila_token';
const DAYS = 7;

function cookieOptions(){
  return { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
}

export function signToken(user){
  return jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: DAYS + 'd' });
}

export function setAuthCookie(res, token){
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: DAYS * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookie(res){
  res.clearCookie(COOKIE, cookieOptions());
}

/* token payload, or null when the cookie is missing, expired or tampered with */
export function readToken(req){
  const token = req.cookies && req.cookies[COOKIE];
  if(!token) return null;
  try{ return jwt.verify(token, process.env.JWT_SECRET); }catch{ return null; }
}

export function requireAuth(req, res, next){
  const payload = readToken(req);
  if(!payload) return res.status(401).json({ error: 'Please log in.' });
  req.userId = payload.sub;
  next();
}
