import { Router, Request, Response } from 'express';
import { fetchStravaActivities, fetchStravaAthleteStats } from '../services/strava';
import { fetchGarminActivities, fetchGarminDailies } from '../services/garmin';
import { normalizeStravaActivity, normalizeGarminActivity, computeStats } from '../utils/normalize';

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  const sess = req.session as any;
  if (!sess.stravaTokens && !sess.garminTokens) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

router.get('/summary', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const sess = req.session as any;

  try {
    if (sess.stravaTokens) {
      // Fetch last 90 days via pagination (approx 3 pages)
      const page1 = await fetchStravaActivities(sess.stravaTokens, 1, 100);
      const activities = page1.map(normalizeStravaActivity);
      const stats = computeStats(activities);

      // Also fetch athlete-level stats if we have athlete id
      let athleteStats = null;
      if (sess.athlete?.id) {
        try {
          athleteStats = await fetchStravaAthleteStats(sess.stravaTokens, sess.athlete.id);
        } catch (_) {}
      }

      res.json({ stats, athleteStats, provider: 'strava' });
    } else if (sess.garminTokens) {
      const now = Math.floor(Date.now() / 1000);
      const ninetyDaysAgo = now - 90 * 24 * 60 * 60;
      const raw = await fetchGarminActivities(
        sess.garminTokens,
        ninetyDaysAgo.toString(),
        now.toString()
      );
      const activities = raw.map(normalizeGarminActivity);
      const stats = computeStats(activities);

      res.json({ stats, provider: 'garmin' });
    }
  } catch (err: any) {
    console.error('Stats error:', err);
    if (err.response?.status === 401) {
      res.status(401).json({ error: 'Token expired or invalid' });
    } else {
      res.status(500).json({ error: 'Failed to compute stats' });
    }
  }
});

router.get('/weekly', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const sess = req.session as any;
  const weeks = parseInt(req.query.weeks as string) || 12;

  try {
    let activities: any[] = [];

    if (sess.stravaTokens) {
      const raw = await fetchStravaActivities(sess.stravaTokens, 1, weeks * 10);
      activities = raw.map(normalizeStravaActivity);
    } else if (sess.garminTokens) {
      const now = Math.floor(Date.now() / 1000);
      const start = now - weeks * 7 * 24 * 60 * 60;
      const raw = await fetchGarminActivities(
        sess.garminTokens,
        start.toString(),
        now.toString()
      );
      activities = raw.map(normalizeGarminActivity);
    }

    const stats = computeStats(activities);
    res.json({ weeklyVolume: stats.weeklyVolume, weeks });
  } catch (err) {
    console.error('Weekly stats error:', err);
    res.status(500).json({ error: 'Failed to compute weekly stats' });
  }
});

export default router;
