# SignPortal — Technical capability & architecture notes

Engineering-oriented snapshot of **stack**, **API surface**, **persistence model**, and **implementation gaps**. For directory-level file index see [CODEBASE.md](CODEBASE.md); for operator setup see [README.md](README.md).

---

## Stack

| Layer | Technology |
|--------|------------|
| API | **Node.js**, **Express** 4.x, `express.json` / `urlencoded` |
| Persistence | **SQLite 3** via `sqlite3` driver; path from `DB_PATH` or default `backend/signingportal.db` |
| Auth | **JWT** (`jsonwebtoken`), passwords hashed with **bcryptjs** |
| File ingest | **Multer** (`utils/fileHandler.js`) for multipart uploads; binary body stored per feature (see below) |
| SPA | **React**, **Vite**, **React Router**, **axios** (`services/api.js`) |
| Client config | `VITE_API_URL` or default `http://localhost:5000/api` |

---

## Backend layout

**Entry:** `backend/src/server.js` — CORS (localhost + optional `CORS_ORIGIN`), mounts routers, global error handler, `GET /api/health`.

**Routers** (all prefixed by mount path):

| Mount | Module | Responsibility |
|--------|--------|----------------|
| `/api/auth` | `routes/auth.js` | Register, login, `GET /me` |
| `/api/documents` | `routes/documents.js` | CRUD-ish document lifecycle, upload, list, download |
| `/api/documents` | `routes/documentVersions.js` | `/:id/versions` signed version upload/list/download |
| `/api/workflow` | `routes/workflow.js` | Stage progression, approvals |
| `/api/signatures` | `routes/signatures.js` | Signature records tied to stages |
| `/api` | `routes/attachments.js` | `POST/GET /documents/:id/attachments`, `GET/DELETE /attachments/...` |
| `/api/notifications` | `routes/notifications.js` | In-app notifications CRUD/read state |

**Controllers** mirror the above filenames under `controllers/`; **middleware** includes `middleware/auth.js` (JWT verification), `middleware/roles.js`, `middleware/classificationAuth.js` for sensitive document rules.

**Workflow shape:** partly driven by `config/workflowTemplates.js` and related logic (not necessarily a user-authored template DSL in the UI).

---

## Authentication flow (technical)

1. `POST /api/auth/login` validates credentials and returns a JWT.  
2. Client stores token (e.g. `localStorage`) and sends `Authorization: Bearer <token>` on API calls (`api.js` request interceptor).  
3. Protected routes call `authenticateToken`; role-gated operations use role middleware.  
4. On **401**, axios response interceptor clears stored credentials and navigates to `/login`.

There is **no refresh-token rotation** or **httpOnly cookie** session in the stock design—treat as a known deployment consideration.

---

## Data model (SQLite)

Schema source of truth: `backend/src/config/schema.sql`. **Foreign keys** enabled in `database.js` (`PRAGMA foreign_keys = ON`).

**Core tables:**

- **`users`** — `role` ∈ `personnel` | `authority` | `admin`; profile fields (e.g. rank, unit).  
- **`documents`** — File payload in **`file_data` BLOB** (not only filesystem); `status` ∈ `pending` | `in_progress` | `completed` | `rejected`; optional classification, priority, **`deadline`**, version counter, `current_stage_name`.  
- **`workflow_stages`** — Ordered stages per document; `required_role`, `assigned_to`, `deadline`, `rejection_reason`, signed-upload flags.  
- **`signatures`** — `signature_data` BLOB, `type` `canvas` | `upload`, links to `workflow_stage_id` + `user_id`.  
- **`document_attachments`** — Additional BLOB files per document.  
- **`document_versions`** — Versioned signed uploads per document/stage.  
- **`notifications`** — Per-user rows with `is_read`, optional links to document/stage.  
- **`document_history`** — Audit-style action log.  
- **`workflow_comments`** — Stage-scoped comments.

Indexes are declared for common filters (status, deadlines, FK lookups). Application code in `utils/dbHelper.js` and controllers executes parameterized SQL against the shared `db` handle.

---

## Frontend architecture

- **Bootstrap:** `main.jsx` → `App.jsx` wraps `AuthProvider`, `ToastProvider`, `BrowserRouter`.  
- **Routing:** Public `/`, `/login`, `/register`; authenticated routes wrap `ProtectedRoute` + `Layout`; `/admin` uses `requiredRole="admin"` (see `App.jsx`).  
- **State:** Auth and toasts via React Context; server state fetched per view with `documentsAPI`, `authAPI`, etc.  
- **Notifications UI:** `NotificationCenter.jsx` polls notification endpoints on an interval.  
- **Constants:** `utils/constants.js` mirrors document/stage statuses and role strings for UI consistency.

---

## Cross-cutting behavior

- **CORS:** Configured for local dev ports; production should narrow origins.  
- **Errors:** Central Express error middleware returns JSON `{ error: message }`; HTTP 404 for unknown routes.  
- **Testing:** `backend/scripts/testFunctionality.js` invoked by `npm run test` (smoke-level API checks—not a full Jest/pyramid).

---

## Implemented vs. outstanding (technical)

**Roughly implemented end-to-end:** JWT auth + role checks, document upload/list/download with BLOB storage, workflow stages, signatures, attachments, document versions, notifications table + API + UI polling, dashboard aggregates, classification middleware hooks where used.

**Thin or absent (typical backlog):**

- Admin SPA beyond placeholder; user/org admin APIs if not extended.  
- Outbound **email** (SMTP), WebSocket/SSE for live notifications.  
- **OAuth2/OIDC**, MFA, password-reset tokens, email verification flows.  
- **OpenAPI** spec, formal API versioning, **rate limiting**, structured security headers (CSP, HSTS).  
- Comprehensive **FE unit / E2E** automation in CI.  
- Rich **preview** pipelines (PDF.js, etc.) and server-side full-text search.  
- Magic-byte file validation, antivirus integration, moving large BLOBs to object storage.

---

## Related references

| Resource | Use |
|----------|-----|
| [CODEBASE.md](CODEBASE.md) | File-level map |
| [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) | Permission behavior |
| [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) | Running smoke tests |
| [backend/src/config/schema.sql](backend/src/config/schema.sql) | Full DDL |

---

*Last updated: 2026-03-23*
