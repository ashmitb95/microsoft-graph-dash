import { NextRequest, NextResponse } from 'next/server';
import { GraphService } from '@/services/graphService';
import { createSessionToken } from '@/lib/jwtSession';

let graphServiceInstance: GraphService | null = null;

const getGraphService = (): GraphService => {
  if (!graphServiceInstance) {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('CLIENT_ID and CLIENT_SECRET must be set in environment variables');
    }
    
    graphServiceInstance = new GraphService({
      clientId,
      clientSecret,
      tenantId: process.env.TENANT_ID || 'common',
      redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
    });
  }
  return graphServiceInstance;
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error) {
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(errorDescription || error)}`
      );
    }

    if (!code) {
      const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      return NextResponse.redirect(`${frontendUrl}/login?error=missing_code`);
    }

    // Exchange code for tokens
    const graphService = getGraphService();
    const tokenResponse = await graphService.acquireTokenByCode(code);
    
    // Get user profile
    const userProfile = await graphService.getUserProfile(tokenResponse.accessToken);

    // Store tokens and user info in JWT session cookie
    const sessionData = {
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.account?.homeAccountId,
      user: {
        id: userProfile.id,
        displayName: userProfile.displayName,
        email: userProfile.mail || userProfile.userPrincipalName,
      },
    };
    
    const token = createSessionToken(sessionData);
    const isProduction = process.env.NODE_ENV === 'production';
    
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard`
    );
    
    // Set session cookie on response
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Callback error:', error);
    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return NextResponse.redirect(
      `${frontendUrl}/login?error=${encodeURIComponent(error.message)}`
    );
  }
}

