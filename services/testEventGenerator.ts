/**
 * Service to generate test calendar events for bulk creation
 */

export interface TestEventConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  eventsPerDay?: number;
  minDuration?: number; // minutes
  maxDuration?: number; // minutes
  timeZone?: string;
}

export interface TestEvent {
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  body?: { contentType: string; content: string };
}

export class TestEventGenerator {
  private static meetingSubjects = [
    'Team Standup',
    'Project Review',
    'Client Meeting',
    'Sprint Planning',
    'Code Review',
    'Design Discussion',
    'One-on-One',
    'Product Demo',
    'Strategy Session',
    'Weekly Sync',
    'Retrospective',
    'Training Session',
    'Workshop',
    'Interview',
    'Budget Review',
    'Status Update',
    'Brainstorming',
    'Technical Deep Dive',
    'Architecture Review',
    'Performance Review',
  ];

  /**
   * Generate realistic test calendar events
   */
  static generateEvents(config: TestEventConfig): TestEvent[] {
    const {
      startDate,
      endDate,
      eventsPerDay = 3,
      minDuration = 30,
      maxDuration = 60,
      timeZone = 'UTC',
    } = config;

    const events: TestEvent[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const currentDate = new Date(start);

    // Generate events for each day in the range
    while (currentDate <= end) {
      const dayEvents = this.generateDayEvents(
        currentDate,
        eventsPerDay,
        minDuration,
        maxDuration,
        timeZone
      );
      events.push(...dayEvents);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return events;
  }

  /**
   * Generate events for a single day
   */
  private static generateDayEvents(
    date: Date,
    count: number,
    minDuration: number,
    maxDuration: number,
    timeZone: string
  ): TestEvent[] {
    const events: TestEvent[] = [];
    const workStartHour = 9; // 9 AM
    const workEndHour = 17; // 5 PM
    const availableHours = workEndHour - workStartHour;

    // Generate random times throughout the day
    const timeSlots: number[] = [];
    for (let i = 0; i < count; i++) {
      const hour = workStartHour + Math.random() * availableHours;
      timeSlots.push(hour);
    }
    timeSlots.sort((a, b) => a - b);

    // Create events with gaps between them
    let lastEndTime = workStartHour;

    for (let i = 0; i < count && i < timeSlots.length; i++) {
      const startHour = Math.max(timeSlots[i], lastEndTime);
      const duration = minDuration + Math.random() * (maxDuration - minDuration);
      const endHour = startHour + duration / 60;

      // Don't create events that go past work hours
      if (endHour > workEndHour) {
        continue;
      }

      const startDateTime = this.createDateTime(date, startHour, timeZone);
      const endDateTime = this.createDateTime(date, endHour, timeZone);

      const subject =
        this.meetingSubjects[
          Math.floor(Math.random() * this.meetingSubjects.length)
        ];

      events.push({
        subject: `${subject} - ${this.getRandomSuffix()}`,
        start: {
          dateTime: startDateTime,
          timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone,
        },
        body: {
          contentType: 'HTML',
          content: `<p>Test event generated for calendar analysis.</p>`,
        },
      });

      // Add random gap between meetings (15-60 minutes)
      const gap = 15 + Math.random() * 45;
      lastEndTime = endHour + gap / 60;
    }

    return events;
  }

  /**
   * Create ISO datetime string for a given hour
   */
  private static createDateTime(date: Date, hour: number, timeZone: string): string {
    const newDate = new Date(date);
    const hours = Math.floor(hour);
    const minutes = Math.floor((hour - hours) * 60);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate.toISOString();
  }

  /**
   * Get random suffix for meeting subjects
   */
  private static getRandomSuffix(): string {
    const suffixes = [
      'Q1 Planning',
      '2024',
      'Review',
      'Follow-up',
      'Part 1',
      'Part 2',
      'Final',
      'Initial',
    ];
    return suffixes[Math.floor(Math.random() * suffixes.length)];
  }

  /**
   * Generate a realistic week of meetings
   */
  static generateRealisticWeek(startDate: string, timeZone: string = 'UTC'): TestEvent[] {
    const start = new Date(startDate);
    const events: TestEvent[] = [];

    // Generate events for 7 days
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);

      // Skip weekends (optional - you can remove this)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        continue; // Skip Sunday and Saturday
      }

      // Vary meeting count per day
      const meetingsPerDay = day === 2 || day === 4 ? 5 : 2 + Math.floor(Math.random() * 4); // More meetings on Wed/Fri

      const dayEvents = this.generateDayEvents(
        currentDate,
        meetingsPerDay,
        30,
        90,
        timeZone
      );
      events.push(...dayEvents);
    }

    return events;
  }
}

