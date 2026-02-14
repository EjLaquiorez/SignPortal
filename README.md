# SigningPortal

A full-stack document signing portal with role-based authentication, multi-stage approval workflows, and digital signature capture.

## Features

- Role-based authentication (Personnel, Authority, Admin)
- Document upload and management
- Multi-stage workflow approval system
- Digital signature capture and storage
- Audit trail for all actions

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Database**: SQLite (local file-based database)
- **Authentication**: JWT

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

**Note**: No database server installation needed! SQLite is a file-based database that works out of the box.

### Backend Setup

1. Navigate to `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file (optional - defaults work for local development):
   ```bash
   cp .env.example .env
   ```
   The database file will be created automatically at `backend/signingportal.db`

4. Initialize database schema:
   ```bash
   npm run init-db
   ```
   This will create all tables and a default admin user:
   - Email: `admin@signingportal.com`
   - Password: `admin123`

5. Start the server:
   ```bash
   npm run dev
   ```
   Server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

## Stopping Servers

To stop all running servers, you have several options:

### Option 1: Using the root package.json (Recommended)
From the project root directory:
```bash
npm run stop
```

### Option 2: Using PowerShell script
```bash
powershell -ExecutionPolicy Bypass -File ./stop-servers.ps1
```

### Option 3: Using Batch file (Windows)
Double-click `stop-servers.bat` or run:
```bash
stop-servers.bat
```

### Option 4: Stop backend only
From the `backend` directory:
```bash
npm run stop
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Upload Document**: Personnel can upload documents which automatically creates a workflow
3. **Sign Documents**: Users can sign documents at their assigned workflow stages
4. **Approve Documents**: Authority users can review and approve documents
5. **Track Progress**: View workflow stages and signatures for each document

## Default Admin Account

After running `npm run init-db`:
- Email: `admin@signingportal.com`
- Password: `admin123`

**Important**: Change the default admin password after first login!

## Default Workflow

1. Personnel uploads document
2. Personnel signs the document
3. Authority reviews and confirms/approves
4. Document is marked as completed
