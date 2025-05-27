# Upload Large File Application

This application consists of a backend server and a frontend client for uploading large files.

## Setup

Before running the application, install dependencies:

```bash
# Install dependencies at root level
npm install

# Install dependencies for backend
cd backend
npm install

# Install dependencies for frontend
cd frontend
npm install
```

## Running the Application

### Development Mode

To run both backend and frontend in development mode:

```bash
npm start
```

This will start:

- Backend on default port (likely 3000 or 5000)
- Frontend development server with hot reloading on Vite's default port (5173)

## Individual Commands

You can also run backend and frontend separately:

```bash
# Development mode
npm run start:backend    # Run backend in development mode
npm run start:frontend   # Run frontend in development mode

```
