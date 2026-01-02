import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import './CalendarView.css';

interface CalendarViewProps {
  startDate: string;
  endDate: string;
}

interface CalendarEvent {
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
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

const CalendarView = ({ startDate, endDate }: CalendarViewProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, [startDate, endDate]);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getCalendarEvents(startDate, endDate);
      setEvents(response.data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  // Group events by date
  const eventsByDate: { [date: string]: CalendarEvent[] } = {};
  events.forEach((event) => {
    const dateKey = new Date(event.start.dateTime).toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(event);
  });

  // Generate all dates in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates: Date[] = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDayEvents = (date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return eventsByDate[dateKey] || [];
  };

  if (loading) {
    return (
      <div className="calendar-view">
        <div className="calendar-loading">Loading calendar events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-view">
        <div className="calendar-error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <h2 className="calendar-title">Calendar View</h2>
        <button onClick={loadEvents} className="refresh-calendar-btn">
          Refresh
        </button>
      </div>

      <div className="calendar-grid">
        {dates.map((date, index) => {
          const dayEvents = getDayEvents(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate === date.toISOString().split('T')[0];

          return (
            <div
              key={index}
              className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
              onClick={() => setSelectedDate(isSelected ? null : date.toISOString().split('T')[0])}
            >
              <div className="day-header">
                <div className="day-date">{formatDate(date)}</div>
                <div className="day-count">{dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}</div>
              </div>
              <div className="day-events">
                {dayEvents.slice(0, 3).map((event) => (
                  <div key={event.id} className="day-event">
                    <div className="event-time">{formatTime(event.start.dateTime)}</div>
                    <div className="event-subject">{event.subject}</div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="day-event-more">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedDate && eventsByDate[selectedDate] && (
        <div className="selected-day-details">
          <h3 className="details-title">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>
          <div className="details-events">
            {eventsByDate[selectedDate]
              .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime())
              .map((event) => (
                <div key={event.id} className="detail-event">
                  <div className="detail-event-time">
                    {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                  </div>
                  <div className="detail-event-subject">{event.subject}</div>
                  {event.organizer && (
                    <div className="detail-event-organizer">
                      Organized by: {event.organizer.emailAddress.name}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;

