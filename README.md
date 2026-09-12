# Addi_chauhan

A student-friendly project repository. As the admin, upload your development
projects — code, screenshots, docs, GitHub links. Students browse, filter,
bookmark, and download the source to study.

```
addi_chauhan/
├── backend/     Node.js + Express API (auth, projects, uploads, admin)
└── frontend/    Plain HTML/CSS/JS single-page app (no build step)
```

## 1. Run the backend

```bash
cd backend
npm install
cp .env.example .env      # then edit JWT_SECRET to a long random string
npm start
```

The API runs at `http://localhost:5000` by default. In production, the backend serves the frontend from the same public URL and uses the platform-provided `PORT`. On first run it seeds:

| Role    | Email                       | Password     |
|---------|------------------------------|--------------|
| Admin   | admin@addichauhan.dev        | Admin@123    |
| Student | student@addichauhan.dev      | Student@123  |

**Change these before deploying anywhere real.** All data lives in
`backend/data/db.json` (a flat JSON file — good enough for a student
project, swap for Postgres/Mongo later if you outgrow it). Uploaded files
are stored under `backend/uploads/`.

## 2. Run the frontend

No build step — it's plain HTML/CSS/JS. Just serve the folder:

```bash
cd frontend
npx serve .
# or: python3 -m http.server 5173
```

Open the printed URL in your browser. For local development, `frontend/js/config.js` points to `localhost:5001`; in production it automatically uses the same origin as the deployed backend.

## 3. What's inside

**Public (no login required):** Home, Projects (search + filter by
category/difficulty/tech), Project detail, Categories, About.

**Student account:** Register, login, logout, forgot/reset password, edit
profile, bookmark projects (♡ Save Project), "My Bookmarks" page,
download source ZIP / documentation PDF for any project.

**Admin account** (`role: "ADMIN"`): Everything above, plus an Admin
Panel to upload/edit/delete projects (title, description, category,
difficulty, technologies, features, problem statement, objective,
GitHub URL, live demo URL, thumbnail, screenshots, source ZIP,
documentation PDF) and to enable/disable individual student accounts.

Role-based access control is enforced **server-side** in
`backend/middleware/auth.js` — the frontend just hides UI a student
shouldn't see; the API is what actually blocks unauthorized requests.

## 4. Making someone an admin

There's no self-serve "become admin" flow (by design). To promote a
registered student, open `backend/data/db.json`, find their user object,
and change `"role": "STUDENT"` to `"role": "ADMIN"`, then restart the
server.

## 5. Notes on the password-reset flow

No email service is wired up. `POST /api/auth/forgot-password` returns
the reset link directly in the API response (and the frontend displays
it) so you can test the flow end-to-end. Wire up a real mail provider
(e.g. Nodemailer + SMTP, Resend, SendGrid) before using this in
production, and stop returning `devResetLink` in the response.

## 6. Deploying

- Recommended starter: deploy `backend/` as a Render Web Service. It now serves `frontend/` from the same service, so there is no separate frontend build/deployment. See `DEPLOYMENT.md`.
- For production persistence, use PostgreSQL/Supabase for `backend/data/db.json` and object storage for `backend/uploads/`.
