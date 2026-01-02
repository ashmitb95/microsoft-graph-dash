import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';
import { TestEventGenerator } from '@/services/testEventGenerator';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventsPerDay = parseInt(searchParams.get('eventsPerDay') || '3');
    const minDuration = parseInt(searchParams.get('minDuration') || '30');
    const maxDuration = parseInt(searchParams.get('maxDuration') || '60');
    const timeZone = searchParams.get('timeZone') || 'UTC';
    const realistic = searchParams.get('realistic') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    let testEvents;
    if (realistic) {
      testEvents = TestEventGenerator.generateRealisticWeek(startDate, timeZone);
    } else {
      testEvents = TestEventGenerator.generateEvents({
        startDate,
        endDate,
        eventsPerDay,
        minDuration,
        maxDuration,
        timeZone,
      });
    }

    return NextResponse.json({
      count: testEvents.length,
      events: testEvents.slice(0, 10), // Preview first 10
      total: testEvents.length,
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to preview events', details: error.message },
      { status: 500 }
    );
  }
}

