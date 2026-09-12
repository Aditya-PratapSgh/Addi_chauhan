# Deployment guide — Render (low-cost starter)

This version is prepared so the Node/Express backend serves the existing plain HTML/CSS/JS frontend from the same public URL. No frontend build step is required.

## Render
1. Put this folder in a GitHub repository.
2. In Render, create a Web Service from the repository.
3. Set **Root Directory** to `backend`.
4. Build Command: `npm ci`
5. Start Command: `npm start`
6. Add environment variables:
   - `JWT_SECRET` = a long random secret (or let Render generate it).
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_ORIGIN` = your final Render URL, e.g. `https://your-name.onrender.com`
   - `SEED_DEMO` = `true` for first-time/demo deployment.
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` = your private admin credentials.
   - `STUDENT_EMAIL` / `STUDENT_PASSWORD` = optional demo student credentials.
7. Deploy. Open the Render URL.
8. Verify `https://YOUR-URL/api/health` returns JSON with `ok: true`.

## Important storage note
The app still uses the existing JSON database and local `uploads/` folders. This is convenient for a demo/college project, but **free cloud instances may use ephemeral disks**, so uploaded projects can be lost after a restart/redeploy. For a real public library, move `backend/data/db.json` to PostgreSQL/Supabase and uploaded ZIP/PDF files to persistent object storage (Supabase Storage, S3-compatible storage, etc.).

## Security
- Do not commit `.env`.
- Change all demo credentials before public use.
- Do not expose reset tokens/dev reset links in a production password-reset flow.
- Keep source ZIP downloads behind the existing authenticated API.
