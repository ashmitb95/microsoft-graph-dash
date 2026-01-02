import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarMetadata } from '@/lib/api';
import './ExecutiveDashboard.css';

interface ExecutiveDashboardProps {
  metadata: CalendarMetadata | null;
  loading?: boolean;
}

const ExecutiveDashboard = ({ metadata, loading }: ExecutiveDashboardProps) => {
  const [selectedMetric, setSelectedMetric] = useState<'hours' | 'count' | 'duration' | 'gaps'>('hours');
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (metadata) {
      let value = 0;
      switch (selectedMetric) {
        case 'hours':
          value = metadata.totalMeetingHours;
          break;
        case 'count':
          value = metadata.totalEvents;
          break;
        case 'duration':
          value = metadata.averageDuration;
          break;
        case 'gaps':
          value = metadata.averageGap;
          break;
      }
      
      // Animate to new value
      const duration = 1000;
      const start = animatedValue;
      const end = value;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOutCubic;
        
        setAnimatedValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [metadata, selectedMetric]);

  if (loading) {
    return (
      <div className="executive-dashboard">
        <div className="dashboard-loading">Loading executive insights...</div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="executive-dashboard">
        <div className="dashboard-empty">No calendar data available</div>
      </div>
    );
  }

  const formatValue = (value: number, metric: string) => {
    switch (metric) {
      case 'hours':
        return `${value.toFixed(1)}h`;
      case 'count':
        return Math.round(value).toString();
      case 'duration':
        return `${Math.round(value)}m`;
      case 'gaps':
        return `${Math.round(value)}m`;
      default:
        return value.toFixed(1);
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'hours':
        return 'Meeting Hours';
      case 'count':
        return 'Total Meetings';
      case 'duration':
        return 'Avg Duration';
      case 'gaps':
        return 'Avg Gap Time';
      default:
        return '';
    }
  };

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'hours':
        return '#667eea';
      case 'count':
        return '#4caf50';
      case 'duration':
        return '#ff9800';
      case 'gaps':
        return '#9c27b0';
      default:
        return '#667eea';
    }
  };

  const getInsight = () => {
    if (selectedMetric === 'hours') {
      if (metadata.totalMeetingHours > 30) {
        return { type: 'warning', text: 'High meeting load - consider blocking focus time' };
      } else if (metadata.totalMeetingHours > 20) {
        return { type: 'info', text: 'Moderate meeting schedule' };
      } else {
        return { type: 'success', text: 'Well-balanced meeting schedule' };
      }
    } else if (selectedMetric === 'count') {
      const avgPerDay = metadata.totalEvents / 7;
      if (avgPerDay > 6) {
        return { type: 'warning', text: 'High meeting frequency - review necessity' };
      } else if (avgPerDay > 4) {
        return { type: 'info', text: 'Active meeting schedule' };
      } else {
        return { type: 'success', text: 'Reasonable meeting frequency' };
      }
    } else if (selectedMetric === 'gaps') {
      if (metadata.averageGap < 15) {
        return { type: 'warning', text: 'Limited buffer time between meetings' };
      } else if (metadata.averageGap < 30) {
        return { type: 'info', text: 'Moderate gap time available' };
      } else {
        return { type: 'success', text: 'Good focus time between meetings' };
      }
    }
    return { type: 'info', text: 'Review your calendar patterns' };
  };

  const insight = getInsight();
  const color = getMetricColor(selectedMetric);

  return (
    <div className="executive-dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">Executive Insights</h2>
        <div className="metric-selector-group">
          {(['hours', 'count', 'duration', 'gaps'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`metric-btn ${selectedMetric === metric ? 'active' : ''}`}
              style={selectedMetric === metric ? { borderColor: color } : {}}
            >
              {getMetricLabel(metric)}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-visualization">
        <motion.div
          className="metric-display"
          style={{ '--metric-color': color } as React.CSSProperties}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="metric-value">
            {formatValue(animatedValue, selectedMetric)}
          </div>
          <div className="metric-label">{getMetricLabel(selectedMetric)}</div>
        </motion.div>

        <motion.div
          className="insight-card"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className={`insight-badge ${insight.type}`}>
            {insight.type === 'warning' && '⚠️'}
            {insight.type === 'info' && 'ℹ️'}
            {insight.type === 'success' && '✓'}
          </div>
          <div className="insight-text">{insight.text}</div>
        </motion.div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="stat-item">
          <div className="stat-value">{metadata.totalEvents}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{metadata.totalMeetingHours.toFixed(1)}h</div>
          <div className="stat-label">Meeting Hours</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{Math.round(metadata.averageDuration)}m</div>
          <div className="stat-label">Avg Duration</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{Math.round(metadata.averageGap)}m</div>
          <div className="stat-label">Avg Gap</div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;

