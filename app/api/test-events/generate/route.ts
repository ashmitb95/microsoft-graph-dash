import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';
import { GraphService } from '@/services/graphService';
import { TestEventGenerator } from '@/services/testEventGenerator';

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

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const {
      startDate,
      endDate,
      eventsPerDay = 3,
      minDuration = 30,
      maxDuration = 60,
      timeZone = 'UTC',
      realistic = false,
    } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    // Limit the date range to prevent too many events
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 30 days' },
        { status: 400 }
      );
    }

    const accessToken = session.accessToken;
    const graphService = getGraphService();

    // Generate test events
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

    if (testEvents.length === 0) {
      return NextResponse.json(
        { error: 'No events generated. Check your date range and configuration.' },
        { status: 400 }
      );
    }

    // Create events in bulk
    const result = await graphService.createCalendarEventsBulk(accessToken, testEvents);

    return NextResponse.json({
      success: true,
      requested: testEvents.length,
      created: result.created,
      failed: result.failed,
      errors: result.errors,
      message: `Created ${result.created} out of ${testEvents.length} events`,
    });
  } catch (error: any) {
    console.error('Test events generation error:', error);
    
    if (error.message?.includes('token') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    if (error.message?.includes('403') || error.message?.includes('permission')) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions. Please ensure Calendars.ReadWrite permission is granted in Azure AD.',
          details: 'Go to Azure Portal → Your App → API permissions → Add Calendars.ReadWrite → Grant admin consent'
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate test events', details: error.message },
      { status: 500 }
    );
  }
}

