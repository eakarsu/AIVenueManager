import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyEvent = { name: '', type: 'Concert', date: '', venue: '', capacity: '', status: 'upcoming', description: '', expectedAttendance: '', genre: '' };

export default function EventsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyEvent);
  const [editing, setEditing] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [seatMap, setSeatMap] = useState(null);
  const [seatMapLoading, setSeatMapLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async (pg = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/events?page=${pg}&limit=20`);
      const body = res.data;
      if (body && body.data && body.pagination) {
        setItems(body.data);
        setTotalPages(body.pagination.totalPages || 1);
      } else if (Array.isArray(body)) {
        setItems(body);
        setTotalPages(1);
      } else {
        setItems(body?.data || []);
      }
    } catch (e) {
      setError('Failed to load events');
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const handleSave = async () => {
    try {
      if (editing) {
        await api.put(`/events/${form.id}`, form);
      } else {
        await api.post('/events', form);
      }
      setShowModal(false);
      setForm(emptyEvent);
      setEditing(false);
      load(page);
    } catch (e) {
      alert('Save failed: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      await api.delete(`/events/${id}`);
      setSelected(null);
      load(page);
    }
  };

  const openEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowModal(true);
  };

  const openCreate = () => {
    setForm(emptyEvent);
    setEditing(false);
    setShowModal(true);
  };

  const runForecast = async () => {
    if (!selected?.id) return;
    setForecastLoading(true);
    setForecast(null);
    try {
      const res = await api.post(`/events/${selected.id}/ai-forecast`);
      setForecast(res.data);
    } catch (e) {
      setForecast({ error: true, message: e.response?.data?.error || e.message });
    }
    setForecastLoading(false);
  };

  const loadSeatMap = async () => {
    if (!selected?.id) return;
    setSeatMapLoading(true);
    try {
      const res = await api.get(`/events/${selected.id}/seat-map`);
      setSeatMap(res.data);
    } catch (e) {
      setSeatMap({ error: 'Failed to load seat map' });
    }
    setSeatMapLoading(false);
  };

  if (selected) {
    const f = forecast?.parsed;
    return (
      <div>
        <div className="page-header">
          <h1>Event Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setForecast(null); setSeatMap(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runForecast} disabled={forecastLoading}>{forecastLoading ? '⏳ Forecasting...' : '🔮 AI Forecast'}</button>
            <button className="btn btn-ai" onClick={loadSeatMap} disabled={seatMapLoading}>{seatMapLoading ? '⏳ Loading...' : '💺 Seat Map'}</button>
            <button className="btn btn-edit" onClick={() => { openEdit(selected); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header">
            <h2>{selected.name}</h2>
            <span className={`status-badge status-${selected.status}`}>{selected.status}</span>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Type</label><div className="value">{selected.type}</div></div>
            <div className="detail-field"><label>Date</label><div className="value">{new Date(selected.date).toLocaleDateString()}</div></div>
            <div className="detail-field"><label>Venue</label><div className="value">{selected.venue}</div></div>
            <div className="detail-field"><label>Capacity</label><div className="value">{selected.capacity?.toLocaleString()}</div></div>
            <div className="detail-field"><label>Expected Attendance</label><div className="value">{selected.expectedAttendance?.toLocaleString()}</div></div>
            <div className="detail-field"><label>Genre</label><div className="value">{selected.genre}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Description</label><div className="value">{selected.description}</div></div>
          </div>
        </div>

        {/* AI Forecast Display */}
        {forecast && !forecast.error && f && (
          <div className="ai-response" style={{ marginTop: 16 }}>
            <div className="ai-response-header">
              <div className="ai-icon">🔮</div>
              <div><div className="ai-label">AI Event Forecast</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, padding: 16 }}>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <div className="stat-label">Attendance Forecast</div>
                <div className="stat-value" style={{ color: '#60a5fa', fontSize: 22 }}>{f.attendance_forecast?.toLocaleString()}</div>
              </div>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <div className="stat-label">Revenue Forecast</div>
                <div className="stat-value" style={{ color: '#4ade80', fontSize: 22 }}>${f.revenue_forecast?.toLocaleString()}</div>
              </div>
              <div className="stat-card" style={{ textAlign: 'center' }}>
                <div className="stat-label">Sellout Probability</div>
                <div className="stat-value" style={{ color: f.sellout_probability >= 0.7 ? '#4ade80' : f.sellout_probability >= 0.4 ? '#fbbf24' : '#f87171', fontSize: 22 }}>
                  {Math.round((f.sellout_probability || 0) * 100)}%
                </div>
              </div>
            </div>
            {f.risk_factors?.length > 0 && (
              <div style={{ padding: '8px 16px' }}>
                <strong style={{ color: '#f87171' }}>⚠️ Risk Factors:</strong>
                <ul>{f.risk_factors.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {f.opportunities?.length > 0 && (
              <div style={{ padding: '8px 16px' }}>
                <strong style={{ color: '#4ade80' }}>✨ Opportunities:</strong>
                <ul>{f.opportunities.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
            {f.recommended_actions?.length > 0 && (
              <div style={{ padding: '8px 16px' }}>
                <strong>📋 Recommended Actions:</strong>
                <ul>{f.recommended_actions.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        {forecastLoading && <AIResponse data={null} loading={true} />}
        {forecast?.error && <div className="error-message" style={{ padding: 16, marginTop: 16 }}>AI Forecast Error: {forecast.message}</div>}

        {/* Seat Map Display */}
        {seatMap && !seatMap.error && (
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(15,23,42,0.4)', borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: '#f1f5f9', margin: 0 }}>💺 Event Seat Map</h3>
              <div style={{ color: '#94a3b8', fontSize: 13 }}>
                {seatMap.available} available / {seatMap.total_seats} total
              </div>
            </div>
            {seatMap.sections?.length === 0 && <div style={{ color: '#64748b' }}>No seats configured for this event.</div>}
            {seatMap.sections?.map((section) => (
              <div key={section.section} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
                  {section.section} <span style={{ fontWeight: 400, color: '#64748b' }}>({section.rows.reduce((s, r) => s + r.available, 0)} available)</span>
                </div>
                {section.rows.map((row) => (
                  <div key={row.row} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 60, fontSize: 12, color: '#94a3b8' }}>Row {row.row}</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {row.seats.map((s) => (
                        <div key={s.id} title={`Seat ${s.seatNumber} - ${s.status} - $${s.price || 'N/A'}`}
                          style={{
                            width: 28, height: 28, borderRadius: 4, fontSize: 10, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                            background: s.status === 'available' ? '#16a34a' : s.status === 'sold' ? '#dc2626' : s.status === 'reserved' ? '#d97706' : '#475569'
                          }}>
                          {s.seatNumber}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#16a34a', marginRight: 4, verticalAlign: 'middle' }} /> Available</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#d97706', marginRight: 4, verticalAlign: 'middle' }} /> Reserved</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#dc2626', marginRight: 4, verticalAlign: 'middle' }} /> Sold</span>
              <span><span style={{ display: 'inline-block', width: 12, height: 12, background: '#475569', marginRight: 4, verticalAlign: 'middle' }} /> Blocked</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Events</h1>
        <div className="header-actions">
          <button className="btn btn-add" onClick={openCreate}>+ New Event</button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <div className="ai-loading"><div className="spinner"></div>Loading events...</div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Date</th><th>Venue</th><th>Capacity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>{item.venue}</td>
                    <td>{item.capacity?.toLocaleString()}</td>
                    <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>« Prev</button>
              <span style={{ color: '#cbd5e1', alignSelf: 'center' }}>Page {page} / {totalPages}</span>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next »</button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit Event' : 'New Event'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label>Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option>Concert</option><option>Festival</option><option>Awards</option><option>Corporate</option><option>Gala</option><option>Private Event</option><option>Dance</option><option>Brunch</option><option>Hybrid</option>
            </select>
          </div>
          <div className="form-group"><label>Date</label><input type="date" value={form.date?.split('T')[0] || ''} onChange={e => setForm({...form, date: e.target.value})} /></div>
          <div className="form-group"><label>Venue</label><input value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} /></div>
          <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
          <div className="form-group"><label>Expected Attendance</label><input type="number" value={form.expectedAttendance} onChange={e => setForm({...form, expectedAttendance: e.target.value})} /></div>
          <div className="form-group"><label>Genre</label><input value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="upcoming">Upcoming</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group"><label>Description</label><textarea rows="3" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
