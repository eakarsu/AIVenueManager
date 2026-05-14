import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function AISchedulingOptimizerPage() {
  const [eventsText, setEventsText] = useState('');
  const [marketText, setMarketText] = useState('');
  const [windowDays, setWindowDays] = useState(14);
  const [capacity, setCapacity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const parseList = (text) => {
    if (!text.trim()) return [];
    try { return JSON.parse(text); } catch { return text.split('\n').filter(Boolean).map(line => ({ description: line.trim() })); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/scheduling-optimizer', {
        events: parseList(eventsText),
        marketEvents: parseList(marketText),
        windowDays: parseInt(windowDays, 10) || 14,
        venueCapacity: capacity ? parseInt(capacity, 10) : null,
      });
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      setData({ error: true, message: status === 503 ? `${msg} (configure OPENROUTER_API_KEY)` : msg });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>AI Scheduling Optimizer</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Cannibalization & lineup analysis</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Cannibalization window (days)</label><input type="number" value={windowDays} onChange={e => setWindowDays(e.target.value)} /></div>
            <div className="form-group"><label>Venue capacity</label><input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Proposed events (JSON array or one per line)</label>
              <textarea rows="4" value={eventsText} onChange={e => setEventsText(e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Competing market events (JSON array or one per line)</label>
              <textarea rows="3" value={marketText} onChange={e => setMarketText(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Analyzing...' : 'Run Scheduling Optimizer'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
