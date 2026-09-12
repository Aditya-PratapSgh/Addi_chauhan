const jwt = require('jsonwebtoken');
const { readDb } = require('../db');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Sign in to continue.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.id);
    if (!user) return res.status(401).json({ error: 'This account no longer exists.' });
    if (user.active === false) {
      return res.status(403).json({ error: 'Your access has been disabled by an admin.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admins only.' });
  }
  next();
}

// Populates req.user if a valid token is present, but never blocks the request.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const db = readDb();
    const user = db.users.find((u) => u.id === payload.id);
    if (user && user.active !== false) req.user = user;
  } catch (err) {
    /* ignore invalid token for optional auth */
  }
  next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
