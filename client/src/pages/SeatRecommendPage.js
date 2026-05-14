import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function SeatRecommendPage() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    event_id: '',
    party_size: 2,
    accessibility_needs: '',
    budget_max: '',
    view_preference: 'any'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get('/events?limit=200').then(res => {
      const body = res.data;
      setEvents(Array.isArray(body) ? body : body?.data || []);
    }).catch(() => {});
    // Load any history from localStorage
    const saved = localStorage.getItem('seatRecommendHistory');
    if (saved) try { setHistory(JSON.parse(saved)); } catch (_) {}
  }, []);

  const handleRecommend = async (e) => {
    e?.preventDefault();
    if (!form.event_id) {
      alert('Please select an event');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        event_id: parseInt(form.event_id),
        party_size: parseInt(form.party_size) || 2,
        accessibility_needs: form.accessibility_needs,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : undefined,
        view_preference: form.view_preference
      };
      const res = await api.post('/seat-assignments/recommend', payload);
      setResult(res.data);
      // Save to history
      const event = events.find(e => e.id === parseInt(form.event_id));
      const historyEntry = {
        timestamp: new Date().toISOString(),
        event_name: event?.name || `Event #${form.event_id}`,
        party_size: payload.party_size,
        budget_max: payload.budget_max,
        result: res.data?.parsed
      };
      const newHistory = [historyEntry, ...history.slice(0, 9)];
      setHistory(newHistory);
      localStorage.setItem('seatRecommendHistory', JSON.stringify(newHistory));
    } catch (e) {
      setResult({ error: true, message: e.response?.data?.error || e.message });
    }
    setLoading(false);
  };

  const r = result?.parsed;

  return (
    <div>
      <div className="page-header">
        <h1>💺 AI Seat Recommendation</h1>
      </div>

      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Find the Best Seats</h3>
        <form onSubmit={handleRecommend}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            <div className="form-group">
              <label>Event *</label>
              <select value={form.event_id} onChange={e => setForm({ ...form, event_id: e.target.value })} required>
                <option value="">Select an event...</option>
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.date).toLocaleDateString()})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Party Size *</label>
              <input type="number" min="1" max="20" value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Max Budget per Seat ($)</label>
              <input type="number" step="0.01" value={form.budget_max} onChange={e => setForm({ ...form, budget_max: e.target.value })} placeholder="Optional" />
            </div>
            <div className="form-group">
              <label>View Preference</label>
              <select value={form.view_preference} onChange={e => setForm({ ...form, view_preference: e.target.value })}>
                <option value="any">Any</option>
                <option value="center">Center / Best View</option>
                <option value="front">Close to Front</option>
                <option value="elevated">Elevated / Mezzanine</option>
                <option value="aisle">Aisle Access</option>
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Accessibility Needs</label>
              <input value={form.accessibility_needs} onChange={e => setForm({ ...form, accessibility_needs: e.target.value })} placeholder="e.g. wheelchair, hearing assistance, none" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? '⏳ Finding Seats...' : '🤖 Get AI Recommendations'}
            </button>
          </div>
        </form>
      </div>

      {/* Loading */}
      {loading && <AIResponse data={null} loading={true} />}

      {/* Error */}
      {result?.error && (
        <div className="error-message" style={{ marginTop: 16, padding: 16 }}>
          {result.message}
        </div>
      )}

      {/* Results */}
      {r && (
        <div className="ai-response" style={{ marginTop: 16 }}>
          <div className="ai-response-header">
            <div className="ai-icon">🎯</div>
            <div><div className="ai-label">AI Seat Recommendations</div></div>
            {r.total_cost !== undefined && (
              <span className="status-badge" style={{ background: '#16a34a', color: '#fff', marginLeft: 'auto' }}>
                Total: ${r.total_cost?.toLocaleString()}
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            {r.recommended_seats?.length > 0 && (
              <>
                <h4 style={{ color: '#4ade80', marginBottom: 8 }}>⭐ Top Recommendations</h4>
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {r.recommended_seats.map((s, i) => (
                    <div key={i} style={{ padding: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: '#f1f5f9' }}>
                          {s.section} · Row {s.row} · Seat {s.seat}
                          {s.accessibility && <span style={{ marginLeft: 6, color: '#60a5fa' }}>♿</span>}
                        </strong>
                        <span style={{ color: '#4ade80', fontWeight: 700 }}>${s.price}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{s.reason}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {r.alternative_options?.length > 0 && (
              <>
                <h4 style={{ color: '#fbbf24', marginBottom: 8 }}>🔄 Alternatives</h4>
                <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
                  {r.alternative_options.map((s, i) => (
                    <div key={i} style={{ padding: 12, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <strong style={{ color: '#f1f5f9' }}>{s.section} · Row {s.row} · Seat {s.seat}</strong>
                        <span style={{ color: '#fbbf24', fontWeight: 700 }}>${s.price}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: 13 }}>{s.reason}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {r.booking_tip && (
              <div style={{ padding: 12, background: 'rgba(99,102,241,0.1)', borderLeft: '3px solid #818cf8', borderRadius: 4 }}>
                <strong style={{ color: '#a5b4fc' }}>💡 Tip:</strong> <span style={{ color: '#cbd5e1' }}>{r.booking_tip}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Recent Recommendations</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr><th>When</th><th>Event</th><th>Party</th><th>Budget</th><th>Top Match</th></tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.timestamp).toLocaleString()}</td>
                    <td>{h.event_name}</td>
                    <td>{h.party_size}</td>
                    <td>{h.budget_max ? `$${h.budget_max}` : '—'}</td>
                    <td>{h.result?.recommended_seats?.[0] ? `${h.result.recommended_seats[0].section} · Row ${h.result.recommended_seats[0].row}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
