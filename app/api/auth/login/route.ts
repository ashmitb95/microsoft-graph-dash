import { NextRequest, NextResponse } from 'next/server';
import { GraphService } from '@/services/graphService';

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
    const graphService = getGraphService();
    const searchParams = req.nextUrl.searchParams;
    const state = searchParams.get('state') || '';
    const authUrl = await graphService.getAuthUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate login', details: error.message },
      { status: 500 }
    );
  }
}

