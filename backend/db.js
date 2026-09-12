// Minimal file-based JSON "database". Good enough for a small project
// repository app; swap for Postgres/Mongo later without touching routes
// much since everything goes through the functions below.
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], projects: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], projects: [] };
  }
}

// naive write lock so two rapid requests don't clobber each other
let writing = Promise.resolve();
function writeDb(data) {
  writing = writing.then(
    () => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  );
  return writing;
}

module.exports = { readDb, writeDb, ensureDb, DB_PATH };
