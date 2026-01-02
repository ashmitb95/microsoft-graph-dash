import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwtSession';
import { GraphService } from '@/services/graphService';
import { TimeSeriesAnalyzer } from '@/services/timeSeriesAnalyzer';

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
    const session = await getSession();
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      end = new Date();
      start = new Date();
      start.setDate(start.getDate() - 7);
    }

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

    const accessToken = session.accessToken;
    const startDateStr = start.toISOString().split('T')[0];
    const endDateStr = end.toISOString().split('T')[0];

    const graphService = getGraphService();
    const events = await graphService.getCalendarEvents(
      accessToken,
      startDateStr,
      endDateStr
    );

    const timeSeriesData = TimeSeriesAnalyzer.analyze(events, startDateStr, endDateStr);

    return NextResponse.json({ timeSeries: timeSeriesData });
  } catch (error: any) {
    console.error('Time series fetch error:', error);
    
    if (error.message?.includes('token') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Token expired. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch time series data', details: error.message },
      { status: 500 }
    );
  }
}

