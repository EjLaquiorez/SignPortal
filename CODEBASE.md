# SignPortal — Codebase map

Companion to [README.md](README.md). This document describes **what** each area of the repository is for and **where** it lives.

---

## Top level

| Path | Purpose |
|------|---------|
| [README.md](README.md) | How to run and use the project |
| [CODEBASE.md](CODEBASE.md) | This file — layout of the code |
| [INTERFACE_FUNCTIONALITY_CHECKLIST.md](INTERFACE_FUNCTIONALITY_CHECKLIST.md) | Feature checklist and improvement ideas |
| [package.json](package.json) | Root npm scripts (e.g. `npm run stop` for dev servers) |
| [stop-servers.ps1](stop-servers.ps1) / [stop-servers.bat](stop-servers.bat) | Stop processes bound to dev ports (Windows) |
| `backend/` | Express API, SQLite, file uploads |
| `frontend/` | React (Vite) single-page app |
| `samples/` | Sample JSON data and usage guides for seeding/testing |
| `presentation-guidelines/` | Presentation prep notes (often git-ignored) |

**Runtime / local data (usually not committed):**

- `backend/signingportal.db` — SQLite database (path from `DB_PATH` in `.env`)
- `backend/uploads/` (or `UPLOAD_DIR`) — Stored document and upload files

---

## Backend (`backend/`)

### Entry and wiring

| File | Purpose |
|------|---------|
| [src/server.js](backend/src/server.js) | Express app: CORS, JSON body parser, mounts all `/api/...` routes, health check, error + 404 handlers, starts HTTP server |

**API base:** routes are mounted under `/api` (see table below).

### Config (`backend/src/config/`)

| File | Purpose |
|------|---------|
| [database.js](backend/src/config/database.js) | SQLite connection, exports `db` for queries |
| [initDatabase.js](backend/src/config/initDatabase.js) | Run by `npm run init-db` — applies [schema.sql](backend/src/config/schema.sql), seeds default admin |
| [schema.sql](backend/src/config/schema.sql) | Table definitions and indexes |
| [workflowTemplates.js](backend/src/config/workflowTemplates.js) | Workflow template definitions used when creating workflows |
| [unitHierarchy.js](backend/src/config/unitHierarchy.js) | Organizational/unit hierarchy data for PNP-style features |

### Routes (`backend/src/routes/`)

Each file defines Express routers; paths below are **relative to `/api`** after mounting in `server.js`.

| File | Mounted at | Purpose |
|------|------------|---------|
| [auth.js](backend/src/routes/auth.js) | `/api/auth` | Register, login, current user (`/me`) |
| [documents.js](backend/src/routes/documents.js) | `/api/documents` | Document CRUD, upload, list, download, status |
| [documentVersions.js](backend/src/routes/documentVersions.js) | `/api/documents` | Signed version upload, list versions, download version |
| [workflow.js](backend/src/routes/workflow.js) | `/api/workflow` | Workflow stages, progression, approvals |
| [signatures.js](backend/src/routes/signatures.js) | `/api/signatures` | Create/list signatures for documents |
| [attachments.js](backend/src/routes/attachments.js) | `/api` | Attachments: `POST/GET .../documents/:id/attachments`, download/delete by attachment id |
| [notifications.js](backend/src/routes/notifications.js) | `/api/notifications` | User notifications |

### Controllers (`backend/src/controllers/`)

Request handlers called from routes (business logic + DB + file operations).

| File | Typical responsibility |
|------|-------------------------|
| [authController.js](backend/src/controllers/authController.js) | Registration, login, JWT issue, profile |
| [documentController.js](backend/src/controllers/documentController.js) | Documents: create, list, detail, download, updates |
| [documentVersionController.js](backend/src/controllers/documentVersionController.js) | Versioned signed files per document |
| [workflowController.js](backend/src/controllers/workflowController.js) | Workflow state, stages, approve/reject flows |
| [signatureController.js](backend/src/controllers/signatureController.js) | Saving and retrieving signature records |
| [attachmentController.js](backend/src/controllers/attachmentController.js) | Extra files attached to a document |
| [notificationController.js](backend/src/controllers/notificationController.js) | Listing/updating notifications |

### Middleware (`backend/src/middleware/`)

| File | Purpose |
|------|---------|
| [auth.js](backend/src/middleware/auth.js) | Validates JWT, attaches user to request |
| [roles.js](backend/src/middleware/roles.js) | Role checks (e.g. admin-only) layered after auth |
| [classificationAuth.js](backend/src/middleware/classificationAuth.js) | Access rules for classified/sensitive document handling |

### Utils (`backend/src/utils/`)

| File | Purpose |
|------|---------|
| [fileHandler.js](backend/src/utils/fileHandler.js) | Multer config (upload directory, limits, filters) |
| [dbHelper.js](backend/src/utils/dbHelper.js) | Small DB query helpers |
| [documentAccess.js](backend/src/utils/documentAccess.js) | Who may read/update a document by role/rules |
| [trackingNumber.js](backend/src/utils/trackingNumber.js) | Generates tracking/reference numbers |
| [deadlineService.js](backend/src/utils/deadlineService.js) | Deadline-related logic for workflows/documents |

### Scripts (`backend/scripts/`)

Run with `node scripts/<file>.js` from `backend/` or via `npm run` entries in [backend/package.json](backend/package.json).

| File | Purpose |
|------|---------|
| [testFunctionality.js](backend/scripts/testFunctionality.js) | `npm run test` — automated smoke tests |
| [seedSampleUsers.js](backend/scripts/seedSampleUsers.js) | `npm run seed-users` |
| [seedSampleDocuments.js](backend/scripts/seedSampleDocuments.js) | `npm run seed-documents` |
| [resetAdminPassword.js](backend/scripts/resetAdminPassword.js) | `npm run reset-admin` |
| [viewDatabase.js](backend/scripts/viewDatabase.js) | `npm run view-db` — inspect DB contents |
| [migrateToPNP.js](backend/scripts/migrateToPNP.js) | One-off migration toward PNP-oriented schema/fields |
| [migrateToVersioning.js](backend/scripts/migrateToVersioning.js) | One-off migration for document versioning |
| [deletePendingDocuments.js](backend/scripts/deletePendingDocuments.js) | Utility to clear pending documents |
| [sampleUsers.json](backend/scripts/sampleUsers.json) / [sampleUsers.txt](backend/scripts/sampleUsers.txt) | Sample user data for seeding |

### Backend docs (`backend/docs/`)

| File | Purpose |
|------|---------|
| [TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) | How to run and interpret tests |
| [ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) | Permissions and security behavior |
| [SAMPLE_USERS.md](backend/docs/SAMPLE_USERS.md) | Example accounts for manual testing |

---

## Frontend (`frontend/`)

### Entry and shell

| File | Purpose |
|------|---------|
| [index.html](frontend/index.html) | HTML shell for Vite |
| [vite.config.js](frontend/vite.config.js) | Vite bundler config |
| [src/main.jsx](frontend/src/main.jsx) | React root render |
| [src/index.css](frontend/src/index.css) | Global base styles |
| [src/App.jsx](frontend/src/App.jsx) | `BrowserRouter`, providers, route table |
| [src/utils/constants.js](frontend/src/utils/constants.js) | e.g. `API_BASE_URL` for axios |

### Context (`frontend/src/context/`)

| File | Purpose |
|------|---------|
| [AuthContext.jsx](frontend/src/context/AuthContext.jsx) | Login state, user, token (e.g. localStorage), `getMe` |
| [ToastContext.jsx](frontend/src/context/ToastContext.jsx) | App-wide toast notifications |

### API layer (`frontend/src/services/`)

| File | Purpose |
|------|---------|
| [api.js](frontend/src/services/api.js) | Axios instance, auth header, 401 redirect; exports `authAPI`, `documentsAPI`, workflow/signature/notification helpers |

### Routing and guards

| File | Purpose |
|------|---------|
| [components/ProtectedRoute.jsx](frontend/src/components/ProtectedRoute.jsx) | Wraps children if logged in; optional `requiredRole` (e.g. admin) |

**URL → page** (from `App.jsx`):

| Path | Page component | Notes |
|------|----------------|--------|
| `/` | [pages/Home.jsx](frontend/src/pages/Home.jsx) | Public landing |
| `/login` | [components/Auth/Login.jsx](frontend/src/components/Auth/Login.jsx) | Public |
| `/register` | [components/Auth/Register.jsx](frontend/src/components/Auth/Register.jsx) | Public |
| `/dashboard` | [pages/Dashboard.jsx](frontend/src/pages/Dashboard.jsx) | Auth + layout |
| `/upload` | [pages/UploadDocument.jsx](frontend/src/pages/UploadDocument.jsx) | Auth + layout |
| `/documents` | [pages/Documents.jsx](frontend/src/pages/Documents.jsx) | Auth + layout |
| `/documents/:id` | [pages/DocumentDetail.jsx](frontend/src/pages/DocumentDetail.jsx) | Auth + layout |
| `/pending` | [pages/PendingApprovals.jsx](frontend/src/pages/PendingApprovals.jsx) | Auth + layout |
| `/admin` | [pages/Admin.jsx](frontend/src/pages/Admin.jsx) | Auth + **admin** role |

### Layout (`frontend/src/components/Layout/`)

| File | Purpose |
|------|---------|
| [Layout.jsx](frontend/src/components/Layout/Layout.jsx) | Page chrome around authenticated views |
| [Sidebar.jsx](frontend/src/components/Layout/Sidebar.jsx) | Navigation |
| [Header.jsx](frontend/src/components/Layout/Header.jsx) | Top bar |

### Pages (`frontend/src/pages/`)

| File | Purpose |
|------|---------|
| [Home.jsx](frontend/src/pages/Home.jsx) | Marketing / intro |
| [Dashboard.jsx](frontend/src/pages/Dashboard.jsx) | Stats and quick links |
| [Documents.jsx](frontend/src/pages/Documents.jsx) | Document list |
| [UploadDocument.jsx](frontend/src/pages/UploadDocument.jsx) | New upload form + file input |
| [DocumentDetail.jsx](frontend/src/pages/DocumentDetail.jsx) | Single document: workflow, sign, versions, actions |
| [PendingApprovals.jsx](frontend/src/pages/PendingApprovals.jsx) | Items awaiting user action |
| [Admin.jsx](frontend/src/pages/Admin.jsx) | Admin-only tools |

### Feature components

**Auth** — `frontend/src/components/Auth/`

| File | Purpose |
|------|---------|
| [Login.jsx](frontend/src/components/Auth/Login.jsx) | Login form |
| [Register.jsx](frontend/src/components/Auth/Register.jsx) | Registration form |

**Documents** — `frontend/src/components/Documents/`

| File | Purpose |
|------|---------|
| [DocumentList.jsx](frontend/src/components/Documents/DocumentList.jsx) | List UI |
| [DocumentUpload.jsx](frontend/src/components/Documents/DocumentUpload.jsx) | Reusable upload UI |
| [DocumentPreview.jsx](frontend/src/components/Documents/DocumentPreview.jsx) | Inline preview |
| [DocumentViewer.jsx](frontend/src/components/Documents/DocumentViewer.jsx) | Viewer |
| [DocumentViewerModal.jsx](frontend/src/components/Documents/DocumentViewerModal.jsx) | Modal viewer |
| [DocumentVersions.jsx](frontend/src/components/Documents/DocumentVersions.jsx) | Version list / controls |

**Workflow** — `frontend/src/components/Workflow/`

| File | Purpose |
|------|---------|
| [WorkflowStages.jsx](frontend/src/components/Workflow/WorkflowStages.jsx) | Stage pipeline UI |
| [StageCard.jsx](frontend/src/components/Workflow/StageCard.jsx) | One stage |
| [UploadSignedVersion.jsx](frontend/src/components/Workflow/UploadSignedVersion.jsx) | Upload new signed file version |

**Signature** — `frontend/src/components/Signature/`

| File | Purpose |
|------|---------|
| [SignaturePad.jsx](frontend/src/components/Signature/SignaturePad.jsx) | Draw signature |
| [SignatureDisplay.jsx](frontend/src/components/Signature/SignatureDisplay.jsx) | Show stored signature |

**Notifications** — `frontend/src/components/Notifications/`

| File | Purpose |
|------|---------|
| [NotificationCenter.jsx](frontend/src/components/Notifications/NotificationCenter.jsx) | Notification UI |

**UI primitives** — `frontend/src/components/ui/`

| File | Purpose |
|------|---------|
| [Button.jsx](frontend/src/components/ui/Button.jsx) | Button |
| [Input.jsx](frontend/src/components/ui/Input.jsx) | Text input |
| [Card.jsx](frontend/src/components/ui/Card.jsx) | Card container |
| [Badge.jsx](frontend/src/components/ui/Badge.jsx) | Status badges |
| [Loading.jsx](frontend/src/components/ui/Loading.jsx) | Spinner / full-screen load |
| [Skeleton.jsx](frontend/src/components/ui/Skeleton.jsx) | Placeholder skeleton |
| [EmptyState.jsx](frontend/src/components/ui/EmptyState.jsx) | Empty list message |
| [Toast.jsx](frontend/src/components/ui/Toast.jsx) | Toast UI |
| [ConfirmationModal.jsx](frontend/src/components/ui/ConfirmationModal.jsx) | Confirm dialog |
| [Icon.jsx](frontend/src/components/ui/Icon.jsx) | Icons |
| [PNPLogo.jsx](frontend/src/components/ui/PNPLogo.jsx) | Logo asset component |

### Styles (`frontend/src/styles/`)

| File | Purpose |
|------|---------|
| [theme.css](frontend/src/styles/theme.css) | Theme variables / tokens |
| [responsive.css](frontend/src/styles/responsive.css) | Breakpoints and responsive rules |

---

## Samples (`samples/`)

| Path | Purpose |
|------|---------|
| [README.md](samples/README.md) | Overview of sample data |
| [SEEDING_GUIDE.md](samples/SEEDING_GUIDE.md) / [USAGE_GUIDE.md](samples/USAGE_GUIDE.md) / [FILE_LIST.md](samples/FILE_LIST.md) | How to use sample files |
| `data/sampleDocuments.json` | Example document metadata |
| `data/sampleWorkflows.json` | Example workflow data |

---

## How the pieces connect (short)

1. **Browser** loads the Vite app from `frontend/`; React Router picks a **page** under `pages/`.
2. **Pages** call **`services/api.js`**, which sends HTTP requests to **`http://localhost:5000/api/...`** (or whatever `API_BASE_URL` is).
3. **`server.js`** dispatches to **routes** → **controllers** → **SQLite** via **`config/database.js`** and **`utils/`**; files go through **`fileHandler.js`** to disk.
4. **JWT** from login is stored client-side and sent as `Authorization`; **`middleware/auth.js`** validates it on protected API routes.

---

## Presentation guidelines (`presentation-guidelines/`)

Optional, local-only docs for demos and slides (see folder README if present). Not required to run the app.

---

*Regenerate or extend this file when you add new routes, pages, or major folders.*
