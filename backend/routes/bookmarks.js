const express = require('express');
const { readDb } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, (req, res) => {
  const db = readDb();
  const ids = req.user.bookmarks || [];
  const projects = db.projects
    .filter((p) => ids.includes(p.id))
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      difficulty: p.difficulty,
      technologies: p.technologies,
      thumbnailUrl: p.thumbnail ? `/uploads/public/thumbnails/${p.thumbnail}` : null,
      bookmarked: true,
    }));
  res.json({ projects });
});

module.exports = router;
