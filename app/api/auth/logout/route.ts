import { NextRequest, NextResponse } from 'next/server';
import { clearSession } from '@/lib/jwtSession';

export async function POST(req: NextRequest) {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}

