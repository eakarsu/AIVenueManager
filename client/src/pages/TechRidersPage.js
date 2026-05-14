import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { performerId: '', eventId: '', soundRequirements: '', lightingRequirements: '', stageRequirements: '', backlineEquipment: '', monitorMix: '', specialRequests: '', hospitalityRequirements: '', loadInTime: '', soundCheckTime: '', status: 'draft' };

export default function TechRidersPage() {
  const [items, setItems] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [feasibility, setFeasibility] = useState(null);
  const [feasibilityLoading, setFeasibilityLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (pg = 1) => {
    try {
      const [res, perfs, evts] = await Promise.all([
        api.get(`/tech-riders?page=${pg}&limit=20`),
        api.get('/performers?limit=200'),
        api.get('/events?limit=200')
      ]);
      const body = res.data;
      if (body && body.data && body.pagination) {
        setItems(body.data); setTotalPages(body.pagination.totalPages || 1);
      } else if (Array.isArray(body)) {
        setItems(body); setTotalPages(1);
      } else { setItems(body?.data || []); }
      setPerformers(Array.isArray(perfs.data) ? perfs.data : perfs.data?.data || []);
      setEvents(Array.isArray(evts.data) ? evts.data : evts.data?.data || []);
    } catch (e) { /* ignore */ }
  };
  useEffect(() => { load(page); }, [page]);

  const handleSave = async () => {
    if (editing) await api.put(`/tech-riders/${form.id}`, form);
    else await api.post('/tech-riders', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load(page);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/tech-riders/${id}`); setSelected(null); load(page); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    try {
      const res = await api.post('/tech-riders/ai/analyze', {
        performerName: selected.Performer?.name || 'Performer',
        soundRequirements: selected.soundRequirements, lightingRequirements: selected.lightingRequirements,
        stageRequirements: selected.stageRequirements, backlineEquipment: selected.backlineEquipment,
        venueCapacity: selected.Event?.capacity || 1000
      });
      setAiData(res.data);
    } catch (e) { setAiData({ error: true, message: e.response?.data?.error || e.message }); }
    setAiLoading(false);
  };

  const runFeasibility = async () => {
    if (!selected?.id) return;
    setFeasibilityLoading(true); setFeasibility(null);
    try {
      const res = await api.post(`/tech-riders/${selected.id}/feasibility-check`);
      setFeasibility(res.data);
    } catch (e) {
      setFeasibility({ error: true, message: e.response?.data?.error || e.message });
    }
    setFeasibilityLoading(false);
  };

  const exportFeasibilityCsv = () => {
    if (!feasibility?.parsed?.missing_items?.length) return;
    const items = feasibility.parsed.missing_items;
    const headers = ['item', 'rental_cost', 'availability'];
    const rows = [headers.join(',')].concat(items.map(i => `"${i.item}",${i.rental_cost},${i.availability}`));
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feasibility-${selected.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selected) {
    const fc = feasibility?.parsed;
    return (
      <div>
        <div className="page-header">
          <h1>Tech Rider Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); setFeasibility(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI} disabled={aiLoading}>🤖 AI Analyze</button>
            <button className="btn btn-ai" onClick={runFeasibility} disabled={feasibilityLoading}>{feasibilityLoading ? '⏳' : '✅'} Feasibility Check</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.Performer?.name} — Tech Rider</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Performer</label><div className="value">{selected.Performer?.name}</div></div>
            <div className="detail-field"><label>Event</label><div className="value">{selected.Event?.name || 'General'}</div></div>
            <div className="detail-field"><label>Load-in Time</label><div className="value">{selected.loadInTime}</div></div>
            <div className="detail-field"><label>Sound Check</label><div className="value">{selected.soundCheckTime}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Sound Requirements</label><div className="value">{selected.soundRequirements}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Lighting Requirements</label><div className="value">{selected.lightingRequirements}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Stage Requirements</label><div className="value">{selected.stageRequirements}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Backline Equipment</label><div className="value">{selected.backlineEquipment}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Monitor Mix</label><div className="value">{selected.monitorMix}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Special Requests</label><div className="value">{selected.specialRequests}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Hospitality</label><div className="value">{selected.hospitalityRequirements}</div></div>
          </div>
        </div>

        {/* Feasibility Check */}
        {feasibilityLoading && <AIResponse data={null} loading={true} />}
        {feasibility && !feasibility.error && fc && (
          <div className="ai-response" style={{ marginTop: 16 }}>
            <div className="ai-response-header">
              <div className="ai-icon">{fc.feasible ? '✅' : '⚠️'}</div>
              <div><div className="ai-label">Feasibility Check</div></div>
              <span className={`status-badge`} style={{ background: fc.risk_level === 'high' ? '#dc2626' : fc.risk_level === 'medium' ? '#d97706' : '#16a34a', color: '#fff' }}>
                {(fc.risk_level || 'unknown').toUpperCase()} RISK
              </span>
              {fc.missing_items?.length > 0 && (
                <button className="btn btn-secondary" style={{ marginLeft: 'auto' }} onClick={exportFeasibilityCsv}>📄 Export CSV</button>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">Procurement Cost</div>
                  <div className="stat-value" style={{ color: '#fbbf24', fontSize: 22 }}>${fc.total_procurement_cost?.toLocaleString() || '0'}</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">Setup Hours</div>
                  <div className="stat-value" style={{ color: '#60a5fa', fontSize: 22 }}>{fc.setup_hours || '?'}</div>
                </div>
                <div className="stat-card" style={{ textAlign: 'center' }}>
                  <div className="stat-label">Crew Needed</div>
                  <div className="stat-value" style={{ color: '#a855f7', fontSize: 16 }}>
                    🎵 {fc.crew_needed?.sound || 0} · 💡 {fc.crew_needed?.lighting || 0} · 🎬 {fc.crew_needed?.stage || 0}
                  </div>
                </div>
              </div>
              {fc.missing_items?.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <h4 style={{ color: '#f1f5f9', marginBottom: 8 }}>📋 Missing/Required Items</h4>
                  <table className="data-table">
                    <thead><tr><th>Item</th><th>Rental Cost</th><th>Availability</th></tr></thead>
                    <tbody>
                      {fc.missing_items.map((m, i) => (
                        <tr key={i}>
                          <td>{m.item}</td>
                          <td style={{ color: '#fbbf24' }}>${m.rental_cost?.toLocaleString() || '0'}</td>
                          <td><span className="status-badge" style={{ background: m.availability === 'in_stock' ? '#16a34a' : m.availability === 'rental' ? '#d97706' : '#dc2626' }}>{m.availability}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {fc.recommendations?.length > 0 && (
                <div>
                  <h4 style={{ color: '#f1f5f9', marginBottom: 8 }}>💡 Recommendations</h4>
                  <ul style={{ color: '#cbd5e1', paddingLeft: 16 }}>
                    {fc.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {feasibility?.error && <div className="error-message" style={{ padding: 16, marginTop: 16 }}>Feasibility Error: {feasibility.message}</div>}

        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tech Riders</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Tech Rider</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Performer</th><th>Event</th><th>Load-in</th><th>Sound Check</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.Performer?.name}</td>
                <td>{item.Event?.name || 'General'}</td>
                <td>{item.loadInTime}</td>
                <td>{item.soundCheckTime}</td>
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
      {showModal && (
        <Modal title={editing ? 'Edit Tech Rider' : 'New Tech Rider'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Performer</label>
            <select value={form.performerId} onChange={e => setForm({...form, performerId: parseInt(e.target.value)})}><option value="">Select</option>{performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Event</label>
            <select value={form.eventId || ''} onChange={e => setForm({...form, eventId: e.target.value ? parseInt(e.target.value) : null})}><option value="">General (no event)</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Sound Requirements</label><textarea rows="2" value={form.soundRequirements} onChange={e => setForm({...form, soundRequirements: e.target.value})} /></div>
          <div className="form-group"><label>Lighting Requirements</label><textarea rows="2" value={form.lightingRequirements} onChange={e => setForm({...form, lightingRequirements: e.target.value})} /></div>
          <div className="form-group"><label>Stage Requirements</label><textarea rows="2" value={form.stageRequirements} onChange={e => setForm({...form, stageRequirements: e.target.value})} /></div>
          <div className="form-group"><label>Backline Equipment</label><textarea rows="2" value={form.backlineEquipment} onChange={e => setForm({...form, backlineEquipment: e.target.value})} /></div>
          <div className="form-group"><label>Monitor Mix</label><input value={form.monitorMix} onChange={e => setForm({...form, monitorMix: e.target.value})} /></div>
          <div className="form-group"><label>Special Requests</label><textarea rows="2" value={form.specialRequests} onChange={e => setForm({...form, specialRequests: e.target.value})} /></div>
          <div className="form-group"><label>Hospitality Requirements</label><textarea rows="2" value={form.hospitalityRequirements} onChange={e => setForm({...form, hospitalityRequirements: e.target.value})} /></div>
          <div className="form-group"><label>Load-in Time</label><input type="time" value={form.loadInTime} onChange={e => setForm({...form, loadInTime: e.target.value})} /></div>
          <div className="form-group"><label>Sound Check Time</label><input type="time" value={form.soundCheckTime} onChange={e => setForm({...form, soundCheckTime: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="draft">Draft</option><option value="submitted">Submitted</option><option value="approved">Approved</option><option value="fulfilled">Fulfilled</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}
