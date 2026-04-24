import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { performerId: '', eventId: '', fee: '', status: 'pending', contractSigned: false, performanceTime: '', setDuration: '', notes: '' };

export default function PerformerBookingsPage() {
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
    const [res, perfs, evts] = await Promise.all([api.get('/performer-bookings'), api.get('/performers'), api.get('/events')]);
    setItems(res.data); setPerformers(perfs.data); setEvents(evts.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/performer-bookings/${form.id}`, form);
    else await api.post('/performer-bookings', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/performer-bookings/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const res = await api.post('/performer-bookings/ai/analyze', {
      performerName: selected.Performer?.name || 'Performer', eventName: selected.Event?.name || 'Event',
      fee: selected.fee, eventType: selected.Event?.type || 'Concert', capacity: selected.Event?.capacity || 1000
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    return (
      <div>
        <div className="page-header">
          <h1>Booking Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Analyze</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.Performer?.name} — {selected.Event?.name}</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Performer</label><div className="value">{selected.Performer?.name}</div></div>
            <div className="detail-field"><label>Event</label><div className="value">{selected.Event?.name}</div></div>
            <div className="detail-field"><label>Fee</label><div className="value money">${parseFloat(selected.fee || 0).toLocaleString()}</div></div>
            <div className="detail-field"><label>Performance Time</label><div className="value">{selected.performanceTime}</div></div>
            <div className="detail-field"><label>Set Duration</label><div className="value">{selected.setDuration} minutes</div></div>
            <div className="detail-field"><label>Contract Signed</label><div className="value">{selected.contractSigned ? '✅ Yes' : '❌ No'}</div></div>
            <div className="detail-field" style={{ gridColumn: '1 / -1' }}><label>Notes</label><div className="value">{selected.notes}</div></div>
          </div>
        </div>
        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Performer Bookings</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Booking</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Performer</th><th>Event</th><th>Fee</th><th>Time</th><th>Duration</th><th>Contract</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.Performer?.name}</td>
                <td>{item.Event?.name}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.fee || 0).toLocaleString()}</td>
                <td>{item.performanceTime}</td>
                <td>{item.setDuration}m</td>
                <td>{item.contractSigned ? '✅' : '❌'}</td>
                <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Booking' : 'New Booking'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Performer</label>
            <select value={form.performerId} onChange={e => setForm({...form, performerId: parseInt(e.target.value)})}><option value="">Select</option>{performers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Event</label>
            <select value={form.eventId} onChange={e => setForm({...form, eventId: parseInt(e.target.value)})}><option value="">Select</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Fee ($)</label><input type="number" value={form.fee} onChange={e => setForm({...form, fee: e.target.value})} /></div>
          <div className="form-group"><label>Performance Time</label><input type="time" value={form.performanceTime} onChange={e => setForm({...form, performanceTime: e.target.value})} /></div>
          <div className="form-group"><label>Set Duration (minutes)</label><input type="number" value={form.setDuration} onChange={e => setForm({...form, setDuration: e.target.value})} /></div>
          <div className="form-group"><label>Contract Signed</label>
            <select value={form.contractSigned} onChange={e => setForm({...form, contractSigned: e.target.value === 'true'})}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-group"><label>Notes</label><textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
