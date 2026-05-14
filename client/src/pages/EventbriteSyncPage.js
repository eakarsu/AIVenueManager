import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function EventbriteSyncPage() {
  const [eventId, setEventId] = useState('');
  const [direction, setDirection] = useState('push');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/eventbrite-sync', { eventId: eventId || null, direction });
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      const missing = err.response?.data?.missing ? ` (missing: ${err.response.data.missing})` : '';
      setData({ error: true, message: status === 503 ? `${msg}${missing}` : msg });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>Eventbrite Sync</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Push/pull events to Eventbrite (requires EVENTBRITE_API_TOKEN)</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Event ID</label><input value={eventId} onChange={e => setEventId(e.target.value)} placeholder="local event id (optional)" /></div>
            <div className="form-group">
              <label>Direction</label>
              <select value={direction} onChange={e => setDirection(e.target.value)}>
                <option value="push">Push to Eventbrite</option>
                <option value="pull">Pull from Eventbrite</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Syncing...' : 'Run Sync'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
