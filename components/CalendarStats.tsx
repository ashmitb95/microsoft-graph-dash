import { CalendarMetadata } from '@/lib/api';
import './CalendarStats.css';

interface CalendarStatsProps {
  metadata: CalendarMetadata | null;
  loading?: boolean;
}

const CalendarStats = ({ metadata, loading }: CalendarStatsProps) => {
  if (loading) {
    return (
      <div className="calendar-stats">
        <div className="stats-loading">Loading calendar data...</div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="calendar-stats">
        <div className="stats-empty">No calendar data available</div>
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="calendar-stats">
      <h2 className="stats-title">Calendar Analytics</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{metadata.totalEvents}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Meeting Hours</div>
          <div className="stat-value">{metadata.totalMeetingHours.toFixed(1)}h</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Average Duration</div>
          <div className="stat-value">{formatDuration(metadata.averageDuration)}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Average Gap</div>
          <div className="stat-value">{formatDuration(metadata.averageGap)}</div>
        </div>
      </div>

      <div className="stats-date-range">
        <span className="date-label">Date Range:</span>
        <span className="date-value">
          {formatDate(metadata.dateRange.start)} - {formatDate(metadata.dateRange.end)}
        </span>
      </div>

      {metadata.gaps.length > 0 && (
        <div className="stats-gaps">
          <h3 className="gaps-title">Meeting Gaps</h3>
          <div className="gaps-list">
            {metadata.gaps.slice(0, 5).map((gap, index) => (
              <div key={index} className="gap-item">
                <span className="gap-duration">{formatDuration(gap.duration)}</span>
                <span className="gap-time">
                  {new Date(gap.start).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })} - {new Date(gap.end).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
            {metadata.gaps.length > 5 && (
              <div className="gap-more">+{metadata.gaps.length - 5} more gaps</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarStats;

