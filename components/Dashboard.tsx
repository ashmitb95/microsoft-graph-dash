import { useEffect, useState } from 'react';
import { api, CalendarMetadata, auth } from '@/lib/api';
import WeeklyOrganicComparison from './WeeklyOrganicComparison';
import CalendarView from './CalendarView';
import TestEventModal from './TestEventModal';
import TimeSeriesChart from './TimeSeriesChart';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [metadata, setMetadata] = useState<CalendarMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'meetingCount' | 'meetingHours' | 'averageDuration' | 'averageGap'>('meetingCount');
  
  // Date range state (default: last 7 days)
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    loadUser();
    loadCalendarData();
  }, []);

  useEffect(() => {
    loadCalendarData();
  }, [startDate, endDate]);

  const loadUser = async () => {
    try {
      const response = await api.getUser();
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  };

  const loadCalendarData = async () => {
    setLoading(true);
    try {
      const response = await api.getCalendarMetadata(startDate, endDate);
      setMetadata(response.data.metadata);
    } catch (error: any) {
      console.error('Failed to load calendar data:', error);
      if (error.response?.status === 401) {
        auth.logout();
      }
    } finally {
      setLoading(false);
    }
  };


  const handleLogout = () => {
    auth.logout();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">Microsoft Graph Dashboard</h1>
          <div className="header-right">
            {user && (
              <div className="user-info">
                <span className="user-name">{user.displayName}</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-content">
          {/* Date Range Selector */}
          <div className="date-range-selector">
            <label>
              Start Date:
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </label>
            <button 
              onClick={loadCalendarData} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Weekly Organic Comparison - Day by Day */}
          <WeeklyOrganicComparison startDate={startDate} endDate={endDate} />

          {/* Calendar View */}
          <CalendarView startDate={startDate} endDate={endDate} />

          {/* Time Series Chart */}
          <div className="time-series-section">
            <div className="time-series-header">
              <h2 className="section-title">Calendar Trends Over Time</h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as any)}
                className="metric-selector"
              >
                <option value="meetingCount">Meeting Count</option>
                <option value="meetingHours">Meeting Hours</option>
                <option value="averageDuration">Average Duration</option>
                <option value="averageGap">Average Gap</option>
              </select>
            </div>
            <TimeSeriesChart
              startDate={startDate}
              endDate={endDate}
              metric={selectedMetric}
            />
          </div>

          {/* Test Event Generator CTA (Fixed Button) */}
          <TestEventModal />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

