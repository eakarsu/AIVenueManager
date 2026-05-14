import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function AIMarketingCampaignPage() {
  const [form, setForm] = useState({
    event_id: '',
    event_name: '',
    genre: '',
    audience: '',
    budget: 5000,
    days_until_event: 30,
    channels: 'social,email,radio,influencer',
    past: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const channelList = form.channels.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/ai/marketing-campaign-recommender', {
        event: { id: form.event_id, name: form.event_name, genre: form.genre },
        audienceProfile: { description: form.audience },
        budget: parseFloat(form.budget) || 0,
        channels: channelList,
        pastCampaigns: form.past ? [{ notes: form.past }] : [],
        daysUntilEvent: parseInt(form.days_until_event) || 0,
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
      <div className="page-header"><h1>📣 AI Marketing Campaign Recommender</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Plan a Campaign</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Event ID</label><input value={form.event_id} onChange={set('event_id')} /></div>
            <div className="form-group"><label>Event Name</label><input value={form.event_name} onChange={set('event_name')} /></div>
            <div className="form-group"><label>Genre</label><input value={form.genre} onChange={set('genre')} /></div>
            <div className="form-group"><label>Days Until Event</label><input type="number" value={form.days_until_event} onChange={set('days_until_event')} /></div>
            <div className="form-group"><label>Total Budget ($)</label><input type="number" step="0.01" value={form.budget} onChange={set('budget')} /></div>
            <div className="form-group"><label>Channels (comma-separated)</label><input value={form.channels} onChange={set('channels')} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Audience Profile</label>
              <textarea rows="3" value={form.audience} onChange={set('audience')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Past Campaigns / Performance Notes</label>
              <textarea rows="3" value={form.past} onChange={set('past')} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Planning...' : '🤖 Recommend Campaign'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
