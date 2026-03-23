# SigningPortal

Web app for uploading documents, capturing signatures, and moving them through an approval workflow (Personnel → Authority → completed).

---

## What you need

- **Node.js** 16 or newer  
- **npm** (comes with Node.js)

You do **not** need to install a database server. This project uses **SQLite** (a single file on disk).

---

## Run the project locally

Do these steps **in order**. Use two terminal windows: one for the backend, one for the frontend.

### 1. Backend (API)

```bash
cd backend
npm install
npm run init-db
npm run dev
```

- **`init-db`** creates the database and a default admin user (see below). Run it once, or again if you want a fresh database.
- The API listens at **http://localhost:5000**

**Optional:** Create `backend/.env` if you want to override defaults (see [Handy commands](#handy-commands) for typical variables). Local development works without it.

### 2. Frontend (browser UI)

Open a **new** terminal:

```bash
cd frontend
npm install
npm run dev
```

- The app opens at **http://localhost:5173** (Vite will print the exact URL).

### 3. Log in

After `init-db`, you can sign in as:

| Field    | Value                    |
|----------|--------------------------|
| Email    | `admin@signingportal.com` |
| Password | `admin123`               |

Change this password after the first login.

---

## Using the app (short version)

1. **Register or log in** with your role (Personnel, Authority, or Admin).
2. **Personnel** uploads a document — a workflow is created automatically.
3. **Sign** when it is your turn in the workflow.
4. **Authority** reviews and approves when required.
5. **Track** status and history on each document.

Typical flow: upload → personnel signs → authority approves → document marked completed.

---

## Stop the servers

- **From the project root (recommended):**  
  `npm run stop`

- **Backend only (port 5000):** from `backend`, run `npm run stop`.

You can also run `stop-servers.ps1` or `stop-servers.bat` from the repo root on Windows.

---

## Run tests

```bash
cd backend
npm run test
```

---

## Sample data and docs

| Topic | Where |
|--------|--------|
| Sample files and seeding | [samples/README.md](samples/README.md) |
| Feature checklist and ideas | [INTERFACE_FUNCTIONALITY_CHECKLIST.md](INTERFACE_FUNCTIONALITY_CHECKLIST.md) |
| API, access control, test users | [backend/docs/](backend/docs/) |

---

## Handy commands

**Backend** (`backend/`): `npm run dev` · `npm run init-db` · `npm run test` · `npm run seed-users` · `npm run seed-documents` · `npm run reset-admin`

**Frontend** (`frontend/`): `npm run dev` · `npm run build`

**Root:** `npm run stop`

**Optional `backend/.env` keys** (defaults work for local dev):

```env
PORT=5000
JWT_SECRET=your-secret-key
DB_PATH=./signingportal.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

---

## Security (local dev)

Change the default admin password after first login. For production, use a strong `JWT_SECRET`, tighten cookie/storage for tokens, and review [backend/docs/ACCESS_CONTROL.md](backend/docs/ACCESS_CONTROL.md).

---

## Repo layout (overview)

```
SignPortal/
├── backend/     Express API, SQLite, uploads
├── frontend/    React + Vite UI
├── samples/     Sample documents and seeding notes
└── README.md
```

---

## License & contributing

Add your license and contribution notes here if you publish the project.
