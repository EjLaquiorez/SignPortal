# SignPortal — Technical capability & architecture notes

Engineering snapshot: **stack**, **API**, **SQLite model**, **auth**, **gaps**. File index: [CODEBASE.md](CODEBASE.md). Setup: [README.md](README.md).

---

## Contents

1. [Local development commands](#local-development-commands)  
2. [Stack](#stack)  
3. [Backend layout](#backend-layout)  
4. [Authentication flow](#authentication-flow-technical)  
5. [Data model (SQLite)](#data-model-sqlite)  
6. [Frontend architecture](#frontend-delivery)  
7. [Cross-cutting behavior](#cross-cutting-behavior)  
8. [Implemented vs. outstanding](#implemented-vs-outstanding-technical)  
9. [Related references](#related-references)  

---

## Local development commands

Typical **two-terminal** flow (no project `Makefile`; use **npm** from each package).

| Step | Where | Command |
|------|--------|---------|
| Install API deps | `backend/` | `npm install` |
| Create DB + schema | `backend/` | `npm run init-db` |
| Run API | `backend/` | `npm run dev` → `http://localhost:5000` (default `PORT`) |
| Smoke tests | `backend/` | `npm run test` |
| Install UI deps | `frontend/` | `npm install` |
| Run SPA | `frontend/` | `npm run dev` → Vite (e.g. `5173`); set `VITE_API_URL` if API is not default |
| Stop dev servers (Windows / root script) | repo root | `npm run stop` (see [README.md](README.md)) |

---

## Stack

| Layer | Technology |
|--------|------------|
| API | **Node.js**, **Express** 4.x, `express.json` / `urlencoded` |
| Persistence | **SQLite 3** via `sqlite3` driver; path from `DB_PATH` or default `backend/signingportal.db` |
| Auth | **JWT** (`jsonwebtoken`), passwords hashed with **bcryptjs** |
| File ingest | **Multer** (`utils/fileHandler.js`) with **`memoryStorage`** (buffers); controllers persist binaries to SQLite **BLOB** columns (not a primary filesystem store) |
| SPA | **React**, **Vite**, **React Router**, **axios** (`services/api.js`) |
| Client config | `VITE_API_URL` or default `http://localhost:5000/api` |

---

## Backend layout

**Entry:** `backend/src/server.js` — CORS (localhost + optional `CORS_ORIGIN`), mounts routers, global error handler, `GET /api/health`.

**Routers** (mount paths):

| Mount | Module | Responsibility |
|--------|--------|----------------|
| `/api/auth` | `routes/auth.js` | Register, login, `GET /me` |
| `/api/documents` | `routes/documents.js` | Document lifecycle, upload, list, download |
| `/api/documents` | `routes/documentVersions.js` | `/:id/versions` signed version upload/list/download |
| `/api/workflow` | `routes/workflow.js` | Stage progression, approvals |
| `/api/signatures` | `routes/signatures.js` | Signature records tied to stages |
| `/api` | `routes/attachments.js` | `POST/GET …/documents/:id/attachments`, `GET/DELETE …/attachments/…` |
| `/api/notifications` | `routes/notifications.js` | In-app notifications |

**Controllers** under `controllers/`; **middleware:** `auth.js`, `roles.js`, `classificationAuth.js`.

**Workflow:** `config/workflowTemplates.js`; optional org context via `config/unitHierarchy.js`.

---

## Authentication flow (technical)

1. `POST /api/auth/login` → JWT in response body.  
2. Client stores token (e.g. `localStorage`); `api.js` sends `Authorization: Bearer <token>`.  
3. Protected routers use `authenticateToken`; role checks via `roles` middleware where applied.  
4. `401` response → interceptor clears storage and sends user to `/login`.

**Not in repo:** refresh tokens, httpOnly cookie sessions — plan explicitly if you deploy beyond local dev.

---

## Data model (SQLite)

**DDL:** `backend/src/config/schema.sql`. **FKs:** `PRAGMA foreign_keys = ON` in `database.js`.

| Table | Role |
|-------|------|
| `users` | Accounts; `role` ∈ `personnel` \| `authority` \| `admin` |
| `documents` | Primary file in `file_data` BLOB; `status`, classification, priority, `deadline`, version fields |
| `workflow_stages` | Ordered stages; `assigned_to`, `deadline`, `rejection_reason`, signed-upload flags |
| `signatures` | `signature_data` BLOB; `signature_type` ∈ `canvas` \| `upload` |
| `document_attachments` | Extra BLOB files per document |
| `document_versions` | Versioned signed uploads |
| `notifications` | Per-user; `is_read`; links to document/stage |
| `document_history` | Action audit rows |
| `workflow_comments` | Comments per stage |

**Access:** parameterized SQL from `utils/dbHelper.js` and controllers against the shared `db` export.

---

## Frontend delivery

- **Bootstrap:** `main.jsx` → `App.jsx` → `AuthProvider`, `ToastProvider`, `BrowserRouter`.  
- **Routes:** Public `/`, `/login`, `/register`; authenticated routes use `ProtectedRoute` + `Layout`; `/admin` uses `requiredRole="admin"`.  
- **Data:** Context for auth/toasts; view-level fetches via `authAPI`, `documentsAPI`, workflow/signature/notification helpers.  
- **Notifications:** `NotificationCenter.jsx` polls the notifications API.  
- **Shared constants:** `utils/constants.js` (roles, document/stage status strings).

---

## Cross-cutting behavior

- **CORS:** `http://localhost:*`, or `CORS_ORIGIN` (comma-separated); default list includes Vite `5173` / `5174`. Restrict in production.  
- **Environment:** `PORT`, `JWT_SECRET`, `DB_PATH`, optional `CORS_ORIGIN` ([README.md](README.md)). Multer limit in `fileHandler.js` (e.g. 50MB).  
- **Errors:** JSON `{ error: message }`; 404 JSON for unknown routes.  
- **Tests:** `npm run test` → `scripts/testFunctionality.js` (API smoke, not full CI pyramid).  
- **DB init:** `npm run init-db` → `config/initDatabase.js` applies `schema.sql`.

---

## Implemented vs. outstanding (technical)

**In place:** JWT + role checks; documents CRUD/upload with BLOB storage; workflows; signatures; attachments; document versions; notifications API + UI polling; dashboard; classification middleware where wired.

**Common gaps:** Real admin UI/API surface; SMTP/email and WebSocket notifications; OAuth/MFA/password-reset flows; OpenAPI; rate limits + security headers; FE unit/E2E; PDF preview + server search; magic-byte AV scan; external object storage for large binaries.

---

## Related references

| Resource | Use |
|----------|-----|
| [CODEBASE.md](CODEBASE.md) | Per-folder file map |
| [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) | Permissions |
| [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) | Smoke tests |
| [backend/src/config/schema.sql](backend/src/config/schema.sql) | DDL |
| [samples/](samples/) | Seed / sample data |

---

*Last updated: 2026-03-28*
