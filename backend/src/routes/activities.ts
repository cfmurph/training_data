import { Router, Request, Response } from 'express';
import { fetchStravaActivities } from '../services/strava';
import { fetchGarminActivities } from '../services/garmin';
import { normalizeStravaActivity, normalizeGarminActivity, NormalizedActivity } from '../utils/normalize';

const router = Router();

function requireAuth(req: Request, res: Response): boolean {
  const sess = req.session as any;
  if (!sess.stravaTokens && !sess.garminTokens) {
    res.status(401).json({ error: 'Not authenticated' });
    return false;
  }
  return true;
}

router.get('/', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const sess = req.session as any;
  const page = parseInt(req.query.page as string) || 1;
  const perPage = parseInt(req.query.per_page as string) || 30;

  try {
    let activities: NormalizedActivity[] = [];

    if (sess.stravaTokens) {
      const raw = await fetchStravaActivities(sess.stravaTokens, page, perPage);
      activities = raw.map(normalizeStravaActivity);
    } else if (sess.garminTokens) {
      const now = Math.floor(Date.now() / 1000);
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
      const raw = await fetchGarminActivities(
        sess.garminTokens,
        thirtyDaysAgo.toString(),
        now.toString()
      );
      activities = raw.map(normalizeGarminActivity);
    }

    res.json({ activities, total: activities.length });
  } catch (err: any) {
    console.error('Activities fetch error:', err);
    if (err.response?.status === 401) {
      res.status(401).json({ error: 'Token expired or invalid' });
    } else {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  }
});

router.get('/recent', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const sess = req.session as any;
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    let activities: NormalizedActivity[] = [];

    if (sess.stravaTokens) {
      const raw = await fetchStravaActivities(sess.stravaTokens, 1, limit);
      activities = raw.map(normalizeStravaActivity);
    } else if (sess.garminTokens) {
      const now = Math.floor(Date.now() / 1000);
      const sevenDaysAgo = now - 7 * 24 * 60 * 60;
      const raw = await fetchGarminActivities(
        sess.garminTokens,
        sevenDaysAgo.toString(),
        now.toString()
      );
      activities = raw.map(normalizeGarminActivity).slice(0, limit);
    }

    res.json({ activities });
  } catch (err) {
    console.error('Recent activities error:', err);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
});

export default router;
