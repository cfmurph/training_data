import { Router } from 'express';
import {
  getGarminRequestToken,
  getGarminAuthUrl,
  getGarminAccessToken,
} from '../services/garmin';

const router = Router();

router.get('/connect', async (_req, res) => {
  try {
    const requestToken = await getGarminRequestToken();
    const sess = _req.session as any;
    sess.garminRequestToken = requestToken;
    const authUrl = getGarminAuthUrl(requestToken.oauth_token);
    res.redirect(authUrl);
  } catch (err) {
    console.error('Garmin connect error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/connect?error=garmin_init_failed`);
  }
});

router.get('/callback', async (req, res) => {
  const { oauth_token, oauth_verifier } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const sess = req.session as any;

  if (!oauth_token || !oauth_verifier || !sess.garminRequestToken) {
    return res.redirect(`${frontendUrl}/connect?error=garmin_denied`);
  }

  try {
    const accessTokens = await getGarminAccessToken(
      oauth_token as string,
      sess.garminRequestToken.oauth_token_secret,
      oauth_verifier as string
    );

    sess.garminTokens = accessTokens;
    sess.provider = sess.provider || 'garmin';
    if (!sess.athlete) {
      sess.athlete = { id: oauth_token, name: 'Garmin Athlete', provider: 'garmin' };
    }

    res.redirect(`${frontendUrl}/dashboard?connected=garmin`);
  } catch (err) {
    console.error('Garmin callback error:', err);
    res.redirect(`${frontendUrl}/connect?error=garmin_auth_failed`);
  }
});

export default router;
