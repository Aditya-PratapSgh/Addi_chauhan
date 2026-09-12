const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('../db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const DEST = {
  thumbnail: path.join(UPLOAD_ROOT, 'public', 'thumbnails'),
  screenshots: path.join(UPLOAD_ROOT, 'public', 'screenshots'),
  sourceZip: path.join(UPLOAD_ROOT, 'protected', 'source'),
  docPdf: path.join(UPLOAD_ROOT, 'protected', 'docs'),
};
Object.values(DEST).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, DEST[file.fieldname] || UPLOAD_ROOT);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB, source zips can be chunky
});

const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'screenshots', maxCount: 8 },
  { name: 'sourceZip', maxCount: 1 },
  { name: 'docPdf', maxCount: 1 },
]);

function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function serializeProject(p, req) {
  const base = {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    difficulty: p.difficulty,
    technologies: p.technologies,
    features: p.features,
    problemStatement: p.problemStatement,
    objective: p.objective,
    githubUrl: p.githubUrl,
    liveDemoUrl: p.liveDemoUrl,
    thumbnailUrl: p.thumbnail ? `/uploads/public/thumbnails/${p.thumbnail}` : null,
    screenshotUrls: (p.screenshots || []).map((s) => `/uploads/public/screenshots/${s}`),
    hasSourceZip: !!p.sourceZip,
    hasDocPdf: !!p.docPdf,
    views: p.views || 0,
    downloads: p.downloads || 0,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
  if (req && req.user) {
    base.bookmarked = (req.user.bookmarks || []).includes(p.id);
  }
  return base;
}

// GET /api/projects  — browse + filter
router.get('/', optionalAuth, (req, res) => {
  const { category, tech, difficulty, search } = req.query;
  const db = readDb();
  let list = db.projects;

  if (category) list = list.filter((p) => p.category.toLowerCase() === String(category).toLowerCase());
  if (difficulty) list = list.filter((p) => p.difficulty.toLowerCase() === String(difficulty).toLowerCase());
  if (tech) {
    const t = String(tech).toLowerCase();
    list = list.filter((p) => (p.technologies || []).some((x) => x.toLowerCase() === t));
  }
  if (search) {
    const s = String(search).toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        (p.technologies || []).some((x) => x.toLowerCase().includes(s))
    );
  }

  list = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ projects: list.map((p) => serializeProject(p, req)) });
});

router.get('/categories', (req, res) => {
  const db = readDb();
  const counts = {};
  db.projects.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  res.json({ categories: Object.entries(counts).map(([name, count]) => ({ name, count })) });
});

router.get('/:id', optionalAuth, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });
  res.json({ project: serializeProject(project, req) });
});

// Mark a project as viewed by the current student (called once the detail page opens)
router.post('/:id/view', requireAuth, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const user = db.users.find((u) => u.id === req.user.id);
  user.viewed = user.viewed || [];
  if (!user.viewed.includes(project.id)) {
    user.viewed.push(project.id);
    project.views = (project.views || 0) + 1;
  }
  writeDb(db);
  res.json({ ok: true });
});

router.post('/:id/bookmark', requireAuth, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const user = db.users.find((u) => u.id === req.user.id);
  user.bookmarks = user.bookmarks || [];
  const idx = user.bookmarks.indexOf(project.id);
  let bookmarked;
  if (idx === -1) {
    user.bookmarks.push(project.id);
    bookmarked = true;
  } else {
    user.bookmarks.splice(idx, 1);
    bookmarked = false;
  }
  writeDb(db);
  res.json({ bookmarked });
});

router.get('/:id/download/source', requireAuth, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project || !project.sourceZip) return res.status(404).json({ error: 'No source code file for this project.' });

  const filePath = path.join(DEST.sourceZip, project.sourceZip);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server.' });

  project.downloads = (project.downloads || 0) + 1;
  writeDb(db);

  res.download(filePath, `${project.title.replace(/[^a-z0-9]+/gi, '-')}-source.zip`);
});

router.get('/:id/download/doc', requireAuth, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project || !project.docPdf) return res.status(404).json({ error: 'No documentation file for this project.' });

  const filePath = path.join(DEST.docPdf, project.docPdf);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File missing on server.' });

  res.download(filePath, `${project.title.replace(/[^a-z0-9]+/gi, '-')}-documentation.pdf`);
});

// ---- Admin-only management ----

router.post('/', requireAuth, requireAdmin, uploadFields, (req, res) => {
  const {
    title,
    description,
    category,
    difficulty,
    technologies,
    features,
    problemStatement,
    objective,
    githubUrl,
    liveDemoUrl,
  } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description and category are required.' });
  }

  const files = req.files || {};
  const project = {
    id: uuid(),
    title,
    description,
    category,
    difficulty: difficulty || 'Beginner',
    technologies: toList(technologies),
    features: toList(features),
    problemStatement: problemStatement || '',
    objective: objective || '',
    githubUrl: githubUrl || '',
    liveDemoUrl: liveDemoUrl || '',
    thumbnail: files.thumbnail ? files.thumbnail[0].filename : null,
    screenshots: (files.screenshots || []).map((f) => f.filename),
    sourceZip: files.sourceZip ? files.sourceZip[0].filename : null,
    docPdf: files.docPdf ? files.docPdf[0].filename : null,
    views: 0,
    downloads: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const db = readDb();
  db.projects.push(project);
  writeDb(db);
  res.status(201).json({ project: serializeProject(project, req) });
});

router.put('/:id', requireAuth, requireAdmin, uploadFields, (req, res) => {
  const db = readDb();
  const project = db.projects.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found.' });

  const body = req.body;
  const textFields = [
    'title',
    'description',
    'category',
    'difficulty',
    'problemStatement',
    'objective',
    'githubUrl',
    'liveDemoUrl',
  ];
  textFields.forEach((f) => {
    if (body[f] !== undefined) project[f] = body[f];
  });
  if (body.technologies !== undefined) project.technologies = toList(body.technologies);
  if (body.features !== undefined) project.features = toList(body.features);

  const files = req.files || {};
  if (files.thumbnail) project.thumbnail = files.thumbnail[0].filename;
  if (files.screenshots && files.screenshots.length) {
    project.screenshots = [...(project.screenshots || []), ...files.screenshots.map((f) => f.filename)];
  }
  if (files.sourceZip) project.sourceZip = files.sourceZip[0].filename;
  if (files.docPdf) project.docPdf = files.docPdf[0].filename;

  project.updatedAt = new Date().toISOString();
  writeDb(db);
  res.json({ project: serializeProject(project, req) });
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const db = readDb();
  const idx = db.projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });

  const [removed] = db.projects.splice(idx, 1);
  writeDb(db);

  // best-effort cleanup of uploaded files
  const tryUnlink = (dir, file) => {
    if (!file) return;
    const p = path.join(dir, file);
    fs.unlink(p, () => {});
  };
  tryUnlink(DEST.thumbnail, removed.thumbnail);
  (removed.screenshots || []).forEach((s) => tryUnlink(DEST.screenshots, s));
  tryUnlink(DEST.sourceZip, removed.sourceZip);
  tryUnlink(DEST.docPdf, removed.docPdf);

  res.json({ ok: true });
});

module.exports = router;
