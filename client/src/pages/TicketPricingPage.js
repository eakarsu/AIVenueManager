import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { eventId: '', tierName: '', basePrice: '', currentPrice: '', demandMultiplier: 1.0, totalSeats: '', soldSeats: 0, minPrice: '', maxPrice: '' };

export default function TicketPricingPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    const [res, evts] = await Promise.all([api.get('/ticket-pricing'), api.get('/events')]);
    setItems(res.data);
    setEvents(evts.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (editing) await api.put(`/ticket-pricing/${form.id}`, form);
    else await api.post('/ticket-pricing', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/ticket-pricing/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const event = selected?.Event || events.find(e => e.id === selected?.eventId);
    const res = await api.post('/ticket-pricing/ai/optimize', {
      eventId: selected.eventId, eventName: event?.name || 'Event', eventType: event?.type || 'Concert',
      capacity: selected.totalSeats, soldSeats: selected.soldSeats, basePrice: selected.basePrice, tierName: selected.tierName
    });
    setAiData(res.data); setAiLoading(false);
  };

  if (selected) {
    const event = selected.Event;
    const sellPct = selected.totalSeats > 0 ? ((selected.soldSeats / selected.totalSeats) * 100).toFixed(1) : 0;
    return (
      <div>
        <div className="page-header">
          <h1>Ticket Pricing Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Optimize</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.tierName}</h2></div>
          <div className="detail-grid">
            <div className="detail-field"><label>Event</label><div className="value">{event?.name || `Event #${selected.eventId}`}</div></div>
            <div className="detail-field"><label>Tier</label><div className="value">{selected.tierName}</div></div>
            <div className="detail-field"><label>Base Price</label><div className="value money">${parseFloat(selected.basePrice).toFixed(2)}</div></div>
            <div className="detail-field"><label>Current Price</label><div className="value money">${parseFloat(selected.currentPrice).toFixed(2)}</div></div>
            <div className="detail-field"><label>Demand Multiplier</label><div className="value">{selected.demandMultiplier}x</div></div>
            <div className="detail-field"><label>Seats Sold</label><div className="value">{selected.soldSeats} / {selected.totalSeats} ({sellPct}%)</div></div>
            <div className="detail-field"><label>Price Range</label><div className="value">${selected.minPrice} — ${selected.maxPrice}</div></div>
          </div>
        </div>
        <AIResponse data={aiData} loading={aiLoading} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Ticket Pricing</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Tier</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Event</th><th>Tier</th><th>Base Price</th><th>Current</th><th>Multiplier</th><th>Sold</th><th>Total</th></tr></thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.Event?.name || `Event #${item.eventId}`}</td>
                <td>{item.tierName}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.basePrice).toFixed(2)}</td>
                <td style={{ color: '#4ade80' }}>${parseFloat(item.currentPrice).toFixed(2)}</td>
                <td>{item.demandMultiplier}x</td>
                <td>{item.soldSeats}</td>
                <td>{item.totalSeats}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Pricing' : 'New Pricing Tier'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Event</label>
            <select value={form.eventId} onChange={e => setForm({...form, eventId: parseInt(e.target.value)})}>
              <option value="">Select Event</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Tier Name</label><input value={form.tierName} onChange={e => setForm({...form, tierName: e.target.value})} /></div>
          <div className="form-group"><label>Base Price</label><input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({...form, basePrice: e.target.value})} /></div>
          <div className="form-group"><label>Current Price</label><input type="number" step="0.01" value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})} /></div>
          <div className="form-group"><label>Total Seats</label><input type="number" value={form.totalSeats} onChange={e => setForm({...form, totalSeats: e.target.value})} /></div>
          <div className="form-group"><label>Sold Seats</label><input type="number" value={form.soldSeats} onChange={e => setForm({...form, soldSeats: e.target.value})} /></div>
          <div className="form-group"><label>Min Price</label><input type="number" step="0.01" value={form.minPrice} onChange={e => setForm({...form, minPrice: e.target.value})} /></div>
          <div className="form-group"><label>Max Price</label><input type="number" step="0.01" value={form.maxPrice} onChange={e => setForm({...form, maxPrice: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
