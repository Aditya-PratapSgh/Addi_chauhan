require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { seed } = require('./seed');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const bookmarkRoutes = require('./routes/bookmarks');

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_only_secret_change_me';
  console.warn('JWT_SECRET not set in .env — using an insecure default for local dev only.');
}

seed();

const app = express();
const allowedOrigin = process.env.CLIENT_ORIGIN || true;
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '2mb' }));

// Serve the plain HTML/CSS/JS frontend from the same Node service in production.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Publicly served images (thumbnails, screenshots) — safe to expose directly.
app.use('/uploads/public', express.static(path.join(__dirname, 'uploads', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bookmarks', bookmarkRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'Addi_chauhan API', time: new Date().toISOString() }));

// SPA entry point. Hash routes (/#/projects, /#/login, etc.) are handled by the client.
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

app.use((err, req, res, next) => {
  console.error(err);
  if (err && err.message && err.message.includes('File too large')) {
    return res.status(413).json({ error: 'That file is too large to upload.' });
  }
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Addi_chauhan API running on port ${PORT}`);
});
