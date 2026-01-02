import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CalendarMetadata } from '@/lib/api';
import './OrganicCalendarVisualization.css';

interface OrganicCalendarVisualizationProps {
  metadata: CalendarMetadata | null;
  loading?: boolean;
}

type MetricType = 'meetingHours' | 'meetingCount' | 'averageDuration' | 'averageGap' | 'totalDuration';

const OrganicCalendarVisualization = ({ metadata, loading }: OrganicCalendarVisualizationProps) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('meetingHours');
  const [animatedValue, setAnimatedValue] = useState(0);
  const [morphValue, setMorphValue] = useState(0);

  useEffect(() => {
    if (metadata) {
      let value = 0;
      switch (selectedMetric) {
        case 'meetingHours':
          value = metadata.totalMeetingHours;
          break;
        case 'meetingCount':
          value = metadata.totalEvents;
          break;
        case 'averageDuration':
          value = metadata.averageDuration;
          break;
        case 'averageGap':
          value = metadata.averageGap;
          break;
        case 'totalDuration':
          value = metadata.totalDuration / 60; // Convert to hours
          break;
      }

      // Animate value change
      const duration = 1500;
      const start = animatedValue;
      const end = value;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Smooth easing
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOutCubic;
        
        setAnimatedValue(current);
        setMorphValue(current % 100); // For shape morphing
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [metadata, selectedMetric]);

  if (loading) {
    return (
      <div className="organic-calendar-viz">
        <div className="viz-loading">Loading calendar data...</div>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="organic-calendar-viz">
        <div className="viz-empty">No calendar data available</div>
      </div>
    );
  }

  // Normalize value for visualization (0-100 scale)
  const normalizedValue = Math.min(100, Math.max(0, (animatedValue / 50) * 100)); // Scale based on typical ranges
  const size = 200 + (normalizedValue * 4); // Base 200px, scales with value
  const rotation = normalizedValue * 3.6; // 360 degrees max

  // Generate dynamic border radius for organic blob effect
  const getBorderRadius = () => {
    const base = 30;
    const variation = morphValue;
    return `${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}% ${base + variation * 0.4}% / ${base + variation * 0.4}% ${base + variation * 0.3}% ${base + variation * 0.5}% ${base + variation * 0.2}%`;
  };

  // Color based on metric value
  const getColor = () => {
    const hue = (normalizedValue * 2.4) % 360;
    return `hsl(${hue}, 70%, 60%)`;
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

  const metrics: { value: MetricType; label: string }[] = [
    { value: 'meetingHours', label: 'Meeting Hours' },
    { value: 'meetingCount', label: 'Meeting Count' },
    { value: 'averageDuration', label: 'Avg Duration' },
    { value: 'averageGap', label: 'Avg Gap' },
    { value: 'totalDuration', label: 'Total Duration' },
  ];

  return (
    <div className="organic-calendar-viz">
      <div className="viz-header">
        <h2 className="viz-title">Calendar Data Visualization</h2>
        <p className="viz-subtitle">Select a metric to visualize as an organic shape</p>
      </div>

      <div className="viz-controls">
        {metrics.map((metric) => (
          <button
            key={metric.value}
            onClick={() => setSelectedMetric(metric.value)}
            className={`metric-btn ${selectedMetric === metric.value ? 'active' : ''}`}
          >
            {metric.label}
          </button>
        ))}
      </div>

      <div className="viz-display">
        <motion.div
          className="organic-shape-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.div
            className="organic-shape"
            style={{
              width: size,
              height: size,
              borderRadius: getBorderRadius(),
              background: `linear-gradient(135deg, ${getColor()}, ${getColor()}dd)`,
            }}
            animate={{
              rotate: rotation,
              scale: [1, 1.05, 1],
            }}
            transition={{
              rotate: {
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 3,
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
                duration: 4,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </motion.div>

          <motion.div
            className="viz-value"
            key={selectedMetric}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="viz-value-number">{formatValue(animatedValue, selectedMetric)}</div>
            <div className="viz-value-label">{getMetricLabel(selectedMetric)}</div>
          </motion.div>
        </motion.div>
      </div>

      <div className="viz-info">
        <div className="info-item">
          <span className="info-label">Date Range:</span>
          <span className="info-value">
            {new Date(metadata.dateRange.start).toLocaleDateString()} - {new Date(metadata.dateRange.end).toLocaleDateString()}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Total Events:</span>
          <span className="info-value">{metadata.totalEvents}</span>
        </div>
      </div>
    </div>
  );
};

export default OrganicCalendarVisualization;

