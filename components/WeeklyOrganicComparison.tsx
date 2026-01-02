import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import './WeeklyOrganicComparison.css';

interface WeeklyOrganicComparisonProps {
  startDate: string;
  endDate: string;
}

interface DailyMetric {
  date: string;
  meetingCount: number;
  meetingHours: number;
  totalDuration: number;
  averageDuration: number;
  averageGap: number;
  longestGap: number;
  shortestGap: number;
}

type MetricType = 'meetingHours' | 'meetingCount' | 'averageDuration' | 'averageGap' | 'totalDuration';

const WeeklyOrganicComparison = ({ startDate, endDate }: WeeklyOrganicComparisonProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('meetingHours');
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeSeriesData();
  }, [startDate, endDate]);

  const loadTimeSeriesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getTimeSeries(startDate, endDate);
      if (response.data.timeSeries?.metrics) {
        setDailyMetrics(response.data.timeSeries.metrics);
      } else {
        setError('Invalid response structure');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load time series data');
    } finally {
      setLoading(false);
    }
  };

  const getMetricValue = (day: DailyMetric, metric: MetricType): number => {
    switch (metric) {
      case 'meetingHours':
        return day.meetingHours;
      case 'meetingCount':
        return day.meetingCount;
      case 'averageDuration':
        return day.averageDuration;
      case 'averageGap':
        return day.averageGap;
      case 'totalDuration':
        return day.totalDuration / 60; // Convert to hours
      default:
        return 0;
    }
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'meetingHours':
        return 'Meeting Hours';
      case 'meetingCount':
        return 'Meeting Count';
      case 'averageDuration':
        return 'Avg Duration (min)';
      case 'averageGap':
        return 'Avg Gap (min)';
      case 'totalDuration':
        return 'Total Duration (hrs)';
    }
  };

  const formatValue = (value: number, metric: MetricType) => {
    switch (metric) {
      case 'meetingHours':
        return `${value.toFixed(1)}h`;
      case 'meetingCount':
        return Math.round(value).toString();
      case 'averageDuration':
        return `${Math.round(value)}m`;
      case 'averageGap':
        return `${Math.round(value)}m`;
      case 'totalDuration':
        return `${value.toFixed(1)}h`;
    }
  };

  // Calculate max value for normalization
  const maxValue = dailyMetrics.length > 0
    ? Math.max(...dailyMetrics.map(day => getMetricValue(day, selectedMetric)))
    : 1;

  const formatDayLabel = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  if (loading) {
    return (
      <div className="weekly-organic-comparison">
        <div className="comparison-loading">Loading weekly comparison...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weekly-organic-comparison">
        <div className="comparison-error">Error: {error}</div>
      </div>
    );
  }

  if (dailyMetrics.length === 0) {
    return (
      <div className="weekly-organic-comparison">
        <div className="comparison-empty">No data available for the selected date range</div>
      </div>
    );
  }

  const metrics: { value: MetricType; label: string }[] = [
    { value: 'meetingHours', label: 'Meeting Hours' },
    { value: 'meetingCount', label: 'Meeting Count' },
    { value: 'averageDuration', label: 'Avg Duration' },
    { value: 'averageGap', label: 'Avg Gap' },
    { value: 'totalDuration', label: 'Total Duration' },
  ];

  return (
    <div className="weekly-organic-comparison">
      <div className="comparison-header">
        <h2 className="comparison-title">Weekly Calendar Comparison</h2>
        <p className="comparison-subtitle">Day-by-day visualization of {getMetricLabel(selectedMetric).toLowerCase()}</p>
      </div>

      <div className="metric-selector-group">
        {metrics.map((metric) => (
          <button
            key={metric.value}
            onClick={() => setSelectedMetric(metric.value)}
            className={`metric-selector-btn ${selectedMetric === metric.value ? 'active' : ''}`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div className="days-grid">
        {dailyMetrics.map((day, index) => {
          const value = getMetricValue(day, selectedMetric);
          const normalizedValue = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const size = 90 + (normalizedValue * 1.5); // Base 90px, scales up to ~240px
          const morphValue = value % 100;
          const dayLabel = formatDayLabel(day.date);
          const isToday = day.date === new Date().toISOString().split('T')[0];

          // Generate dynamic border radius for organic blob
          const getBorderRadius = () => {
            const base = 30;
            const variation = morphValue;
            return `${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}% ${base + variation * 0.4}% / ${base + variation * 0.4}% ${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}%`;
          };

          // Color based on normalized value - using pastel theme colors
          const getColor = () => {
            if (normalizedValue > 70) return '#fce8e0'; // pastel-coral for high values
            if (normalizedValue > 40) return '#e8edf5'; // pastel-blue for medium
            return '#f8f9fa'; // pastel-silver for low values
          };
          const getBorderColor = () => {
            if (normalizedValue > 70) return '#ef8354'; // coral-glow border
            if (normalizedValue > 40) return '#4f5d75'; // blue-slate border
            return '#bfc0c0'; // silver border
          };
          const color = getColor();
          const borderColor = getBorderColor();
          const rotation = normalizedValue * 3.6;

          return (
            <motion.div
              key={day.date}
              className={`day-card ${isToday ? 'today' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <div className="day-header">
                <div className="day-label">
                  <div className="day-name">{dayLabel.day}</div>
                  <div className="day-date">{dayLabel.date} {dayLabel.month}</div>
                </div>
                {isToday && <div className="today-badge">Today</div>}
              </div>

              <div className="day-visualization">
                <motion.div
                  className="organic-shape"
                  style={{
                    width: size,
                    height: size,
                    borderRadius: getBorderRadius(),
                    background: color,
                    border: `2px solid ${borderColor}`,
                  }}
                  animate={{
                    rotate: rotation,
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    rotate: {
                      duration: 4 + (index * 0.5),
                      repeat: Infinity,
                      ease: 'linear',
                    },
                    scale: {
                      duration: 3 + (index * 0.3),
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                >
                  <motion.div
                    className="organic-shape-inner"
                    animate={{
                      borderRadius: getBorderRadius(),
                      rotate: -rotation * 0.5,
                    }}
                    transition={{
                      duration: 4 + (index * 0.5),
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                </motion.div>
              </div>

              <div className="day-value">
                <div className="day-value-number">{formatValue(value, selectedMetric)}</div>
                <div className="day-value-label">{day.meetingCount} {day.meetingCount === 1 ? 'event' : 'events'}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="comparison-summary">
        <div className="summary-item">
          <span className="summary-label">Peak Day:</span>
          <span className="summary-value">
            {(() => {
              const peakDay = dailyMetrics.reduce((max, day) => 
                getMetricValue(day, selectedMetric) > getMetricValue(max, selectedMetric) ? day : max
              );
              const label = formatDayLabel(peakDay.date);
              return `${label.day} ${label.date} ${label.month} (${formatValue(getMetricValue(peakDay, selectedMetric), selectedMetric)})`;
            })()}
          </span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Average:</span>
          <span className="summary-value">
            {formatValue(
              dailyMetrics.reduce((sum, day) => sum + getMetricValue(day, selectedMetric), 0) / dailyMetrics.length,
              selectedMetric
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeeklyOrganicComparison;

