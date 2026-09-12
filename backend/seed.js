const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { readDb, writeDb } = require('./db');

const THUMB_DIR = path.join(__dirname, 'uploads', 'public', 'thumbnails');

function placeholderSvg(label, hue) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue},70%,22%)"/>
        <stop offset="100%" stop-color="hsl(${hue + 40},70%,12%)"/>
      </linearGradient>
    </defs>
    <rect width="640" height="400" fill="url(#g)"/>
    <text x="40" y="220" font-family="monospace" font-size="28" fill="#E6E9F0">${label}</text>
    <text x="40" y="260" font-family="monospace" font-size="14" fill="#8B93A7">// thumbnail placeholder</text>
  </svg>`;
}

function seed() {
  const db = readDb();
  if (db.users.length || db.projects.length) return; // already seeded

  fs.mkdirSync(THUMB_DIR, { recursive: true });

  const admin = {
    id: uuid(),
    name: 'Addi Chauhan',
    email: process.env.ADMIN_EMAIL || 'admin@addichauhan.dev',
    passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10),
    role: 'ADMIN',
    active: true,
    bookmarks: [],
    viewed: [],
    createdAt: new Date().toISOString(),
  };

  const demoStudent = {
    id: uuid(),
    name: 'Demo Student',
    email: process.env.STUDENT_EMAIL || 'student@addichauhan.dev',
    passwordHash: bcrypt.hashSync(process.env.STUDENT_PASSWORD || 'Student@123', 10),
    role: 'STUDENT',
    active: true,
    bookmarks: [],
    viewed: [],
    createdAt: new Date().toISOString(),
  };

  const sampleProjects = [
    {
      title: 'TaskFlow — Kanban Task Manager',
      description:
        'A drag-and-drop kanban board for teams, with boards, lists, cards, due dates and activity history. Built to teach real-world state management patterns.',
      category: 'Web Development',
      difficulty: 'Intermediate',
      technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Socket.io'],
      features: ['Drag & drop boards', 'Real-time sync across tabs', 'Due dates & labels', 'Activity log'],
      problemStatement: 'Small teams need a lightweight, self-hostable alternative to heavyweight project trackers.',
      objective: 'Teach full-stack CRUD, WebSocket sync, and optimistic UI updates.',
      githubUrl: 'https://github.com/example/taskflow',
      liveDemoUrl: '',
      hue: 260,
    },
    {
      title: 'CampusMart — Peer-to-Peer Marketplace',
      description:
        'A marketplace where students list and buy used textbooks, gadgets and furniture within their own campus, with chat and saved searches.',
      category: 'Web Development',
      difficulty: 'Advanced',
      technologies: ['Next.js', 'PostgreSQL', 'Prisma', 'Tailwind CSS', 'Stripe'],
      features: ['Listing creation with images', 'In-app chat', 'Saved searches', 'Campus-based filtering'],
      problemStatement: 'Campus buy-sell groups on chat apps are unsearchable and get cluttered fast.',
      objective: 'Practice relational schema design, server actions, and payment integration basics.',
      githubUrl: 'https://github.com/example/campusmart',
      liveDemoUrl: '',
      hue: 190,
    },
    {
      title: 'PixelSort — Sorting Algorithm Visualizer',
      description:
        'An interactive visualizer that animates bubble sort, quick sort, merge sort and heap sort side by side, with adjustable speed and array size.',
      category: 'DSA & Algorithms',
      difficulty: 'Beginner',
      technologies: ['JavaScript', 'HTML5 Canvas', 'CSS'],
      features: ['Four algorithms side by side', 'Adjustable speed & array size', 'Comparison/swap counters'],
      problemStatement: 'Sorting algorithms are hard to grasp from pseudocode alone.',
      objective: 'Practice canvas rendering and algorithm implementation without a framework.',
      githubUrl: 'https://github.com/example/pixelsort',
      liveDemoUrl: '',
      hue: 20,
    },
    {
      title: 'InvenTrack — Inventory Management System',
      description:
        'A desktop-style inventory system for small shops: stock levels, low-stock alerts, supplier records and sales reports with charts.',
      category: 'Java Projects',
      difficulty: 'Intermediate',
      technologies: ['Java', 'JavaFX', 'MySQL', 'JDBC'],
      features: ['Low-stock alerts', 'Supplier records', 'Sales reports with charts', 'Role-based logins'],
      problemStatement: 'Small retail shops often track stock on paper or spreadsheets, causing stockouts.',
      objective: 'Practice JDBC, JavaFX UI building and relational database design.',
      githubUrl: 'https://github.com/example/inventrack',
      liveDemoUrl: '',
      hue: 140,
    },
    {
      title: 'ChatSphere — Real-Time Chat App',
      description:
        'A real-time messaging app with rooms, typing indicators, read receipts and file sharing, built to demonstrate WebSocket architecture.',
      category: 'Web Development',
      difficulty: 'Intermediate',
      technologies: ['React', 'Express', 'Socket.io', 'Redis'],
      features: ['Public & private rooms', 'Typing indicators', 'Read receipts', 'File sharing'],
      problemStatement: 'Understanding real-time architecture is hard without a hands-on reference build.',
      objective: 'Teach WebSocket event design and Redis pub/sub for horizontal scaling.',
      githubUrl: 'https://github.com/example/chatsphere',
      liveDemoUrl: '',
      hue: 300,
    },
    {
      title: 'ML Churn Predictor',
      description:
        'A machine learning pipeline and dashboard that predicts customer churn from usage data, with a Flask API serving the trained model.',
      category: 'Machine Learning',
      difficulty: 'Advanced',
      technologies: ['Python', 'scikit-learn', 'Pandas', 'Flask', 'React'],
      features: ['Trained classification model', 'Feature importance charts', 'REST prediction API', 'Upload-to-predict UI'],
      problemStatement: 'Subscription businesses need early warning signs before a customer cancels.',
      objective: 'Practice the full ML lifecycle: cleaning, training, evaluating and serving a model.',
      githubUrl: 'https://github.com/example/churn-predictor',
      liveDemoUrl: '',
      hue: 45,
    },
  ];

  const projects = sampleProjects.map((sp) => {
    const id = uuid();
    const filename = `${id}.svg`;
    fs.writeFileSync(path.join(THUMB_DIR, filename), placeholderSvg(sp.title.split(' — ')[0], sp.hue));
    return {
      id,
      title: sp.title,
      description: sp.description,
      category: sp.category,
      difficulty: sp.difficulty,
      technologies: sp.technologies,
      features: sp.features,
      problemStatement: sp.problemStatement,
      objective: sp.objective,
      githubUrl: sp.githubUrl,
      liveDemoUrl: sp.liveDemoUrl,
      thumbnail: filename,
      screenshots: [],
      sourceZip: null,
      docPdf: null,
      views: Math.floor(Math.random() * 40),
      downloads: Math.floor(Math.random() * 15),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  db.users.push(admin, demoStudent);
  db.projects.push(...projects);
  writeDb(db);

  console.log('Seeded database with a default admin, a demo student and sample projects.');
  console.log(`  Admin login:   ${admin.email} / [password set via environment]`);
  console.log(`  Student login: ${demoStudent.email} / [password set via environment]`);
}

module.exports = { seed };
