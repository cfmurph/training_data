import { Router } from 'express';
import {
  getStravaAuthUrl,
  exchangeStravaCode,
} from '../services/strava';

const router = Router();

router.get('/connect', (_req, res) => {
  const url = getStravaAuthUrl();
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code) {
    return res.redirect(`${frontendUrl}/connect?error=strava_denied`);
  }

  try {
    const { tokens, athlete } = await exchangeStravaCode(code as string);
    const sess = req.session as any;
    sess.stravaTokens = tokens;
    sess.athlete = {
      id: athlete.id,
      name: `${athlete.firstname} ${athlete.lastname}`,
      username: athlete.username,
      avatar: athlete.profile,
      city: athlete.city,
      country: athlete.country,
    };
    sess.provider = 'strava';

    res.redirect(`${frontendUrl}/dashboard?connected=strava`);
  } catch (err) {
    console.error('Strava callback error:', err);
    res.redirect(`${frontendUrl}/connect?error=strava_auth_failed`);
  }
});

export default router;
