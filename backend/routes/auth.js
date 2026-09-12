const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
    bookmarks: u.bookmarks || [],
    viewed: u.viewed || [],
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are all required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password needs to be at least 6 characters.' });
  }
  const db = readDb();
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with that email already exists.' });

  const user = {
    id: uuid(),
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role: 'STUDENT',
    active: true,
    bookmarks: [],
    viewed: [],
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  writeDb(db);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  if (user.active === false) {
    return res.status(403).json({ error: 'Your access has been disabled by an admin.' });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

// Stateless JWT — logout is handled client-side by discarding the token.
// This endpoint exists so the frontend has a consistent call to make.
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out.' });
});

router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());

  // Always respond the same way so we don't leak which emails exist.
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link has been generated.' });
  }

  const resetToken = uuid();
  user.resetToken = resetToken;
  user.resetTokenExpiry = Date.now() + 1000 * 60 * 30; // 30 minutes
  writeDb(db);

  // No email service is wired up in this demo, so the reset link is
  // returned directly. In production, email this link instead.
  res.json({
    message: 'If that email exists, a reset link has been generated.',
    devResetLink: `/#/reset-password?token=${resetToken}`,
  });
});

router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Reset token and a new password are required.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password needs to be at least 6 characters.' });

  const db = readDb();
  const user = db.users.find((u) => u.resetToken === token);
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
  }

  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  delete user.resetToken;
  delete user.resetTokenExpiry;
  writeDb(db);

  res.json({ message: 'Password updated. You can sign in now.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/profile', requireAuth, (req, res) => {
  const { name } = req.body;
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (name) user.name = name;
  writeDb(db);
  res.json({ user: publicUser(user) });
});

module.exports = router;
