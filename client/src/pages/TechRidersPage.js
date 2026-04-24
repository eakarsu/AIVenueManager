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

  const load = async () => {
    const [res, perfs, evts] = await Promise.all([api.get('/tech-riders'), api.get('/performers'), api.get('/events')]);
    setItems(res.data); setPerformers(perfs.data); setEvents(evts.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/tech-riders/${form.id}`, form);
    else await api.post('/tech-riders', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/tech-riders/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const res = await api.post('/tech-riders/ai/analyze', {
      performerName: selected.Performer?.name || 'Performer',
      soundRequirements: selected.soundRequirements, lightingRequirements: selected.lightingRequirements,
      stageRequirements: selected.stageRequirements, backlineEquipment: selected.backlineEquipment,
      venueCapacity: selected.Event?.capacity || 1000
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Tech Rider Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Analyze</button>
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
