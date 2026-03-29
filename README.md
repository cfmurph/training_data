# TrainTrack — Training Progress Application

A full-stack web application that connects to **Strava** and **Garmin Connect** to visualize your training data with beautiful, interactive dashboards.

## Features

- **OAuth Integration**: Connect Strava (OAuth 2.0) or Garmin Connect (OAuth 1.0a)
- **Weekly Volume Charts**: Track training load week-over-week (distance, time, or count)
- **Sport Breakdown**: Donut chart showing activity distribution across run, ride, swim, etc.
- **Activity Feed**: Searchable, filterable list of all activities with detailed stats
- **Summary Stats**: Total distance, time, elevation, average heart rate
- **Dark Mode UI**: Modern, responsive design built with Tailwind CSS

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Charts | Recharts |
| Data Fetching | TanStack Query (React Query) |
| Routing | React Router v7 |
| Backend | Node.js, Express, TypeScript |
| Auth | Strava OAuth 2.0, Garmin OAuth 1.0a |

## Project Structure

```
training-progress-app/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   │   ├── strava.ts    # Strava OAuth routes
│   │   │   ├── garmin.ts    # Garmin OAuth routes
│   │   │   ├── activities.ts # Activity endpoints
│   │   │   └── stats.ts     # Stats/analytics endpoints
│   │   ├── services/        # External API clients
│   │   │   ├── strava.ts    # Strava API integration
│   │   │   └── garmin.ts    # Garmin API integration
│   │   ├── utils/
│   │   │   └── normalize.ts # Unified activity model + stats computation
│   │   └── index.ts         # Express app entry point
│   ├── .env.example         # Environment variable template
│   └── package.json
└── frontend/                # React + Vite SPA
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Route pages
    │   ├── hooks/           # React Query hooks
    │   ├── services/        # API client
    │   ├── types/           # TypeScript types
    │   └── utils/           # Formatting helpers
    └── package.json
```

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd training-progress-app
npm install
```

### 2. Configure Strava API

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application with callback URL: `http://localhost:3001/api/auth/strava/callback`
3. Copy your Client ID and Client Secret

### 3. Configure Garmin API

Garmin's Health API requires a partnership application:
1. Apply at [developer.garmin.com/health-api](https://developer.garmin.com/health-api/overview/)
2. Once approved, set your redirect URI to: `http://localhost:3001/api/auth/garmin/callback`

### 4. Create backend `.env`

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=3001
SESSION_SECRET=your-random-secret-string-here

# Strava
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=http://localhost:3001/api/auth/strava/callback

# Garmin (optional)
GARMIN_CONSUMER_KEY=your_garmin_consumer_key
GARMIN_CONSUMER_SECRET=your_garmin_consumer_secret
GARMIN_REDIRECT_URI=http://localhost:3001/api/auth/garmin/callback

FRONTEND_URL=http://localhost:5173
```

### 5. Run the app

```bash
# Run both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/status` | Check authentication status |
| GET | `/api/auth/strava/connect` | Initiate Strava OAuth |
| GET | `/api/auth/strava/callback` | Strava OAuth callback |
| GET | `/api/auth/garmin/connect` | Initiate Garmin OAuth |
| GET | `/api/auth/garmin/callback` | Garmin OAuth callback |
| POST | `/api/auth/logout` | Disconnect account |
| GET | `/api/activities?page=1&per_page=20` | Paginated activity list |
| GET | `/api/activities/recent?limit=5` | Recent activities |
| GET | `/api/stats/summary` | Aggregate training stats |
| GET | `/api/stats/weekly?weeks=12` | Weekly volume breakdown |

## Development

```bash
# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Type check backend
cd backend && npx tsc --noEmit

# Type check frontend
cd frontend && npx tsc --noEmit

# Build frontend for production
cd frontend && npm run build
```
