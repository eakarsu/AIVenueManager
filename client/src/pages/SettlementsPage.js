import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from '../components/Modal';
import AIResponse from '../components/AIResponse';

const emptyForm = { eventId: '', totalRevenue: '', ticketRevenue: '', concessionRevenue: '', merchandiseRevenue: '', totalExpenses: '', performerFees: '', venueRental: '', staffCosts: '', marketingCosts: '', miscExpenses: '', netProfit: '', status: 'draft', notes: '' };

export default function SettlementsPage() {
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    const [res, evts] = await Promise.all([api.get('/settlements'), api.get('/events')]);
    setItems(res.data); setEvents(evts.data);
  };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const data = { ...form, netProfit: (parseFloat(form.totalRevenue || 0) - parseFloat(form.totalExpenses || 0)).toFixed(2) };
    if (editing) await api.put(`/settlements/${form.id}`, data);
    else await api.post('/settlements', data);
    setShowModal(false); setForm(emptyForm); setEditing(false); load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/settlements/${id}`); setSelected(null); load(); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    const res = await api.post('/settlements/ai/analyze', {
      eventName: selected.Event?.name || 'Event',
      totalRevenue: selected.totalRevenue, ticketRevenue: selected.ticketRevenue,
      concessionRevenue: selected.concessionRevenue, merchandiseRevenue: selected.merchandiseRevenue,
      totalExpenses: selected.totalExpenses, performerFees: selected.performerFees,
      venueRental: selected.venueRental, staffCosts: selected.staffCosts,
      marketingCosts: selected.marketingCosts, netProfit: selected.netProfit
    });
    setAiData(res.data); setAiLoading(false);
  };

  const fmt = (v) => {
    const n = parseFloat(v || 0);
    return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
  };

  if (selected) {
    const profit = parseFloat(selected.netProfit || 0);
    return (
      <div>
        <div className="page-header">
          <h1>Settlement Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI}>🤖 AI Analyze</button>
            <button className="btn btn-edit" onClick={() => { setForm(selected); setEditing(true); setShowModal(true); setSelected(null); }}>Edit</button>
            <button className="btn btn-delete" onClick={() => handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
        <div className="detail-view">
          <div className="detail-header"><h2>{selected.Event?.name} — Settlement</h2><span className={`status-badge status-${selected.status}`}>{selected.status}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value" style={{ color: '#4ade80', fontSize: '24px' }}>{fmt(selected.totalRevenue)}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value" style={{ color: '#f87171', fontSize: '24px' }}>{fmt(selected.totalExpenses)}</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center' }}>
              <div className="stat-label">Net Profit</div>
              <div className="stat-value" style={{ color: profit >= 0 ? '#4ade80' : '#f87171', fontSize: '24px' }}>{fmt(selected.netProfit)}</div>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-field"><label>Ticket Revenue</label><div className="value money">{fmt(selected.ticketRevenue)}</div></div>
            <div className="detail-field"><label>Concession Revenue</label><div className="value money">{fmt(selected.concessionRevenue)}</div></div>
            <div className="detail-field"><label>Merchandise Revenue</label><div className="value money">{fmt(selected.merchandiseRevenue)}</div></div>
            <div className="detail-field"><label>Performer Fees</label><div className="value">{fmt(selected.performerFees)}</div></div>
            <div className="detail-field"><label>Venue Rental</label><div className="value">{fmt(selected.venueRental)}</div></div>
            <div className="detail-field"><label>Staff Costs</label><div className="value">{fmt(selected.staffCosts)}</div></div>
            <div className="detail-field"><label>Marketing Costs</label><div className="value">{fmt(selected.marketingCosts)}</div></div>
            <div className="detail-field"><label>Misc Expenses</label><div className="value">{fmt(selected.miscExpenses)}</div></div>
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
        <h1>Settlement Reports</h1>
        <div className="header-actions"><button className="btn btn-add" onClick={() => { setForm(emptyForm); setEditing(false); setShowModal(true); }}>+ New Report</button></div>
      </div>
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>Event</th><th>Revenue</th><th>Expenses</th><th>Net Profit</th><th>Status</th></tr></thead>
          <tbody>
            {items.map(item => {
              const profit = parseFloat(item.netProfit || 0);
              return (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.Event?.name || `Event #${item.eventId}`}</td>
                  <td style={{ color: '#4ade80' }}>{fmt(item.totalRevenue)}</td>
                  <td style={{ color: '#f87171' }}>{fmt(item.totalExpenses)}</td>
                  <td style={{ color: profit >= 0 ? '#4ade80' : '#f87171', fontWeight: 700 }}>{fmt(item.netProfit)}</td>
                  <td><span className={`status-badge status-${item.status}`}>{item.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showModal && (
        <Modal title={editing ? 'Edit Settlement' : 'New Settlement Report'} onClose={() => setShowModal(false)} onSave={handleSave}>
          <div className="form-group"><label>Event</label>
            <select value={form.eventId} onChange={e => setForm({...form, eventId: parseInt(e.target.value)})}><option value="">Select</option>{events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Ticket Revenue</label><input type="number" step="0.01" value={form.ticketRevenue} onChange={e => setForm({...form, ticketRevenue: e.target.value})} /></div>
          <div className="form-group"><label>Concession Revenue</label><input type="number" step="0.01" value={form.concessionRevenue} onChange={e => setForm({...form, concessionRevenue: e.target.value})} /></div>
          <div className="form-group"><label>Merchandise Revenue</label><input type="number" step="0.01" value={form.merchandiseRevenue} onChange={e => setForm({...form, merchandiseRevenue: e.target.value})} /></div>
          <div className="form-group"><label>Total Revenue</label><input type="number" step="0.01" value={form.totalRevenue} onChange={e => setForm({...form, totalRevenue: e.target.value})} /></div>
          <div className="form-group"><label>Performer Fees</label><input type="number" step="0.01" value={form.performerFees} onChange={e => setForm({...form, performerFees: e.target.value})} /></div>
          <div className="form-group"><label>Venue Rental</label><input type="number" step="0.01" value={form.venueRental} onChange={e => setForm({...form, venueRental: e.target.value})} /></div>
          <div className="form-group"><label>Staff Costs</label><input type="number" step="0.01" value={form.staffCosts} onChange={e => setForm({...form, staffCosts: e.target.value})} /></div>
          <div className="form-group"><label>Marketing Costs</label><input type="number" step="0.01" value={form.marketingCosts} onChange={e => setForm({...form, marketingCosts: e.target.value})} /></div>
          <div className="form-group"><label>Misc Expenses</label><input type="number" step="0.01" value={form.miscExpenses} onChange={e => setForm({...form, miscExpenses: e.target.value})} /></div>
          <div className="form-group"><label>Total Expenses</label><input type="number" step="0.01" value={form.totalExpenses} onChange={e => setForm({...form, totalExpenses: e.target.value})} /></div>
          <div className="form-group"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="draft">Draft</option><option value="pending">Pending</option><option value="finalized">Finalized</option>
            </select>
          </div>
          <div className="form-group"><label>Notes</label><textarea rows="3" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
        </Modal>
      )}
    </div>
  );
}
