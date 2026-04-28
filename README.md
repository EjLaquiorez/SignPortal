# SigningPortal

A small **web application** for uploading documents, capturing electronic signatures, and moving each file through an **approval workflow**: Personnel → Authority → completed.

This README is written for **beginners** and **first-time contributors**. If you already know Node.js and full-stack apps, skip to [Run the project locally](#run-the-project-locally). For a **step-by-step picture** of frontend, API, and database (glossary and “follow one click”), see [BEGINNERS_GUIDE.md](BEGINNERS_GUIDE.md).

*Last updated: 28 April 2026.*

---

## What this project is (in plain terms)

| Piece | Role |
|--------|------|
| **Frontend** | What you see in the browser: login, uploads, signing UI. Built with **React** and **Vite**. |
| **Backend** | A server that stores data, handles logins, and serves the API. Built with **Node.js** and **Express**. |
| **Database** | **SQLite** — one file on disk (no separate database program to install). |

You run **two processes** on your computer when developing: the backend (API) and the frontend (web UI). They talk to each other over HTTP on your machine.

---

## What you need before you start

- **Node.js** version **16 or newer** (includes **npm**, the package manager).
- A **terminal** (Command Prompt, PowerShell, or Terminal on macOS/Linux).
- **Git** (optional but typical) if you cloned this repository.

### Check your versions

In a terminal:

```bash
node -v
npm -v
```

If `node` is not recognized, install Node from [https://nodejs.org](https://nodejs.org) (LTS is fine).

You do **not** need to install MySQL, PostgreSQL, or any other database server. This project uses **SQLite** only.

---

## Run the project locally

Follow these steps **in order**. Use **two terminal windows** (or tabs): one stays on the backend, one on the frontend.

### 1. Backend (API)

```bash
cd backend
npm install
npm run init-db
npm run dev
```

What each step does:

- **`npm install`** downloads the backend dependencies (first time and after dependency changes).
- **`init-db`** creates the SQLite database file and a **default admin** account (see [Log in](#3-log-in)). Run once on a fresh clone, or again if you want to reset the database (you will lose existing local data unless you back up the DB file).
- **`npm run dev`** starts the API with auto-restart on file changes (**nodemon**).

The API listens at **http://localhost:5000**.

**Quick check:** In a browser, open **http://localhost:5000/api/health**. You should see JSON with `"status": "ok"`.

**Optional:** Create `backend/.env` to override defaults. Local development usually works **without** it. See [Environment variables](#environment-variables-optional).

### 2. Frontend (browser UI)

Open a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite prints a local URL (typically **http://localhost:5173**; sometimes **5174** if 5173 is busy). Open that URL in your browser.

The frontend calls the API using **`API_BASE_URL`** in [`frontend/src/utils/constants.js`](frontend/src/utils/constants.js) (or the **`VITE_API_URL`** env var if you set it). For normal local dev that resolves to `http://localhost:5000/api`.

### 3. Log in

After `init-db`, you can sign in with:

| Field    | Value                     |
|----------|---------------------------|
| Email    | `admin@signingportal.com` |
| Password | `admin123`                |

**Change this password** after your first login in a real environment.

---

## Using the app (short tour)

1. **Register or log in** with a role such as Personnel, Authority, or Admin (depending on how accounts are set up).
2. **Personnel** uploads a document — a workflow is created for that file.
3. Participants **sign** when it is their turn in the workflow.
4. **Authority** reviews and approves when required.
5. **Track** status and history on each document.

Typical happy path: **upload → personnel signs → authority approves → document marked completed.**

---

## If something goes wrong (common issues)

| Problem | What to try |
|---------|-------------|
| **Port 5000, 5173, or 5174 already in use** | Use [Stop the servers](#stop-the-servers). From `backend/`, `npm run stop` frees **5000** only; from the repo root on Windows, `npm run stop` or `stop-servers.bat` clear **5000**, **5173**, and **5174**. |
| **Cannot connect / blank errors in the browser** | Keep the **backend** terminal running. Confirm **http://localhost:5000/api/health** works. |
| **UI works but lists stay empty or login looks broken** | Ensure the API URL matches your backend (see [`frontend/src/utils/constants.js`](frontend/src/utils/constants.js) and `VITE_API_URL`). |
| **`npm` errors after pulling new code** | Run `npm install` again in both `backend` and `frontend`. |
| **Database seems wrong or empty** | From `backend`, run `npm run init-db` again (this resets the default setup; back up `signingportal.db` first if you need to keep data). |

---

## Stop the servers

- **From the project root (Windows):** `npm run stop` — runs **`stop-servers.ps1`** and frees **5000**, **5173**, and **5174**.

- **Command Prompt (no PowerShell):** run **`stop-servers.bat`** from the repo root (same three ports). Use **`stop-servers.bat nopause`** from another script if you don’t want the “Press any key” prompt.

- **Backend only (port 5000):** from the **`backend/`** folder, run **`npm run stop`**.

---

## Run tests

```bash
cd backend
npm run test
```

---

## Learn more in this repository

| Topic | Where |
|--------|--------|
| **Where each part of the code lives** | [CODEBASE.md](CODEBASE.md) |
| **New to the codebase / full-stack basics** | [BEGINNERS_GUIDE.md](BEGINNERS_GUIDE.md) |
| Manual UI checks (screens and flows) | [INTERFACE_FUNCTIONALITY_CHECKLIST.md](INTERFACE_FUNCTIONALITY_CHECKLIST.md) |
| Sample files and seeding | [samples/README.md](samples/README.md) |
| Permissions and classified documents | [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md) |
| Backend tests (detail) | [backend/docs/TEST_GUIDE.md](backend/docs/TEST_GUIDE.md) |
| Example accounts for manual testing | [backend/docs/SAMPLE_USERS.md](backend/docs/SAMPLE_USERS.md) |

---

## Handy commands (quick reference)

**Backend** (`backend/`):

`npm run dev` · `npm run init-db` · `npm run test` · `npm run view-db` · `npm run seed-users` · `npm run seed-documents` · `npm run reset-admin` · `npm run stop`

**Frontend** (`frontend/`):

`npm run dev` · `npm run build` · `npm run preview` (preview production build locally)

**Root:**

`npm run stop`

---

## Environment variables (optional)

Create `backend/.env` only if you need to change defaults. Local development works without it.

```env
PORT=5000
JWT_SECRET=your-secret-key
DB_PATH=./signingportal.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

---

## Security (especially beyond local dev)

- Change the **default admin password** after first login.
- For production, use a strong **`JWT_SECRET`**, harden how tokens and cookies are handled, and read [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md).

---

## Repo layout (overview)

```
SignPortal/
├── backend/              Express API, SQLite, uploads
├── frontend/             React + Vite UI
├── samples/              Sample data and seeding guides
├── stop-servers.ps1      Windows: stop dev servers (used by root npm run stop)
├── stop-servers.bat      Same ports via cmd; optional arg: nopause
├── README.md · CODEBASE.md · BEGINNERS_GUIDE.md · …
└── package.json          Root script: npm run stop
```

---

## License & contributing

There is no **LICENSE** file in this repository yet; add one and contribution guidelines if you publish or open-source the project.
