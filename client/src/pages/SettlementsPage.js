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
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (pg = 1) => {
    try {
      const [res, evts] = await Promise.all([
        api.get(`/settlements?page=${pg}&limit=20`),
        api.get('/events?limit=200')
      ]);
      const body = res.data;
      if (body && body.data && body.pagination) {
        setItems(body.data); setTotalPages(body.pagination.totalPages || 1);
      } else if (Array.isArray(body)) {
        setItems(body); setTotalPages(1);
      } else { setItems(body?.data || []); }
      setEvents(Array.isArray(evts.data) ? evts.data : evts.data?.data || []);
    } catch (e) { /* ignore */ }
  };
  useEffect(() => { load(page); }, [page]);

  const handleSave = async () => {
    const data = { ...form, netProfit: (parseFloat(form.totalRevenue || 0) - parseFloat(form.totalExpenses || 0)).toFixed(2) };
    if (editing) await api.put(`/settlements/${form.id}`, data);
    else await api.post('/settlements', data);
    setShowModal(false); setForm(emptyForm); setEditing(false); load(page);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete?')) { await api.delete(`/settlements/${id}`); setSelected(null); load(page); }
  };

  const runAI = async () => {
    setAiLoading(true); setAiData(null);
    try {
      const res = await api.post('/settlements/ai/analyze', {
        id: selected.id,
        eventName: selected.Event?.name || 'Event',
        totalRevenue: selected.totalRevenue, ticketRevenue: selected.ticketRevenue,
        concessionRevenue: selected.concessionRevenue, merchandiseRevenue: selected.merchandiseRevenue,
        totalExpenses: selected.totalExpenses, performerFees: selected.performerFees,
        venueRental: selected.venueRental, staffCosts: selected.staffCosts,
        marketingCosts: selected.marketingCosts, netProfit: selected.netProfit
      });
      setAiData(res.data);
    } catch (e) { setAiData({ error: true, message: e.response?.data?.error || e.message }); }
    setAiLoading(false);
  };

  const runNarrative = async () => {
    if (!selected?.id) return;
    setNarrativeLoading(true); setNarrative(null);
    try {
      const res = await api.post(`/settlements/${selected.id}/ai-narrative`);
      setNarrative(res.data);
    } catch (e) {
      setNarrative({ error: true, message: e.response?.data?.error || e.message });
    }
    setNarrativeLoading(false);
  };

  const downloadPDF = async () => {
    if (!selected?.id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/settlements/${selected.id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settlement-${selected.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('PDF download failed: ' + e.message);
    }
  };

  const fmt = (v) => {
    const n = parseFloat(v || 0);
    return n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`;
  };

  if (selected) {
    const profit = parseFloat(selected.netProfit || 0);
    const n = narrative?.parsed;
    return (
      <div>
        <div className="page-header">
          <h1>Settlement Details</h1>
          <div className="header-actions">
            <button className="btn btn-back" onClick={() => { setSelected(null); setAiData(null); setNarrative(null); }}>Back</button>
            <button className="btn btn-ai" onClick={runAI} disabled={aiLoading}>🤖 AI Analyze</button>
            <button className="btn btn-ai" onClick={runNarrative} disabled={narrativeLoading}>{narrativeLoading ? '⏳' : '📝'} AI Narrative</button>
            <button className="btn btn-ai" onClick={downloadPDF}>📄 Download PDF</button>
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

        {/* AI Narrative (structured) */}
        {narrativeLoading && <AIResponse data={null} loading={true} />}
        {narrative && !narrative.error && n && (
          <div className="ai-response" style={{ marginTop: 16 }}>
            <div className="ai-response-header">
              <div className="ai-icon">📝</div>
              <div><div className="ai-label">AI Settlement Narrative</div></div>
              {n.margin_pct !== undefined && (
                <span className="status-badge" style={{ background: n.margin_pct >= 20 ? '#16a34a' : n.margin_pct >= 5 ? '#d97706' : '#dc2626', color: '#fff', marginLeft: 'auto' }}>
                  {n.margin_pct?.toFixed(1)}% margin
                </span>
              )}
            </div>
            <div style={{ padding: 16 }}>
              {n.executive_summary && (
                <div style={{ marginBottom: 16, padding: 12, background: 'rgba(99,102,241,0.1)', borderLeft: '3px solid #818cf8', borderRadius: 4 }}>
                  <div style={{ fontWeight: 600, color: '#a5b4fc', marginBottom: 4, fontSize: 12 }}>EXECUTIVE SUMMARY</div>
                  <div style={{ color: '#e2e8f0' }}>{n.executive_summary}</div>
                </div>
              )}
              {n.financial_highlights && (
                <div style={{ marginBottom: 16 }}>
                  <strong style={{ color: '#f1f5f9' }}>Financial Highlights:</strong>
                  <p style={{ color: '#cbd5e1' }}>{n.financial_highlights}</p>
                </div>
              )}
              {(n.revenue_breakdown || n.expense_breakdown) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {n.revenue_breakdown && (
                    <div style={{ padding: 12, background: 'rgba(34,197,94,0.1)', borderRadius: 4 }}>
                      <strong style={{ color: '#4ade80' }}>Revenue Breakdown</strong>
                      <ul style={{ color: '#cbd5e1', paddingLeft: 16, margin: '8px 0 0 0' }}>
                        <li>Tickets: ${n.revenue_breakdown.tickets?.toLocaleString()}</li>
                        <li>Concessions: ${n.revenue_breakdown.concessions?.toLocaleString()}</li>
                        <li>Merchandise: ${n.revenue_breakdown.merchandise?.toLocaleString()}</li>
                      </ul>
                    </div>
                  )}
                  {n.expense_breakdown && (
                    <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 4 }}>
                      <strong style={{ color: '#f87171' }}>Expense Breakdown</strong>
                      <ul style={{ color: '#cbd5e1', paddingLeft: 16, margin: '8px 0 0 0' }}>
                        <li>Performer: ${n.expense_breakdown.performer?.toLocaleString()}</li>
                        <li>Venue: ${n.expense_breakdown.venue?.toLocaleString()}</li>
                        <li>Staff: ${n.expense_breakdown.staff?.toLocaleString()}</li>
                        <li>Marketing: ${n.expense_breakdown.marketing?.toLocaleString()}</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {n.insights?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: '#f1f5f9' }}>💡 Insights:</strong>
                  <ul style={{ color: '#cbd5e1', paddingLeft: 16 }}>
                    {n.insights.map((i, idx) => <li key={idx}>{i}</li>)}
                  </ul>
                </div>
              )}
              {n.recommendations?.length > 0 && (
                <div>
                  <strong style={{ color: '#f1f5f9' }}>📋 Recommendations:</strong>
                  <ul style={{ color: '#cbd5e1', paddingLeft: 16 }}>
                    {n.recommendations.map((r, idx) => <li key={idx}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {narrative?.error && <div className="error-message" style={{ padding: 16, marginTop: 16 }}>Narrative Error: {narrative.message}</div>}

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
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>« Prev</button>
          <span style={{ color: '#cbd5e1', alignSelf: 'center' }}>Page {page} / {totalPages}</span>
          <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next »</button>
        </div>
      )}
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
