export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  isAllDay?: boolean;
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  attendees?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
}

export interface CalendarMetadata {
  dateRange: {
    start: string;
    end: string;
  };
  totalEvents: number;
  totalDuration: number; // minutes
  averageDuration: number; // minutes
  eventsPerDay: { [date: string]: number };
  gaps: Array<{
    start: string;
    end: string;
    duration: number; // minutes
  }>;
  averageGap: number; // minutes
  totalMeetingHours: number;
}

export class CalendarAnalyzer {
  /**
   * Analyze calendar events and extract metadata
   */
  static analyze(events: CalendarEvent[], startDate: string, endDate: string): CalendarMetadata {
    // Filter out all-day events and sort by start time
    const validEvents = events
      .filter((event) => !event.isAllDay && event.start?.dateTime && event.end?.dateTime)
      .map((event) => ({
        ...event,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime),
      }))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Calculate durations
    const durations = validEvents.map((event) => {
      const durationMs = event.endTime.getTime() - event.startTime.getTime();
      return Math.round(durationMs / (1000 * 60)); // Convert to minutes
    });

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = validEvents.length > 0 ? totalDuration / validEvents.length : 0;

    // Calculate events per day
    const eventsPerDay: { [date: string]: number } = {};
    validEvents.forEach((event) => {
      const dateKey = event.startTime.toISOString().split('T')[0];
      eventsPerDay[dateKey] = (eventsPerDay[dateKey] || 0) + 1;
    });

    // Calculate gaps between meetings
    const gaps: Array<{ start: string; end: string; duration: number }> = [];
    
    for (let i = 0; i < validEvents.length - 1; i++) {
      const currentEvent = validEvents[i];
      const nextEvent = validEvents[i + 1];
      
      const gapStart = currentEvent.endTime;
      const gapEnd = nextEvent.startTime;
      const gapDurationMs = gapEnd.getTime() - gapStart.getTime();
      
      // Only count gaps that are positive (no overlapping meetings)
      if (gapDurationMs > 0) {
        const gapDurationMinutes = Math.round(gapDurationMs / (1000 * 60));
        gaps.push({
          start: gapStart.toISOString(),
          end: gapEnd.toISOString(),
          duration: gapDurationMinutes,
        });
      }
    }

    const totalGapDuration = gaps.reduce((sum, gap) => sum + gap.duration, 0);
    const averageGap = gaps.length > 0 ? totalGapDuration / gaps.length : 0;

    return {
      dateRange: {
        start: startDate,
        end: endDate,
      },
      totalEvents: validEvents.length,
      totalDuration,
      averageDuration: Math.round(averageDuration * 100) / 100,
      eventsPerDay,
      gaps,
      averageGap: Math.round(averageGap * 100) / 100,
      totalMeetingHours: Math.round((totalDuration / 60) * 100) / 100,
    };
  }
}

