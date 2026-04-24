import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { eventId: '', section: '', row: '', seatNumber: '', status: 'available', ticketHolder: '', ticketType: '', price: '', accessibilityFeatures: '' };

export default function SeatAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    const [res, evts] = await Promise.all([api.get('/seat-assignments'), api.get('/events')]);
    setItems(res.data); setEvents(evts.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/seat-assignments/${form.id}`, form);
    else await api.post('/seat-assignments', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/seat-assignments/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const event = selected?.Event || events.find(e => e.id === selected?.eventId);
    const res = await api.post('/seat-assignments/ai/optimize', {
      eventName: event?.name || 'Event', eventType: event?.type || 'Concert',
      capacity: event?.capacity || 1000, sections: selected.section, currentLayout: `${selected.section} ${selected.row}`
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    const event = selected.Event;
    return (
      <div>
        <div className="page-header">
          <h1>Seat Assignment Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Optimize</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.section} - Row {selected.row}</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Event</label><div className="value">{event?.name || `Event #${selected.eventId}`}</div></div>
            <div className="detail-field"><label>Section</label><div className="value">{selected.section}</div></div>
            <div className="detail-field"><label>Row</label><div className="value">{selected.row}</div></div>
            <div className="detail-field"><label>Seats</label><div className="value">{selected.seatNumber}</div></div>
            <div className="detail-field"><label>Ticket Type</label><div className="value">{selected.ticketType}</div></div>
            <div className="detail-field"><label>Price</label><div className="value money">${parseFloat(selected.price || 0).toFixed(2)}</div></div>
            <div className="detail-field"><label>Ticket Holder</label><div className="value">{selected.ticketHolder || 'N/A'}</div></div>
            <div className="detail-field"><label>Accessibility</label><div className="value">{selected.accessibilityFeatures || 'None'}</div></div>
          </div>
        </div>
        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Seat Assignments</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Assignment</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Event</th><th>Section</th><th>Row</th><th>Seats</th><th>Type</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.Event?.name || `Event #${item.eventId}`}</td>
                <td>{item.section}</td>
                <td>{item.row}</td>
                <td>{item.seatNumber}</td>
                <td>{item.ticketType}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.price || 0).toFixed(2)}</td>
                <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Assignment' : 'New Seat Assignment'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Event</label>
            <select value={form.eventId} onChange={e => setForm({...form, eventId: parseInt(e.target.value)})}><option value="">Select</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Section</label><input value={form.section} onChange={e => setForm({...form, section: e.target.value})} /></div>
          <div className="form-group"><label>Row</label><input value={form.row} onChange={e => setForm({...form, row: e.target.value})} /></div>
          <div className="form-group"><label>Seat Number</label><input value={form.seatNumber} onChange={e => setForm({...form, seatNumber: e.target.value})} /></div>
          <div className="form-group"><label>Ticket Type</label><input value={form.ticketType} onChange={e => setForm({...form, ticketType: e.target.value})} /></div>
          <div className="form-group"><label>Price</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
          <div className="form-group"><label>Ticket Holder</label><input value={form.ticketHolder} onChange={e => setForm({...form, ticketHolder: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="available">Available</option><option value="reserved">Reserved</option><option value="sold">Sold</option><option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="form-group"><label>Accessibility Features</label><input value={form.accessibilityFeatures} onChange={e => setForm({...form, accessibilityFeatures: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
