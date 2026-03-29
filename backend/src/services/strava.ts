import axios from 'axios';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/api/v3/oauth/token';
const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export interface StravaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  city: string;
  country: string;
}

export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID || '',
    redirect_uri: process.env.STRAVA_REDIRECT_URI || '',
    response_type: 'code',
    approval_prompt: 'auto',
    scope: 'read,activity:read_all,profile:read_all',
  });
  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<{ tokens: StravaTokens; athlete: StravaAthlete }> {
  const response = await axios.post(STRAVA_TOKEN_URL, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
  });

  const { access_token, refresh_token, expires_at, token_type, athlete } = response.data;
  return {
    tokens: { access_token, refresh_token, expires_at, token_type },
    athlete: {
      id: athlete.id,
      username: athlete.username,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      profile: athlete.profile,
      city: athlete.city,
      country: athlete.country,
    },
  };
}

export async function refreshStravaToken(refresh_token: string): Promise<StravaTokens> {
  const response = await axios.post(STRAVA_TOKEN_URL, {
    client_id: process.env.STRAVA_CLIENT_ID,
    client_secret: process.env.STRAVA_CLIENT_SECRET,
    refresh_token,
    grant_type: 'refresh_token',
  });
  const { access_token, refresh_token: new_refresh, expires_at, token_type } = response.data;
  return { access_token, refresh_token: new_refresh, expires_at, token_type };
}

export async function getValidStravaToken(tokens: StravaTokens): Promise<StravaTokens> {
  if (Date.now() / 1000 < tokens.expires_at - 300) {
    return tokens;
  }
  return refreshStravaToken(tokens.refresh_token);
}

export async function fetchStravaActivities(tokens: StravaTokens, page = 1, perPage = 30): Promise<any[]> {
  const validTokens = await getValidStravaToken(tokens);
  const response = await axios.get(`${STRAVA_API_BASE}/athlete/activities`, {
    headers: { Authorization: `Bearer ${validTokens.access_token}` },
    params: { page, per_page: perPage },
  });
  return response.data;
}

export async function fetchStravaAthleteStats(tokens: StravaTokens, athleteId: number): Promise<any> {
  const validTokens = await getValidStravaToken(tokens);
  const response = await axios.get(`${STRAVA_API_BASE}/athletes/${athleteId}/stats`, {
    headers: { Authorization: `Bearer ${validTokens.access_token}` },
  });
  return response.data;
}

export async function fetchStravaActivity(tokens: StravaTokens, activityId: number): Promise<any> {
  const validTokens = await getValidStravaToken(tokens);
  const response = await axios.get(`${STRAVA_API_BASE}/activities/${activityId}`, {
    headers: { Authorization: `Bearer ${validTokens.access_token}` },
  });
  return response.data;
}
