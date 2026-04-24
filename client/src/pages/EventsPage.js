import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';

const emptyEvent = { name: '', type: 'Concert', date: '', venue: '', capacity: '', status: 'upcoming', description: '', expectedAttendance: '', genre: '' };

export default function EventsPage() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyEvent);
  const [editing, setEditing] = useState(false);

  const load = async () => {
    const res = await api.get('/events');
    setItems(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) {
      await api.put(`/events/${form.id}`, form);
    } else {
      await api.post('/events', form);
    }
    setShowModal(false);
    setForm(emptyEvent);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this event?')) {
      await api.delete(`/events/${id}`);
      setSelected(null);
      load();
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

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Event Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => setSelected(null)}>Back</button>
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
