import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function AIRevenueForecastPage() {
  const [form, setForm] = useState({
    event_id: '', event_name: '', genre: '', historical: '', marketing: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/revenue-forecast', form);
      setData(res.data);
    } catch (err) {
      setData({ error: true, message: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>📈 AI Revenue Forecast</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Forecast Event Revenue</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Event ID</label><input value={form.event_id} onChange={set('event_id')} /></div>
            <div className="form-group"><label>Event Name</label><input value={form.event_name} onChange={set('event_name')} /></div>
            <div className="form-group"><label>Genre</label><input value={form.genre} onChange={set('genre')} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Historical Performance Notes</label>
              <textarea rows="3" value={form.historical} onChange={set('historical')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Marketing Plan</label>
              <textarea rows="3" value={form.marketing} onChange={set('marketing')} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Forecasting...' : '🤖 Generate Forecast'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
