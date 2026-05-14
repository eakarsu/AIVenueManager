import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function AIDynamicPricingPage() {
  const [form, setForm] = useState({
    event_id: '',
    event_name: '',
    base_price: 50,
    capacity: 1000,
    sold_pct: 30,
    days_until_event: 14,
    notes: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/dynamic-pricing', {
        ...form,
        base_price: parseFloat(form.base_price),
        capacity: parseInt(form.capacity),
        sold_pct: parseFloat(form.sold_pct),
        days_until_event: parseInt(form.days_until_event),
      });
      setData(res.data);
    } catch (err) {
      setData({ error: true, message: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-header">
        <h1>💰 AI Dynamic Pricing</h1>
      </div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Generate Pricing Recommendation</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Event ID</label><input value={form.event_id} onChange={set('event_id')} /></div>
            <div className="form-group"><label>Event Name</label><input value={form.event_name} onChange={set('event_name')} /></div>
            <div className="form-group"><label>Base Price ($)</label><input type="number" step="0.01" value={form.base_price} onChange={set('base_price')} /></div>
            <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={set('capacity')} /></div>
            <div className="form-group"><label>Sold %</label><input type="number" step="0.1" value={form.sold_pct} onChange={set('sold_pct')} /></div>
            <div className="form-group"><label>Days Until Event</label><input type="number" value={form.days_until_event} onChange={set('days_until_event')} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Notes / Context</label>
              <textarea rows="3" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Computing...' : '🤖 Recommend Prices'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}>
        <AIResponse data={data} loading={loading} />
      </div>
    </div>
  );
}
