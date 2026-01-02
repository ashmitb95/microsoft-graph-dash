import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export interface SessionData {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'change-me-in-production';
const COOKIE_NAME = 'session_token';
const COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

/**
 * Create a JWT token from session data
 */
export function createSessionToken(sessionData: SessionData): string {
  return jwt.sign(sessionData, JWT_SECRET, {
    expiresIn: '24h',
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionData;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get session from JWT cookie (for API routes)
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySessionToken(token);
}

/**
 * Set session cookie (for API routes)
 */
export async function setSession(sessionData: SessionData): Promise<void> {
  const cookieStore = cookies();
  const token = createSessionToken(sessionData);
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session cookie (for API routes)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  const isProduction = process.env.NODE_ENV === 'production';
  
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 0,
    path: '/',
  });
}

