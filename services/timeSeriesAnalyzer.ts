import { CalendarEvent } from './calendarAnalyzer';

export interface DailyMetric {
  date: string; // YYYY-MM-DD
  meetingCount: number;
  meetingHours: number;
  totalDuration: number; // minutes
  averageDuration: number; // minutes
  averageGap: number; // minutes
  longestGap: number; // minutes
  shortestGap: number; // minutes
}

export interface TimeSeriesData {
  metrics: DailyMetric[];
  summary: {
    totalDays: number;
    averageMeetingsPerDay: number;
    averageHoursPerDay: number;
    peakDay: { date: string; count: number };
    quietestDay: { date: string; count: number };
  };
}

export class TimeSeriesAnalyzer {
  /**
   * Analyze calendar events and return daily metrics for time series visualization
   */
  static analyze(events: CalendarEvent[], startDate: string, endDate: string): TimeSeriesData {
    // Filter and process events
    const validEvents = events
      .filter((event) => !event.isAllDay && event.start?.dateTime && event.end?.dateTime)
      .map((event) => ({
        ...event,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
        duration: Math.round(
          (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) /
            (1000 * 60)
        ),
      }))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Group events by date
    const eventsByDate: { [date: string]: typeof validEvents } = {};
    validEvents.forEach((event) => {
      const dateKey = event.startTime.toISOString().split('T')[0];
      if (!eventsByDate[dateKey]) {
        eventsByDate[dateKey] = [];
      }
      eventsByDate[dateKey].push(event);
    });

    // Generate all dates in range (including days with no events)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const allDates: string[] = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate daily metrics
    const metrics: DailyMetric[] = allDates.map((date) => {
      const dayEvents = eventsByDate[date] || [];
      const meetingCount = dayEvents.length;
      const totalDuration = dayEvents.reduce((sum, event) => sum + event.duration, 0);
      const meetingHours = Math.round((totalDuration / 60) * 100) / 100;
      const averageDuration =
        meetingCount > 0 ? Math.round((totalDuration / meetingCount) * 100) / 100 : 0;

      // Calculate gaps for this day
      const dayGaps: number[] = [];
      const sortedDayEvents = [...dayEvents].sort(
        (a, b) => a.startTime.getTime() - b.startTime.getTime()
      );

      for (let i = 0; i < sortedDayEvents.length - 1; i++) {
        const gapMs =
          sortedDayEvents[i + 1].startTime.getTime() - sortedDayEvents[i].endTime.getTime();
        if (gapMs > 0) {
          dayGaps.push(Math.round(gapMs / (1000 * 60)));
        }
      }

      const averageGap =
        dayGaps.length > 0
          ? Math.round((dayGaps.reduce((sum, gap) => sum + gap, 0) / dayGaps.length) * 100) / 100
          : 0;
      const longestGap = dayGaps.length > 0 ? Math.max(...dayGaps) : 0;
      const shortestGap = dayGaps.length > 0 ? Math.min(...dayGaps) : 0;

      return {
        date,
        meetingCount,
        meetingHours,
        totalDuration,
        averageDuration,
        averageGap,
        longestGap,
        shortestGap,
      };
    });

    // Calculate summary statistics
    const daysWithMeetings = metrics.filter((m) => m.meetingCount > 0);
    const totalMeetings = metrics.reduce((sum, m) => sum + m.meetingCount, 0);
    const totalHours = metrics.reduce((sum, m) => sum + m.meetingHours, 0);
    const averageMeetingsPerDay = metrics.length > 0 ? totalMeetings / metrics.length : 0;
    const averageHoursPerDay = metrics.length > 0 ? totalHours / metrics.length : 0;

    // Find peak and quietest days
    const peakDay = metrics.reduce(
      (max, m) => (m.meetingCount > max.count ? { date: m.date, count: m.meetingCount } : max),
      { date: '', count: 0 }
    );

    // Find quietest day (day with fewest meetings, but at least 0)
    const quietestDay = metrics.reduce(
      (min, m) => {
        if (min.count === -1) {
          return { date: m.date, count: m.meetingCount };
        }
        return m.meetingCount < min.count ? { date: m.date, count: m.meetingCount } : min;
      },
      { date: metrics.length > 0 ? metrics[0].date : '', count: -1 }
    );
    
    // Ensure quietestDay has valid values
    if (quietestDay.count === -1) {
      quietestDay.count = 0;
      quietestDay.date = metrics.length > 0 ? metrics[0].date : '';
    }

    return {
      metrics,
      summary: {
        totalDays: metrics.length,
        averageMeetingsPerDay: Math.round(averageMeetingsPerDay * 100) / 100,
        averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
        peakDay,
        quietestDay,
      },
    };
  }
}

