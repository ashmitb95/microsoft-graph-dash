import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import './TimeSeriesChart.css';

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

interface TimeSeriesData {
  metrics: DailyMetric[];
  summary: {
    totalDays: number;
    averageMeetingsPerDay: number;
    averageHoursPerDay: number;
    peakDay: { date: string; count: number };
    quietestDay: { date: string; count: number };
  };
}

interface TimeSeriesChartProps {
  startDate: string;
  endDate: string;
  metric: 'meetingCount' | 'meetingHours' | 'averageDuration' | 'averageGap';
}

const TimeSeriesChart = ({ startDate, endDate, metric }: TimeSeriesChartProps) => {
  const [data, setData] = useState<TimeSeriesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    loadTimeSeriesData();
  }, [startDate, endDate]);

  const loadTimeSeriesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/calendar/timeseries?startDate=${startDate}&endDate=${endDate}`,
        { credentials: 'include' }
      );
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let result;
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        setError(`Invalid response format: ${text.substring(0, 100)}`);
        setLoading(false);
        return;
      }

      try {
        const text = await response.text();
        result = JSON.parse(text);
      } catch (parseError) {
        setError('Failed to parse JSON response from server');
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        if (result.timeSeries) {
          setData(result.timeSeries);
        } else {
          setError('Invalid response structure: missing timeSeries data');
        }
      } else {
        setError(result.error || result.details || 'Failed to load time series data');
      }
    } catch (err: any) {
      console.error('Time series fetch error:', err);
      if (err instanceof SyntaxError) {
        setError('Invalid JSON response from server');
      } else {
        setError(err.message || 'Failed to load time series data');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!data || !svgRef.current) return;

    const metrics = data.metrics;
    if (metrics.length === 0) return;

    const svg = svgRef.current;
    const width = svg.clientWidth || 800;
    const height = 300;
    const padding = { top: 20, right: 40, bottom: 40, left: 60 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get values for selected metric
    const values = metrics.map((m) => {
      switch (metric) {
        case 'meetingCount':
          return m.meetingCount;
        case 'meetingHours':
          return m.meetingHours;
        case 'averageDuration':
          return m.averageDuration;
        case 'averageGap':
          return m.averageGap;
        default:
          return 0;
      }
    });

    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values);

    // Clear previous content
    svg.innerHTML = '';

    // Create scales
    const xScale = (index: number) =>
      padding.left + (index / (metrics.length - 1 || 1)) * chartWidth;
    const yScale = (value: number) => {
      const range = maxValue - minValue || 1;
      return padding.top + chartHeight - ((value - minValue) / range) * chartHeight;
    };

    // Draw axes
    const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Y-axis line
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', padding.left.toString());
    yAxis.setAttribute('y1', padding.top.toString());
    yAxis.setAttribute('x2', padding.left.toString());
    yAxis.setAttribute('y2', (height - padding.bottom).toString());
    yAxis.setAttribute('stroke', '#bfc0c0');
    yAxis.setAttribute('stroke-width', '1');
    axisGroup.appendChild(yAxis);

    // X-axis line
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', padding.left.toString());
    xAxis.setAttribute('y1', (height - padding.bottom).toString());
    xAxis.setAttribute('x2', (width - padding.right).toString());
    xAxis.setAttribute('y2', (height - padding.bottom).toString());
    xAxis.setAttribute('stroke', '#bfc0c0');
    xAxis.setAttribute('stroke-width', '1');
    axisGroup.appendChild(xAxis);

    // Y-axis labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const value = minValue + ((maxValue - minValue) * i) / ySteps;
      const y = padding.top + chartHeight - (i / ySteps) * chartHeight;

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', (padding.left - 10).toString());
      label.setAttribute('y', (y + 4).toString());
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', '#4f5d75');
      label.textContent = value.toFixed(1);
      axisGroup.appendChild(label);
    }

    // X-axis labels (show every few dates)
    const labelInterval = Math.max(1, Math.floor(metrics.length / 8));
    metrics.forEach((metric, index) => {
      if (index % labelInterval === 0 || index === metrics.length - 1) {
        const x = xScale(index);
        const date = new Date(metric.date);
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x.toString());
        label.setAttribute('y', (height - padding.bottom + 20).toString());
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', '#4f5d75');
        label.textContent = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        axisGroup.appendChild(label);
      }
    });

    svg.appendChild(axisGroup);

    // Draw line
    const pathData = metrics
      .map((m, index) => {
        const value = values[index];
        const x = xScale(index);
        const y = yScale(value);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#ef8354');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);

    // Draw points
    metrics.forEach((m, index) => {
      const value = values[index];
      const x = xScale(index);
      const y = yScale(value);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', x.toString());
      circle.setAttribute('cy', y.toString());
      circle.setAttribute('r', '3');
      circle.setAttribute('fill', '#ef8354');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '1.5');
      svg.appendChild(circle);
    });
  };

  useEffect(() => {
    if (data) {
      // Small delay to ensure SVG is rendered
      setTimeout(renderChart, 100);
    }
  }, [data, metric]);

  if (loading) {
    return (
      <div className="time-series-chart">
        <div className="chart-loading">Loading chart data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="time-series-chart">
        <div className="chart-error">Error: {error}</div>
      </div>
    );
  }

  if (!data || data.metrics.length === 0) {
    return (
      <div className="time-series-chart">
        <div className="chart-empty">No data available for the selected date range</div>
      </div>
    );
  }

  const metricLabels = {
    meetingCount: 'Meeting Count',
    meetingHours: 'Meeting Hours',
    averageDuration: 'Avg Duration (min)',
    averageGap: 'Avg Gap (min)',
  };

  return (
    <div className="time-series-chart">
      <div className="chart-header">
        <h3 className="chart-title">{metricLabels[metric]} Over Time</h3>
        <div className="chart-summary">
          <span>Peak: {data.summary.peakDay.count} meetings on {new Date(data.summary.peakDay.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div className="chart-container">
        <svg ref={svgRef} width="100%" height="300" className="chart-svg"></svg>
      </div>
    </div>
  );
};

export default TimeSeriesChart;

