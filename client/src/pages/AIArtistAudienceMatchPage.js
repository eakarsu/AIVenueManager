import CompleteAIExamples, { AIRequiredButton } from "../components/CompleteAIExamples";
import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function AIArtistAudienceMatchPage() {
  const [form, setForm] = useState({
    artist: '', genre: '', audience_demographics: '', venue_profile: '', region: '',
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/artist-audience-match', form);
      setData(res.data);
    } catch (err) {
      setData({ error: true, message: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>🎤 AI Artist / Audience Match</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Score Fit & Drivers</h3>
        <CompleteAIExamples busy={loading} context="Venue planning review"><form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Artist</label><input data-ai-field="artist" value={form.artist} onChange={set('artist')} required /></div>
            <div className="form-group"><label>Genre</label><input data-ai-field="genre" value={form.genre} onChange={set('genre')} /></div>
            <div className="form-group"><label>Region</label><input data-ai-field="region" value={form.region} onChange={set('region')} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Audience Demographics</label>
              <textarea data-ai-field="audience_demographics" rows="3" value={form.audience_demographics} onChange={set('audience_demographics')} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Venue Profile</label>
              <textarea data-ai-field="venue_profile" rows="3" value={form.venue_profile} onChange={set('venue_profile')} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <AIRequiredButton data-ai-generate type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Scoring...' : '🤖 Compute Match'}
            </AIRequiredButton>
          </div>
        </form></CompleteAIExamples>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
