import { getSession, SessionData } from './jwtSession';

/**
 * Get session data from JWT cookie
 * Returns null if not authenticated
 */
export async function getSessionData(): Promise<SessionData | null> {
  return await getSession();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.accessToken;
}

