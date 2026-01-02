import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';

export async function GET(req: NextRequest) {
  const session = await getSession();
  const authenticated = !!session?.accessToken;
  
  return NextResponse.json({
    authenticated,
    user: authenticated ? session.user : null,
  });
}

