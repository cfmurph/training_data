import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import stravaRouter from './routes/strava';
import garminRouter from './routes/garmin';
import activitiesRouter from './routes/activities';
import statsRouter from './routes/stats';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use('/api/auth/strava', stravaRouter);
app.use('/api/auth/garmin', garminRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/auth/status', (req, res) => {
  const sess = req.session as any;
  res.json({
    strava: !!sess.stravaTokens,
    garmin: !!sess.garminTokens,
    athlete: sess.athlete || null,
    provider: sess.provider || null,
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export default app;
