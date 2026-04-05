# SignPortal — Beginner’s instruction guide

This guide tells you **what to do first**, **what the words mean**, and **how the pieces connect**. You do **not** need to know every technology beforehand—look up terms in the [glossary](#glossary-simple-definitions) as you go.

**Other files:** step-by-step run instructions → [README.md](README.md). Folder-by-folder code map → [CODEBASE.md](CODEBASE.md).

---

## How to use this guide (read in order)

| Step | Section | Goal |
|------|---------|------|
| 1 | [Run the app first](#step-1-run-the-app-first) | See it working before reading code. |
| 2 | [Two halves of the project](#step-2-two-halves-of-the-project) | Learn “frontend” vs “backend”. |
| 3 | [Follow one button click](#step-3-follow-one-button-click) | See data flow from screen → server → database. |
| 4 | [Tables in the database](#step-4-tables-in-the-database) | Understand what is stored where. |
| 5 | [Login and JWT](#step-5-login-and-jwt-very-short) | Understand how the site knows who you are. |
| 6 | [Deeper topics](#step-6-when-you-are-ready-go-deeper) | CORS, env vars, tests. |

---

## Step 1: Run the app first

**Why:** Running the project once makes every later sentence easier to understand.

**Project root:** the folder that contains both `backend/` and `frontend/` (often named `SignPortal`). Use that as your starting point for `cd`.

1. Open two terminal windows.  
2. In the **first** terminal:
   - `cd backend`
   - `npm install`
   - `npm run init-db` (only needed the first time, or when you want a fresh database)
   - `npm run dev`
   - Leave it running. The API usually listens on **http://localhost:5000**.
3. In the **second** terminal:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
   - Open the URL Vite prints (often **http://localhost:5173**).
4. Register a user, log in, upload a sample file if you can.

After **`npm run init-db`**, a default **admin** account may exist (see [README.md](README.md) for email/password—change it after first login).

**Check the API:** with the backend running, open **http://localhost:5000/api/health** in the browser. You should see a small JSON “ok” response. If that fails, fix the backend before debugging the React app.

**Try this:** In the browser, open DevTools → **Network**. Click something that loads documents. Find a request whose name starts with `documents` or `auth`. You are watching the **frontend talk to the backend**.

**If something fails:**

| Symptom | What to try |
|---------|-------------|
| “Port 5000 already in use” | Stop the old server ([README.md](README.md) `npm run stop`) or change `PORT` in `backend/.env`. |
| Login always fails after clone | Run **`npm run init-db`** once in `backend/`. |
| React shows errors but Network tab shows no API calls | Confirm `VITE_API_URL` matches your API (see `frontend/src/utils/constants.js`). |

**Stop servers:** from the project root, see [README.md](README.md) (`npm run stop` on Windows).

---

## Step 2: Two halves of the project

| Half | Folder | What it does (beginner words) |
|------|--------|--------------------------------|
| **Frontend** | `frontend/` | The **website you see**: pages, buttons, forms. Built with **React** (UI library) and **Vite** (tool that runs it in development). |
| **Backend** | `backend/` | The **server program**: checks passwords, saves data, sends JSON. Built with **Node.js** (JavaScript on the server) and **Express** (library for HTTP routes). |

They are **two separate programs**. The frontend calls the backend over **HTTP** (like loading a URL, but for data). The base URL is often `http://localhost:5000/api` (see `frontend` → `src/utils/constants.js`).

**Remember:** rules like “only admins may do X” must be enforced on the **backend**. The frontend can hide a button, but anyone could call the API; the server must **check again**.

---

## Step 3: Follow one button click

When you click something in SignPortal (for example, open the document list), this **order** happens:

1. **React** runs code in a **page** or **component** (under `frontend/src/pages` or `components`).  
2. That code uses **`services/api.js`** to send an HTTP request (GET or POST, etc.).  
3. If you are logged in, the browser may attach a **token** (see Step 5)—a small string that means “this request belongs to user X”.  
4. **Express** in `backend/src/server.js` receives the request and passes it to the right **route file** under `backend/src/routes/` (for example `documents.js`).  
5. **Middleware** may run first (for example “is this token valid?”).  
6. A **controller** in `backend/src/controllers/` runs **SQL** against **SQLite** (a database stored as a file).  
7. The server sends back **JSON** (text data). React updates the screen.

**Try this:** Pick one screen you like (for example `Documents`). Search the project for `documentsAPI` or the route path `/documents`. Trace one function from the button to `api.js`, then find a matching route in `backend/src/routes/documents.js`.

---

## Step 4: Tables in the database

The “shape” of stored data is in **`backend/src/config/schema.sql`**. You do not need to memorize it—use this table as a map.

| Table | Plain-language meaning |
|-------|-------------------------|
| **users** | People who can log in. Each has a **role**: personnel, authority, or admin. |
| **documents** | One uploaded file (and its metadata: title, status, deadline, etc.). The file bytes can live in a **BLOB** column (binary storage inside the database). |
| **workflow_stages** | Steps a document goes through (who must sign or approve next). |
| **signatures** | A saved signature for a stage (drawn or uploaded image). |
| **document_attachments** | Extra files tied to a document. |
| **document_versions** | New versions of the file as the workflow moves. |
| **notifications** | Rows used for in-app alerts. |
| **document_history** | A log of actions (audit-style). |
| **workflow_comments** | Comments linked to a workflow step. |

**Simple relationship:** one **document** has many **workflow_stages**; stages can have **signatures**. Think: file → steps on that file → signatures on a step.

---

## Step 5: Login and JWT (very short)

1. You send **email + password** to the backend.  
2. If correct, the server returns a **JWT** (a signed string). The frontend usually stores it (for example in **localStorage**).  
3. Later requests add a header like: `Authorization: Bearer <that string>`.  
4. The backend **verifies** the JWT and knows your user id (and role) without asking for your password again.

If the token is bad or expired, the API may return **401**; the frontend often **logs you out** and sends you to the login page.

**Beginner warning:** hiding a menu item in React is not enough—**the server must check the role** on every sensitive API path.

---

## Step 6: When you are ready, go deeper

### Main API areas (where to look in code)

| URL prefix (after `/api`) | Topic |
|---------------------------|--------|
| `/auth` | Register, login, “who am I”. |
| `/documents` | Upload, list, download documents; also version routes under the same prefix. |
| `/workflow` | Moving stages, approvals. |
| `/signatures` | Saving and loading signatures. |
| `/notifications` | In-app notification list and read/unread. |

Attachments use paths like `/documents/:id/attachments`—see `routes/attachments.js`.

### Important files (starter list)

- **Backend entry:** `backend/src/server.js`  
- **Frontend entry:** `frontend/src/main.jsx` → `App.jsx`  
- **HTTP client:** `frontend/src/services/api.js`  
- **Database connection:** `backend/src/config/database.js`  
- **Table definitions:** `backend/src/config/schema.sql`  

### CORS (one sentence)

Browsers block your React port from calling a **different** port unless the **server** says it is allowed. That is **CORS**. This project allows localhost in development; real deployments need a tight allowlist.

### Environment variables

Settings like **PORT**, **JWT_SECRET**, and **DB_PATH** are read from environment variables or defaults—see [README.md](README.md). **JWT_SECRET** should be random and private, never committed as a real secret in public repos.

### Tests

`npm run test` in `backend/` runs **smoke** tests (basic API checks). It is not a full automated test suite, but it helps you see if the server still responds as expected.

---

## What you can learn from this project now

You already have: login and roles, file upload, multi-step workflow, signatures, versions, attachments, in-app notifications, and a dashboard.

**Common “next level” work:** full admin panel, email notifications, file preview in the browser, stronger production security, and more automated tests.

---

## Glossary (simple definitions)

| Word | Meaning |
|------|---------|
| **API** | The backend’s HTTP interface—URLs that return data instead of HTML pages. |
| **JSON** | A text format for sending structured data between frontend and server. |
| **React** | A JavaScript library for building the user interface in components. |
| **Route** | A URL pattern + the code that runs when that URL is requested. |
| **Middleware** | Code that runs on the server **before** your main handler (for example “check token”). |
| **SQLite** | A small database engine; data is often in one file (e.g. `signingportal.db`). |
| **BLOB** | “Binary large object”—storing a file’s raw bytes inside a database cell. |
| **JWT** | A compact, signed token the server gives you after login so later requests prove who you are. |
| **SPA** | Single-page app: one page loads, then JavaScript swaps views without full reloads. |

---

## More reading (optional)

| File | Why |
|------|-----|
| [CODEBASE.md](CODEBASE.md) | Lists folders and important files. |
| [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) | Who can do what. |
| [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) | How to run backend tests. |
| [samples/](samples/) | Sample data for practice. |
| [backend/src/config/schema.sql](backend/src/config/schema.sql) | Exact table and column definitions. |

---

*Last updated: 2026-04-05*
