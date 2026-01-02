import { CalendarEvent, CalendarMetadata } from './calendarAnalyzer';

export interface CalendarInsight {
  type: 'warning' | 'suggestion' | 'info' | 'success';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable?: string;
}

export interface CalendarInsights {
  insights: CalendarInsight[];
  patterns: {
    busiestDay: { date: string; count: number };
    averageMeetingsPerDay: number;
    meetingOverload: boolean;
    focusTimeAvailable: boolean;
    workLifeBalance: 'good' | 'moderate' | 'poor';
  };
  recommendations: string[];
}

export class CalendarInsightsService {
  /**
   * Generate insights and recommendations based on calendar analysis
   */
  static generateInsights(
    events: CalendarEvent[],
    metadata: CalendarMetadata
  ): CalendarInsights {
    const insights: CalendarInsight[] = [];
    const recommendations: string[] = [];

    // Analyze patterns
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
      }));

    // Find busiest day
    const eventsPerDay = metadata.eventsPerDay;
    const busiestDay = Object.entries(eventsPerDay).reduce(
      (max, [date, count]) => (count > max.count ? { date, count } : max),
      { date: '', count: 0 }
    );

    const averageMeetingsPerDay =
      metadata.totalEvents / Math.max(1, Object.keys(eventsPerDay).length);

    // Meeting overload detection
    const meetingOverload = averageMeetingsPerDay > 6 || metadata.totalMeetingHours > 30;
    const highMeetingDays = Object.values(eventsPerDay).filter((count) => count >= 6).length;

    // Focus time analysis
    const longGaps = metadata.gaps.filter((gap) => gap.duration >= 60);
    const focusTimeAvailable = longGaps.length > 0;

    // Work-life balance assessment
    let workLifeBalance: 'good' | 'moderate' | 'poor' = 'good';
    if (metadata.totalMeetingHours > 35 || averageMeetingsPerDay > 7) {
      workLifeBalance = 'poor';
    } else if (metadata.totalMeetingHours > 25 || averageMeetingsPerDay > 5) {
      workLifeBalance = 'moderate';
    }

    // Generate insights

    // Meeting overload warning
    if (meetingOverload) {
      insights.push({
        type: 'warning',
        title: 'High Meeting Load Detected',
        description: `You have ${metadata.totalMeetingHours.toFixed(1)} meeting hours this week with an average of ${averageMeetingsPerDay.toFixed(1)} meetings per day.`,
        priority: 'high',
        actionable: 'Consider blocking focus time and declining non-essential meetings.',
      });
      recommendations.push('Block 2-3 hours daily for focused work');
      recommendations.push('Review recurring meetings - can any be reduced in frequency?');
    }

    // Busiest day insight
    if (busiestDay.count > 0) {
      const busiestDate = new Date(busiestDay.date);
      insights.push({
        type: 'info',
        title: 'Busiest Day',
        description: `${busiestDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        })} is your busiest day with ${busiestDay.count} meetings.`,
        priority: 'medium',
        actionable: 'Prepare in advance and block buffer time before/after.',
      });
    }

    // Focus time opportunities
    if (focusTimeAvailable) {
      const totalFocusTime = longGaps.reduce((sum, gap) => sum + gap.duration, 0);
      insights.push({
        type: 'success',
        title: 'Focus Time Available',
        description: `You have ${longGaps.length} gaps of 60+ minutes totaling ${Math.round(
          totalFocusTime / 60
        )} hours that could be used for focused work.`,
        priority: 'medium',
        actionable: 'Block these times in your calendar to protect them.',
      });
      recommendations.push('Schedule deep work during identified focus time slots');
    } else if (metadata.gaps.length > 0 && metadata.averageGap < 30) {
      insights.push({
        type: 'warning',
        title: 'Limited Focus Time',
        description: `Your average gap between meetings is only ${Math.round(
          metadata.averageGap
        )} minutes, leaving little time for focused work.`,
        priority: 'high',
        actionable: 'Consider scheduling longer breaks between meetings.',
      });
      recommendations.push('Aim for at least 30-minute buffers between meetings');
    }

    // Short meeting gaps
    const shortGaps = metadata.gaps.filter((gap) => gap.duration < 15);
    if (shortGaps.length > 3) {
      insights.push({
        type: 'warning',
        title: 'Back-to-Back Meetings',
        description: `You have ${shortGaps.length} gaps of less than 15 minutes between meetings, which can lead to meeting fatigue.`,
        priority: 'medium',
        actionable: 'Add buffer time between meetings to allow for breaks and preparation.',
      });
      recommendations.push('Add 15-minute buffers between consecutive meetings');
    }

    // Meeting duration analysis
    if (metadata.averageDuration > 60) {
      insights.push({
        type: 'suggestion',
        title: 'Long Average Meeting Duration',
        description: `Your average meeting is ${Math.round(
          metadata.averageDuration
        )} minutes. Consider if some meetings could be shorter.`,
        priority: 'low',
        actionable: 'Try defaulting to 25 or 45-minute meetings instead of 30 or 60.',
      });
      recommendations.push('Experiment with shorter default meeting durations');
    }

    // High meeting count days
    if (highMeetingDays > 0) {
      insights.push({
        type: 'warning',
        title: 'Multiple High-Meeting Days',
        description: `You have ${highMeetingDays} day(s) with 6+ meetings, which can be overwhelming.`,
        priority: 'high',
        actionable: 'Distribute meetings more evenly across the week if possible.',
      });
    }

    // Positive feedback
    if (!meetingOverload && metadata.averageGap >= 30 && workLifeBalance === 'good') {
      insights.push({
        type: 'success',
        title: 'Well-Balanced Schedule',
        description: 'Your calendar shows good balance with adequate time between meetings.',
        priority: 'low',
      });
    }

    // No meetings insight
    if (metadata.totalEvents === 0) {
      insights.push({
        type: 'info',
        title: 'No Meetings Found',
        description: 'No meetings found in the selected date range.',
        priority: 'low',
      });
    }

    return {
      insights,
      patterns: {
        busiestDay,
        averageMeetingsPerDay: Math.round(averageMeetingsPerDay * 100) / 100,
        meetingOverload,
        focusTimeAvailable,
        workLifeBalance,
      },
      recommendations: [...new Set(recommendations)], // Remove duplicates
    };
  }
}

