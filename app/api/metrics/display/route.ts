import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';

// In-memory store for the numerical value (for MVP)
// In production, this would be stored in a database
// Note: This will be lost on serverless function restart
let currentValue: number | null = null;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  return NextResponse.json({
    value: currentValue,
    hasValue: currentValue !== null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { value } = body;

    if (typeof value !== 'number' || isNaN(value)) {
      return NextResponse.json(
        { error: 'Invalid value. Must be a number.' },
        { status: 400 }
      );
    }

    currentValue = value;

    return NextResponse.json({
      success: true,
      value: currentValue,
      message: 'Value updated successfully',
    });
  } catch (error: any) {
    console.error('Metrics update error:', error);
    return NextResponse.json(
      { error: 'Failed to update value', details: error.message },
      { status: 500 }
    );
  }
}

