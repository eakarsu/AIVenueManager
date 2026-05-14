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
  const [autoAdjust, setAutoAdjust] = useState(null);
  const [autoAdjustLoading, setAutoAdjustLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const [res, evts] = await Promise.all([api.get(`/ticket-pricing?page=${pg}&limit=20`), api.get('/events?limit=200')]);
      const body = res.data;
      const evtBody = evts.data;
      if (body && body.data && body.pagination) {
        setItems(body.data); setTotalPages(body.pagination.totalPages || 1);
      } else if (Array.isArray(body)) {
        setItems(body); setTotalPages(1);
      } else { setItems(body?.data || []); }
      setEvents(Array.isArray(evtBody) ? evtBody : evtBody?.data || []);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(page); }, [page]);

  const handleSave = async () => {
    if (editing) await api.put(`/ticket-pricing/${form.id}`, form);
    else await api.post('/ticket-pricing', form);
    setShowModal(false); setForm(emptyForm); setEditing(false); load(page);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/ticket-pricing/${id}`); setSelected(null); load(page); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    try {
      const event = selected?.Event || events.find(e => e.id === selected?.eventId);
      const res = await api.post('/ticket-pricing/ai/optimize', {
        id: selected.id,
        eventId: selected.eventId, eventName: event?.name || 'Event', eventType: event?.type || 'Concert',
        capacity: selected.totalSeats, soldSeats: selected.soldSeats, basePrice: selected.basePrice, tierName: selected.tierName
      });
      setAiData(res.data);
    } catch (e) { setAiData({ error: true, message: e.response?.data?.error || e.message }); }
    setAiLoading(false);
  };

  const runAutoAdjust = async () => {
    if (!selected?.id) return;
    setAutoAdjustLoading(true); setAutoAdjust(null);
    try {
      const res = await api.post(`/ticket-pricing/${selected.id}/auto-adjust`);
      setAutoAdjust(res.data);
    } catch (e) {
      setAutoAdjust({ error: true, message: e.response?.data?.error || e.message });
    }
    setAutoAdjustLoading(false);
  };

  const applyAdjustment = async (adjustment) => {
    // Find the matching tier and update its price
    const tier = items.find(i => i.tierName === adjustment.tier && i.eventId === selected.eventId);
    if (!tier) {
      alert('Tier not found');
      return;
    }
    if (!window.confirm(`Apply price change for ${adjustment.tier}: $${adjustment.from_price} → $${adjustment.to_price}?`)) return;
    try {
      await api.put(`/ticket-pricing/${tier.id}`, { ...tier, currentPrice: adjustment.to_price });
      alert('Price updated');
      load(page);
    } catch (e) {
      alert('Update failed: ' + (e.response?.data?.error || e.message));
    }
  };

  if (selected) {
    const event = selected.Event;
    const sellPct = selected.totalSeats > 0 ? ((selected.soldSeats / selected.totalSeats) * 100).toFixed(1) : 0;
    const aa = autoAdjust?.parsed;
    return (
      <div>
        <div className="page-header">
          <h1>Ticket Pricing Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); setAutoAdjust(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI} disabled={aiLoading}>🤖 AI Optimize</button>
            <button className="btn btn-ai" onClick={runAutoAdjust} disabled={autoAdjustLoading}>{autoAdjustLoading ? '⏳' : '📈'} Auto-Adjust</button>
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

        {/* Auto-Adjust Results */}
        {autoAdjustLoading && <AIResponse data={null} loading={true} />}
        {autoAdjust && !autoAdjust.error && aa && (
          <div className="ai-response" style={{ marginTop: 16 }}>
            <div className="ai-response-header">
              <div className="ai-icon">📈</div>
              <div><div className="ai-label">Auto-Adjust Recommendations</div></div>
              {aa.urgency && <span className={`status-badge`} style={{ background: aa.urgency === 'high' ? '#dc2626' : aa.urgency === 'medium' ? '#d97706' : '#16a34a', color: '#fff' }}>{aa.urgency.toUpperCase()}</span>}
            </div>
            <div style={{ padding: 16 }}>
              {aa.overall_strategy && <p style={{ color: '#cbd5e1', marginBottom: 12 }}><strong>Strategy:</strong> {aa.overall_strategy}</p>}
              {aa.revenue_impact_estimate && <p style={{ color: '#cbd5e1', marginBottom: 12 }}><strong>Revenue Impact:</strong> {aa.revenue_impact_estimate}</p>}
              {aa.adjustments?.length > 0 && (
                <div>
                  <h4 style={{ color: '#f1f5f9', marginBottom: 8 }}>Suggested Tier Adjustments</h4>
                  <table className="data-table">
                    <thead><tr><th>Tier</th><th>From</th><th>To</th><th>Δ</th><th>Reasoning</th><th>Apply</th></tr></thead>
                    <tbody>
                      {aa.adjustments.map((a, i) => {
                        const delta = (a.to_price - a.from_price).toFixed(2);
                        const positive = delta >= 0;
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{a.tier}</td>
                            <td>${a.from_price?.toFixed(2)}</td>
                            <td style={{ fontWeight: 700, color: positive ? '#4ade80' : '#f87171' }}>${a.to_price?.toFixed(2)}</td>
                            <td style={{ color: positive ? '#4ade80' : '#f87171' }}>{positive ? '+' : ''}{delta}</td>
                            <td style={{ fontSize: 12 }}>{a.reasoning}</td>
                            <td><button className="btn btn-edit" onClick={() => applyAdjustment(a)}>Apply</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {autoAdjust?.error && <div className="error-message" style={{ padding: 16, marginTop: 16 }}>Auto-Adjust Error: {autoAdjust.message}</div>}

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
      {loading ? <div className="ai-loading"><div className="spinner"></div>Loading...</div> : (
        <>
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
