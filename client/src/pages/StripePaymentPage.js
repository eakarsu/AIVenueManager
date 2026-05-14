import React, { useState } from 'react';
import api from '../services/api';
import AIResponse from '../components/AIResponse';

export default function StripePaymentPage() {
  const [amount, setAmount] = useState(2500);
  const [currency, setCurrency] = useState('usd');
  const [eventId, setEventId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setData(null);
    try {
      const res = await api.post('/ai/stripe-payment-intent', {
        amount: parseInt(amount, 10),
        currency,
        eventId: eventId || null,
        customerEmail: customerEmail || null,
      });
      setData(res.data);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message;
      const missing = err.response?.data?.missing ? ` (missing: ${err.response.data.missing})` : '';
      setData({ error: true, message: status === 503 ? `${msg}${missing}` : msg });
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="page-header"><h1>Stripe Payment Intent</h1></div>
      <div className="detail-view">
        <h3 style={{ color: '#f1f5f9', marginBottom: 12 }}>Create a payment intent (requires STRIPE_SECRET_KEY)</h3>
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            <div className="form-group"><label>Amount (smallest unit, e.g. cents)</label><input type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="form-group"><label>Currency</label><input value={currency} onChange={e => setCurrency(e.target.value)} /></div>
            <div className="form-group"><label>Event ID</label><input value={eventId} onChange={e => setEventId(e.target.value)} /></div>
            <div className="form-group"><label>Customer Email</label><input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} /></div>
          </div>
          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn btn-ai" disabled={loading}>
              {loading ? 'Creating...' : 'Create Payment Intent'}
            </button>
          </div>
        </form>
      </div>
      <div style={{ marginTop: 16 }}><AIResponse data={data} loading={loading} /></div>
    </div>
  );
}
