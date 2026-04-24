import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { name: '', address: '', city: '', capacity: '', type: '', amenities: '', contactPerson: '', contactEmail: '', contactPhone: '', hourlyRate: '', status: 'active' };

export default function VenuesPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => { const res = await api.get('/venues'); setItems(res.data); };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/venues/${form.id}`, form);
    else await api.post('/venues', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this venue?')) { await api.delete(`/venues/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const res = await api.post('/venues/ai/analyze', {
      name: selected.name, capacity: selected.capacity, type: selected.type,
      amenities: selected.amenities, city: selected.city
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Venue Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Analyze</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.name}</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Type</label><div className="value">{selected.type}</div></div>
            <div className="detail-field"><label>City</label><div className="value">{selected.city}</div></div>
            <div className="detail-field"><label>Address</label><div className="value">{selected.address}</div></div>
            <div className="detail-field"><label>Capacity</label><div className="value">{selected.capacity?.toLocaleString()}</div></div>
            <div className="detail-field"><label>Hourly Rate</label><div className="value money">${parseFloat(selected.hourlyRate || 0).toLocaleString()}/hr</div></div>
            <div className="detail-field"><label>Contact Person</label><div className="value">{selected.contactPerson}</div></div>
            <div className="detail-field"><label>Contact Email</label><div className="value">{selected.contactEmail}</div></div>
            <div className="detail-field"><label>Contact Phone</label><div className="value">{selected.contactPhone}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Amenities</label><div className="value">{selected.amenities}</div></div>
          </div>
        </div>
        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Venues</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Venue</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Name</th><th>Type</th><th>City</th><th>Capacity</th><th>Rate</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.city}</td>
                <td>{item.capacity?.toLocaleString()}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.hourlyRate || 0).toLocaleString()}/hr</td>
                <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Venue' : 'New Venue'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label>Type</label>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="">Select</option><option>Arena</option><option>Club</option><option>Outdoor</option><option>Lounge</option><option>Convention Center</option><option>Ballroom</option><option>Theater</option><option>Warehouse</option><option>Rooftop</option><option>Concert Hall</option>
            </select>
          </div>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div className="form-group"><label>City</label><input value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></div>
          <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
          <div className="form-group"><label>Hourly Rate ($)</label><input type="number" step="0.01" value={form.hourlyRate} onChange={e => setForm({...form, hourlyRate: e.target.value})} /></div>
          <div className="form-group"><label>Contact Person</label><input value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} /></div>
          <div className="form-group"><label>Contact Email</label><input type="email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} /></div>
          <div className="form-group"><label>Contact Phone</label><input value={form.contactPhone} onChange={e => setForm({...form, contactPhone: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option><option value="maintenance">Maintenance</option><option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="form-group"><label>Amenities</label><textarea rows="3" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
