import { useState } from 'react';
import { api } from '@/lib/api';
import './TestEventGenerator.css';

const TestEventGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    eventsPerDay: 3,
    minDuration: 30,
    maxDuration: 60,
    realistic: false,
  });

  const handlePreview = async () => {
    setPreviewLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/test-events/preview?${new URLSearchParams({
          startDate: config.startDate,
          endDate: config.endDate,
          eventsPerDay: config.eventsPerDay.toString(),
          minDuration: config.minDuration.toString(),
          maxDuration: config.maxDuration.toString(),
          realistic: config.realistic.toString(),
        })}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      if (response.ok) {
        setPreview(data);
      } else {
        setError(data.error || 'Failed to preview events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to preview events');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/test-events/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || data.details || 'Failed to generate events');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate events');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-event-generator">
      <h2 className="generator-title">Generate Test Calendar Events</h2>
      <p className="generator-description">
        Create bulk test events in your calendar for testing the dashboard features.
        <strong> Note:</strong> You need to grant <code>Calendars.ReadWrite</code> permission in Azure AD.
      </p>

      {error && (
        <div className="error-banner">
          {error}
          {error.includes('permission') && (
            <div className="permission-help">
              <p>To fix this:</p>
              <ol>
                <li>Go to Azure Portal → Your App Registration</li>
                <li>API permissions → Add permission → Microsoft Graph</li>
                <li>Select "Calendars.ReadWrite" (Delegated)</li>
                <li>Click "Grant admin consent"</li>
                <li>Log out and log back in to refresh your token</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {result && (
        <div className={`result-banner ${result.failed > 0 ? 'warning' : 'success'}`}>
          <strong>{result.message}</strong>
          <div className="result-details">
            <span>Created: {result.created}</span>
            {result.failed > 0 && <span>Failed: {result.failed}</span>}
          </div>
          {result.errors && result.errors.length > 0 && (
            <details className="error-details">
              <summary>Errors</summary>
              <ul>
                {result.errors.map((err: any, i: number) => (
                  <li key={i}>{err.event}: {err.error}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      <div className="generator-form">
        <div className="form-row">
          <label>
            Start Date:
            <input
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              min={config.startDate}
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Events Per Day:
            <input
              type="number"
              min="1"
              max="10"
              value={config.eventsPerDay}
              onChange={(e) => setConfig({ ...config, eventsPerDay: parseInt(e.target.value) || 3 })}
            />
          </label>
          <label>
            Min Duration (minutes):
            <input
              type="number"
              min="15"
              max="120"
              value={config.minDuration}
              onChange={(e) => setConfig({ ...config, minDuration: parseInt(e.target.value) || 30 })}
            />
          </label>
          <label>
            Max Duration (minutes):
            <input
              type="number"
              min="15"
              max="120"
              value={config.maxDuration}
              onChange={(e) => setConfig({ ...config, maxDuration: parseInt(e.target.value) || 60 })}
            />
          </label>
        </div>

        <div className="form-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.realistic}
              onChange={(e) => setConfig({ ...config, realistic: e.target.checked })}
            />
            Generate realistic week (skips weekends, varies meeting counts)
          </label>
        </div>

        <div className="form-actions">
          <button
            onClick={handlePreview}
            disabled={previewLoading}
            className="preview-button"
          >
            {previewLoading ? 'Loading...' : 'Preview Events'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="generate-button"
          >
            {loading ? 'Creating Events...' : 'Generate Events'}
          </button>
        </div>
      </div>

      {preview && (
        <div className="preview-section">
          <h3>Preview: {preview.count} events will be created</h3>
          <div className="preview-events">
            {preview.events.map((event: any, index: number) => (
              <div key={index} className="preview-event">
                <strong>{event.subject}</strong>
                <div className="preview-time">
                  {new Date(event.start.dateTime).toLocaleString()} -{' '}
                  {new Date(event.end.dateTime).toLocaleString()}
                </div>
              </div>
            ))}
            {preview.total > 10 && (
              <div className="preview-more">... and {preview.total - 10} more events</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEventGenerator;

