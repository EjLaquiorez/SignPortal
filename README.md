# SigningPortal

A full-stack document signing portal with role-based authentication, multi-stage approval workflows, and digital signature capture.

## Features

- **Role-based authentication** (Personnel, Authority, Admin)
- **Document upload and management** with file validation
- **Multi-stage workflow approval system** with visual progress tracking
- **Digital signature capture and storage** (draw or upload)
- **Real-time status tracking** (pending, in_progress, completed, rejected)
- **Comprehensive audit trail** for all actions
- **Responsive design** for desktop, tablet, and mobile devices
- **Secure file storage** with access control

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React + Vite
- **Database**: SQLite (local file-based database)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Password Security**: bcrypt

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

## Project Structure

```
SignPortal/
├── backend/              # Node.js + Express API server
│   ├── src/
│   │   ├── config/      # Database and configuration
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Auth and validation
│   │   ├── models/      # Data models
│   │   ├── routes/      # API routes
│   │   └── utils/        # Utility functions
│   ├── scripts/         # Database and utility scripts
│   └── docs/            # Backend documentation
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── context/        # React Context providers
│   │   └── services/    # API service layer
│   └── public/          # Static assets
├── samples/             # Sample data and documents
├── presentation-guidelines/  # Presentation guides (git-ignored)
└── README.md            # This file
```

## Documentation

- **[Interface Functionality Checklist](INTERFACE_FUNCTIONALITY_CHECKLIST.md)** - Complete feature list and improvement areas
- **[Backend Documentation](backend/docs/)** - API documentation and guides
  - [Test Guide](backend/docs/TEST_GUIDE.md) - Testing functionality
  - [Access Control](backend/docs/ACCESS_CONTROL.md) - Security and permissions
  - [Sample Users](backend/docs/SAMPLE_USERS.md) - Test user accounts
- **[Sample Files Guide](samples/)** - Sample data and usage instructions
- **[Presentation Guidelines](presentation-guidelines/)** - Guides for showcasing the project (not in git)

## Testing

Run the functionality test suite:

```bash
cd backend
npm run test
```

This will test:
- User authentication
- Document upload and management
- Workflow creation and progression
- Signature capture and storage
- Role-based access control

## Sample Data

The `samples/` directory contains:
- Sample documents for testing
- Sample user data
- Seeding scripts for database population

See [samples/README.md](samples/README.md) for details on using sample data.

## Development

### Environment Variables

Backend `.env` file (optional for local development):
```env
PORT=5000
JWT_SECRET=your-secret-key
DB_PATH=./signingportal.db
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with nodemon
- `npm run init-db` - Initialize database schema
- `npm run test` - Run functionality tests
- `npm run seed-users` - Seed sample users
- `npm run seed-documents` - Seed sample documents
- `npm run reset-admin` - Reset admin password

**Frontend:**
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production

**Root:**
- `npm run stop` - Stop all running servers

## Security Notes

- Default admin password should be changed immediately after first login
- JWT tokens are stored in memory (consider httpOnly cookies for production)
- File uploads are validated for size and type
- All routes are protected with authentication middleware
- Role-based access control enforced on both frontend and backend

## Future Enhancements

See [INTERFACE_FUNCTIONALITY_CHECKLIST.md](INTERFACE_FUNCTIONALITY_CHECKLIST.md) for a comprehensive list of planned features and improvements, including:
- Document preview functionality
- Email notifications
- Advanced search and filtering
- Workflow templates
- Mobile app development
- API documentation (Swagger/OpenAPI)

## License

[Add your license information here]

## Contributing

[Add contribution guidelines if applicable]
