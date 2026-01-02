import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  return NextResponse.json({
    user: session.user,
    authenticated: true,
  });
}

