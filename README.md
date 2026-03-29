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
| Backend | Java 21, Spring Boot 3.2 |
| HTTP Client | Spring WebFlux `WebClient` |
| Auth | Strava OAuth 2.0, Garmin OAuth 1.0a (HMAC-SHA1) |
| Build | Maven 3.8+ |

## Project Structure

```
training-progress-app/
├── backend/                                    # Spring Boot API server
│   ├── pom.xml
│   └── src/main/java/com/traintrack/
│       ├── TrainTrackApplication.java          # Entry point
│       ├── config/
│       │   ├── StravaProperties.java           # Strava config binding
│       │   ├── GarminProperties.java           # Garmin config binding
│       │   └── WebConfig.java                  # CORS configuration
│       ├── controller/
│       │   ├── AuthController.java             # OAuth routes
│       │   ├── ActivityController.java         # Activity endpoints
│       │   ├── StatsController.java            # Stats endpoints
│       │   └── HealthController.java           # Health check
│       ├── service/
│       │   ├── StravaService.java              # Strava OAuth 2.0 + API
│       │   ├── GarminService.java              # Garmin OAuth 1.0a + API
│       │   └── StatsService.java               # Stats aggregation
│       └── model/
│           ├── Activity.java                   # Unified activity model
│           ├── TrainingStats.java              # Stats response model
│           ├── AuthStatus.java                 # Auth status response
│           ├── StravaTokens.java
│           └── GarminTokens.java
└── frontend/                                   # React + Vite SPA
    ├── src/
    │   ├── components/   Navbar, ActivityCard, StatCard, charts
    │   ├── pages/        Landing, Connect, Dashboard, Activities
    │   ├── hooks/        useTraining.ts (React Query hooks)
    │   ├── services/     api.ts (axios client)
    │   ├── types/        TypeScript types
    │   └── utils/        format.ts (distance, duration, pace)
    └── package.json
```

## Setup

### Prerequisites

- **Java 21** (OpenJDK or Oracle JDK)
- **Maven 3.8+**
- **Node.js 18+** and npm

### 1. Clone and install frontend deps

```bash
git clone <repo-url>
cd training-progress-app
npm install
```

### 2. Configure Strava API

1. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
2. Create an application with callback URL: `http://localhost:3001/api/auth/strava/callback`
3. Copy your Client ID and Client Secret

### 3. Configure Garmin API (optional)

Garmin's Health API requires a partnership application:
1. Apply at [developer.garmin.com/health-api](https://developer.garmin.com/health-api/overview/)
2. Set redirect URI to: `http://localhost:3001/api/auth/garmin/callback`

### 4. Set environment variables

```bash
export STRAVA_CLIENT_ID=your_client_id
export STRAVA_CLIENT_SECRET=your_client_secret
export STRAVA_REDIRECT_URI=http://localhost:3001/api/auth/strava/callback

# Optional Garmin
export GARMIN_CONSUMER_KEY=your_key
export GARMIN_CONSUMER_SECRET=your_secret
export GARMIN_REDIRECT_URI=http://localhost:3001/api/auth/garmin/callback

export FRONTEND_URL=http://localhost:5173
```

Or edit `backend/src/main/resources/application.properties` directly.

### 5. Run the app

```bash
# Both backend and frontend (requires concurrently)
npm run dev
```

Or separately:

```bash
# Backend (terminal 1)
cd backend && mvn spring-boot:run

# Frontend (terminal 2)
cd frontend && npx vite
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
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

## Build for Production

```bash
# Build the Spring Boot fat JAR
cd backend && mvn package -DskipTests

# Build the frontend static assets
cd frontend && npx vite build

# Run the JAR
java -jar backend/target/training-backend-1.0.0.jar
```

Serve the `frontend/dist/` folder from a CDN or configure Spring Boot to serve it as static resources.

## Development Commands

```bash
# Backend only
cd backend && mvn spring-boot:run

# Frontend only
cd frontend && npx vite

# Run backend tests
cd backend && mvn test

# Type check frontend
cd frontend && npx tsc --noEmit

# Build frontend
cd frontend && npx vite build
```
