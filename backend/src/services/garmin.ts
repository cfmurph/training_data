import axios from 'axios';
import crypto from 'crypto';

/**
 * Garmin Connect uses OAuth 1.0a.
 * This service handles the OAuth flow and data fetching from the Garmin Health API.
 * For personal use, the unofficial garmin-connect npm package approach is also supported
 * via email/password login (see garminDirect service below).
 */

const GARMIN_REQUEST_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauthConfirm';
const GARMIN_ACCESS_TOKEN_URL = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
const GARMIN_API_BASE = 'https://apis.garmin.com/wellness-api/rest';

export interface GarminTokens {
  oauth_token: string;
  oauth_token_secret: string;
}

function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  token?: string,
  tokenSecret?: string,
  extraParams?: Record<string, string>
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
    ...(token ? { oauth_token: token } : {}),
    ...extraParams,
  };

  const allParams = { ...oauthParams };
  const sortedParams = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret || '')}`;
  const signature = crypto.createHmac('sha1', signingKey).update(signatureBase).digest('base64');

  oauthParams['oauth_signature'] = signature;

  const headerParts = Object.entries(oauthParams)
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

export async function getGarminRequestToken(): Promise<GarminTokens> {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY || '';
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET || '';
  const callbackUrl = process.env.GARMIN_REDIRECT_URI || '';

  const authHeader = generateOAuthHeader(
    'POST',
    GARMIN_REQUEST_TOKEN_URL,
    consumerKey,
    consumerSecret,
    undefined,
    undefined,
    { oauth_callback: callbackUrl }
  );

  const response = await axios.post(GARMIN_REQUEST_TOKEN_URL, null, {
    headers: { Authorization: authHeader },
  });

  const params = new URLSearchParams(response.data);
  return {
    oauth_token: params.get('oauth_token') || '',
    oauth_token_secret: params.get('oauth_token_secret') || '',
  };
}

export function getGarminAuthUrl(requestToken: string): string {
  return `${GARMIN_AUTH_URL}?oauth_token=${requestToken}`;
}

export async function getGarminAccessToken(
  requestToken: string,
  requestTokenSecret: string,
  verifier: string
): Promise<GarminTokens> {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY || '';
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET || '';

  const authHeader = generateOAuthHeader(
    'POST',
    GARMIN_ACCESS_TOKEN_URL,
    consumerKey,
    consumerSecret,
    requestToken,
    requestTokenSecret,
    { oauth_verifier: verifier }
  );

  const response = await axios.post(GARMIN_ACCESS_TOKEN_URL, null, {
    headers: { Authorization: authHeader },
  });

  const params = new URLSearchParams(response.data);
  return {
    oauth_token: params.get('oauth_token') || '',
    oauth_token_secret: params.get('oauth_token_secret') || '',
  };
}

export async function fetchGarminActivities(tokens: GarminTokens, startDate: string, endDate: string): Promise<any[]> {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY || '';
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET || '';
  const url = `${GARMIN_API_BASE}/activities`;

  const authHeader = generateOAuthHeader(
    'GET',
    url,
    consumerKey,
    consumerSecret,
    tokens.oauth_token,
    tokens.oauth_token_secret,
    { uploadStartTimeInSeconds: startDate, uploadEndTimeInSeconds: endDate }
  );

  const response = await axios.get(url, {
    headers: { Authorization: authHeader },
    params: { uploadStartTimeInSeconds: startDate, uploadEndTimeInSeconds: endDate },
  });

  return response.data?.activityList || [];
}

export async function fetchGarminDailies(tokens: GarminTokens, startDate: string, endDate: string): Promise<any[]> {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY || '';
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET || '';
  const url = `${GARMIN_API_BASE}/dailies`;

  const authHeader = generateOAuthHeader(
    'GET',
    url,
    consumerKey,
    consumerSecret,
    tokens.oauth_token,
    tokens.oauth_token_secret,
    { startTimeInSeconds: startDate, endTimeInSeconds: endDate }
  );

  const response = await axios.get(url, {
    headers: { Authorization: authHeader },
    params: { startTimeInSeconds: startDate, endTimeInSeconds: endDate },
  });

  return response.data?.dailies || [];
}
