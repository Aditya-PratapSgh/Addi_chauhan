const express = require('express');
const { readDb, writeDb } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/students', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const students = db.users
    .filter((u) => u.role === 'STUDENT')
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active !== false,
      createdAt: u.createdAt,
      projectsViewed: (u.viewed || []).length,
      projectsBookmarked: (u.bookmarks || []).length,
    }));
  res.json({ students });
});

router.put('/students/:id/status', requireAuth, requireAdmin, (req, res) => {
  const { active } = req.body;
  const db = readDb();
  const student = db.users.find((u) => u.id === req.params.id && u.role === 'STUDENT');
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  student.active = !!active;
  writeDb(db);
  res.json({ ok: true, active: student.active });
});

router.get('/stats', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  res.json({
    totalProjects: db.projects.length,
    totalStudents: db.users.filter((u) => u.role === 'STUDENT').length,
    totalDownloads: db.projects.reduce((sum, p) => sum + (p.downloads || 0), 0),
    totalViews: db.projects.reduce((sum, p) => sum + (p.views || 0), 0),
  });
});

module.exports = router;
