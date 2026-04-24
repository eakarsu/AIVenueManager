import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { name: '', genre: '', email: '', phone: '', agent: '', agentEmail: '', fee: '', rating: '', bio: '', status: 'available' };

export default function PerformersPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => { const res = await api.get('/performers'); setItems(res.data); };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/performers/${form.id}`, form);
    else await api.post('/performers', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this performer?')) { await api.delete(`/performers/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const res = await api.post('/performers/ai/recommend', {
      eventName: 'General Recommendation', eventType: 'Concert',
      genre: selected.genre, budget: selected.fee, capacity: 2000, targetAudience: 'General'
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Performer Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Recommend</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.name}</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Genre</label><div className="value">{selected.genre}</div></div>
            <div className="detail-field"><label>Email</label><div className="value">{selected.email}</div></div>
            <div className="detail-field"><label>Phone</label><div className="value">{selected.phone}</div></div>
            <div className="detail-field"><label>Agent</label><div className="value">{selected.agent}</div></div>
            <div className="detail-field"><label>Agent Email</label><div className="value">{selected.agentEmail}</div></div>
            <div className="detail-field"><label>Fee</label><div className="value money">${parseFloat(selected.fee || 0).toLocaleString()}</div></div>
            <div className="detail-field"><label>Rating</label><div className="value">{selected.rating} / 5.0</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Bio</label><div className="value">{selected.bio}</div></div>
          </div>
        </div>
        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Performers</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Performer</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Genre</th><th>Fee</th><th>Rating</th><th>Agent</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                <td>{item.genre}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.fee || 0).toLocaleString()}</td>
                <td>{item.rating}</td>
                <td>{item.agent}</td>
                <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Performer' : 'New Performer'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label>Genre</label><input value={form.genre} onChange={e => setForm({...form, genre: e.target.value})} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div className="form-group"><label>Agent</label><input value={form.agent} onChange={e => setForm({...form, agent: e.target.value})} /></div>
          <div className="form-group"><label>Agent Email</label><input type="email" value={form.agentEmail} onChange={e => setForm({...form, agentEmail: e.target.value})} /></div>
          <div className="form-group"><label>Fee ($)</label><input type="number" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} /></div>
          <div className="form-group"><label>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm({...form, rating: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="available">Available</option><option value="booked">Booked</option><option value="unavailable">Unavailable</option>
            </select>
          </div>
          <div className="form-group"><label>Bio</label><textarea rows="3" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
