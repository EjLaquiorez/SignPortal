# SignPortal — Educational architecture guide

This document teaches **how SignPortal is put together** so you can read the code with context: what “full-stack” means here, how a browser call reaches the database, and **why** common patterns (JWT, REST, SQLite BLOBs) appear in this project.

**Use it when:** learning the codebase, preparing a technical talk, or debugging (“where should this check live—API, DB, or UI?”).  
**For:** a file-by-file map → [CODEBASE.md](CODEBASE.md). For install steps → [README.md](README.md).

---

## What you should be able to do after reading this

- Explain the **path of one user action** from React → HTTP → Express → SQL → back to the UI.  
- Say why the app uses a **SPA + REST API** instead of server-rendered pages only.  
- Name the main **tables** and how **documents**, **workflow stages**, and **signatures** relate.  
- List **conscious tradeoffs** (e.g. JWT in localStorage, files in SQLite) and what you’d change for production.

---

## Big picture: how the system is organized

**SignPortal** is a **single-page application (SPA)** in the browser (React) that talks to a **separate HTTP API** (Express on Node). The API owns **business rules**, **authentication**, and **persistence**. The database is **SQLite**: one file on disk, good for learning and small deployments—**not** a separate database server process.

**Why split frontend and backend?** You can change the UI without rewriting logic; you can test or document the API independently; multiple clients (web, future mobile) could share the same API.

**Mental model:** the browser is a **client**; every meaningful operation becomes an **HTTP request** (often `GET`/`POST`/`DELETE`) to `/api/...`, with JSON or multipart bodies. The server **never** trusts the client for “is this user an admin?”—it **re-derives identity** from the JWT on each protected request.

---

## End-to-end: one request’s journey

1. User clicks something in React (e.g. open document list).  
2. `services/api.js` (axios) attaches `Authorization: Bearer <token>` if the user logged in earlier.  
3. Express matches the URL to a **router** (`routes/documents.js`, etc.).  
4. **Middleware** runs first: `authenticateToken` verifies the JWT; role middleware may block non-admins.  
5. A **controller** runs SQL (via `sqlite3`) and may read/write **BLOBs** for files and signatures.  
6. The handler returns **JSON** (or binary for downloads).  
7. React updates state; the user sees new data or an error (toasts, redirects on `401`).

Tracing one real feature this way is the fastest way to learn the repo.

---

## Contents

1. [Local development (hands-on)](#local-development-hands-on)  
2. [The stack, explained](#the-stack-explained)  
3. [Backend: routes and responsibilities](#backend-routes-and-responsibilities)  
4. [Authentication: JWT in plain terms](#authentication-jwt-in-plain-terms)  
5. [Database design for a signing workflow](#database-design-for-a-signing-workflow)  
6. [Frontend: how React fits in](#frontend-how-react-fits-in)  
7. [Cross-cutting topics (CORS, env, tests)](#cross-cutting-topics-cors-env-tests)  
8. [What exists vs what advanced apps add](#what-exists-vs-what-advanced-apps-add)  
9. [Mini glossary](#mini-glossary)  
10. [Further reading](#further-reading)  

---

## Local development (hands-on)

You usually run **two processes**: API and UI. There is no root `Makefile`; **`npm`** is the interface.

| Step | Directory | Command | Idea |
|------|------------|---------|------|
| Install server deps | `backend/` | `npm install` | Pull Express, sqlite3, etc. |
| Create tables | `backend/` | `npm run init-db` | Run DDL in `schema.sql` |
| Run API | `backend/` | `npm run dev` | Listen on `PORT` (default 5000) |
| Smoke test API | `backend/` | `npm run test` | Scripted HTTP checks, not full test suite |
| Install UI deps | `frontend/` | `npm install` | Pull React, Vite, etc. |
| Run UI | `frontend/` | `npm run dev` | Vite dev server; often port 5173 |
| Stop (Windows helper) | repo root | `npm run stop` | See [README.md](README.md) |

`VITE_API_URL` points the UI at your API if it is not `http://localhost:5000/api`.

---

## The stack, explained

| Piece | Technology | Teaching note |
|--------|------------|----------------|
| HTTP API | **Node + Express** | **REST-shaped** routes: resources under `/api/...`, JSON responses—easy to document and test with curl or Postman. |
| Database | **SQLite + `sqlite3` package** | **Embedded** DB: no install step for Postgres. Tradeoff: one-writer limits; fine for learning/small teams. |
| Passwords | **bcryptjs** | Passwords are **hashed**, not stored plain—standard practice. |
| Login ticket | **JWT** | Server signs a compact token; client sends it on each request. **Stateless** for the server, but you must handle **expiry** and **where** the token lives (here: browser storage). |
| Uploads | **Multer (memory)** | Files land in RAM briefly, then code writes **BLOB** columns. Simple deployment; large files scale better with disk/object storage later. |
| Browser app | **React + Vite + React Router** | **Client-side routing**—URLs change without full page reloads; data comes from fetch/axios. |

---

## Backend: routes and responsibilities

**Entry file:** `server.js` wires **CORS**, JSON body parsing, **route prefixes**, and a single **error handler**.

Routers group related URLs—think “namespaces”:

| Mount | Module | What learners should notice |
|--------|--------|----------------------------|
| `/api/auth` | `routes/auth.js` | Public register/login; `/me` needs a token. |
| `/api/documents` | `routes/documents.js` | Core document lifecycle. |
| `/api/documents` | `routes/documentVersions.js` | **Same prefix**, different file—versions hang off document `:id`. |
| `/api/workflow` | `routes/workflow.js` | Approvals and stage movement. |
| `/api/signatures` | `routes/signatures.js` | Signature rows tied to **workflow stages**. |
| `/api` | `routes/attachments.js` | Attachments and download paths under `/documents/...` and `/attachments/...`. |
| `/api/notifications` | `routes/notifications.js` | In-app alerts per user. |

**Middleware** sits **before** controllers: `authenticateToken` answers “who is this?”; `roles` answers “are they allowed?”. **`classificationAuth`** encodes stricter rules for sensitive documents—an example of **layered** security.

Workflow shape is partly **data-driven** from `config/workflowTemplates.js`; `config/unitHierarchy.js` supports org-style metadata where used.

---

## Authentication: JWT in plain terms

1. **Login:** client sends email/password; server checks hash; responds with a **JWT string**.  
2. **Later requests:** client sends `Authorization: Bearer <JWT>`.  
3. **Server:** verifies signature and reads claims (e.g. user id); loads user/role if needed.  
4. **401:** axios interceptor clears storage and sends user to login—**the UI and API agree** that the session is dead.

**Teaching point:** JWTs are **not** a silver bullet. If stored in `localStorage`, **XSS** in your frontend can exfiltrate them. Production systems often prefer **httpOnly cookies**, **short-lived** access tokens, **refresh** tokens, and **CSRF** defenses—topics worth a security course, not this checklist alone.

---

## Database design for a signing workflow

**Schema file:** `backend/src/config/schema.sql`. **Foreign keys** are enforced (`PRAGMA foreign_keys = ON` in `database.js`) so orphan stages or signatures are harder to create accidentally.

| Table | Conceptual role |
|-------|----------------|
| `users` | Who can act; **`role`** drives permissions in code. |
| `documents` | The “case” row: main binary in **`file_data`**, status, deadline, metadata. |
| `workflow_stages` | Ordered steps; who is assigned; rejection reason; optional per-stage deadline. |
| `signatures` | Evidence of signing, linked to a **stage** and **user**. |
| `document_attachments` | Extra evidence files. |
| `document_versions` | New signed file blobs as the workflow progresses. |
| `notifications` | Work queue signals in the DB; UI polls or could upgrade to push. |
| `document_history` | **Audit** trail of actions. |
| `workflow_comments` | Discussion attached to a stage. |

**Exercise:** draw a diagram: `documents` 1—* `workflow_stages` 1—* `signatures`. That’s the mental core of the product.

**Queries:** use **parameterized** SQL (placeholders)—see controllers and `dbHelper.js`—to reduce **SQL injection** risk.

---

## Frontend: how React fits in

- **`App.jsx`** declares **routes** and wraps the tree in **Auth** + **Toast** providers so any child can read “who am I?” or show feedback.  
- **`ProtectedRoute`** implements “must login” and optional **`requiredRole="admin"`**—**parallel** to server checks, not a substitute for them.  
- **Page components** fetch data when they mount or when users act; **`api.js`** centralizes base URL and headers.  
- **Notifications** use **polling** (timer)—simple to reason about; **WebSockets** are the usual upgrade for “instant” updates.

---

## Cross-cutting topics (CORS, env, tests)

- **CORS:** browsers block random origins from calling your API unless the server **allows** them. Here, localhost patterns and `CORS_ORIGIN` exist for dev; production needs an **explicit allowlist** of real front-end URLs.  
- **Environment variables:** `PORT`, `JWT_SECRET`, `DB_PATH`, `CORS_ORIGIN`—**secrets** (`JWT_SECRET`) must differ per environment.  
- **Tests:** `npm run test` runs **smoke** HTTP checks—good for regression of happy paths; **unit** and **E2E** tests are the next learning step for larger teams.  
- **Init:** `npm run init-db` applies `schema.sql`—always understand migrations before running on shared data.

---

## What exists vs what advanced apps add

**You can study today:** full document lifecycle with roles, workflows, signatures, versions, attachments, notifications, audit table concepts.

**Typical “next semester” topics:** admin CRUD UIs, **email**, OAuth/MFA, **rate limiting**, formal **OpenAPI** docs, **object storage** for huge files, **full-text search**, automated **E2E** tests, hardened cookie-based sessions.

---

## Mini glossary

| Term | Quick meaning |
|------|----------------|
| **SPA** | One HTML shell; JavaScript swaps views and calls APIs. |
| **REST** | Resource-style HTTP: nouns in URLs, verbs in methods, state in JSON. |
| **JWT** | Signed JSON payload proving “issued by our server until expiry.” |
| **Middleware** | Express functions that run **before** your final route handler. |
| **BLOB** | Binary large object column—stores file bytes inside SQLite. |
| **Foreign key** | DB rule: this row’s `document_id` must point to a real document. |

---

## Further reading

| Resource | Why open it |
|-----------|-------------|
| [CODEBASE.md](CODEBASE.md) | Maps folders to files. |
| [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) | How roles affect routes. |
| [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) | Running smoke tests. |
| [backend/src/config/schema.sql](backend/src/config/schema.sql) | Read the DDL like documentation. |
| [samples/](samples/) | Example data for experiments. |

---

*Last updated: 2026-04-02*
