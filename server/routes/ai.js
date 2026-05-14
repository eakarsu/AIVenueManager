const express = require('express');
const authMiddleware = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { sequelize } = require('../models');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

async function persist(userId, endpoint, inputData, result) {
  try {
    await sequelize.query(
      'INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)',
      { bind: [userId, endpoint, JSON.stringify(inputData), JSON.stringify(result)] }
    );
  } catch (e) { console.error('persist ai_results failed:', e.message); }
}

// POST /api/ai/dynamic-pricing — recommend ticket prices
router.post('/dynamic-pricing', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { event, currentPrices, salesVelocity, comparableEvents } = req.body || {};
    const systemPrompt = 'You are a venue revenue manager. Always respond with valid JSON.';
    const prompt = `Recommend ticket pricing for this event:\nEvent: ${JSON.stringify(event || {})}\nCurrent prices: ${JSON.stringify(currentPrices || [])}\nSales velocity: ${JSON.stringify(salesVelocity || {})}\nComparable events: ${JSON.stringify(comparableEvents || [])}\n\nReturn JSON: { "recommendations": [{ "tier": "", "currentPrice": 0, "recommendedPrice": 0, "rationale": "" }], "expectedRevenueLiftPct": 0, "summary": "" }`;
    const out = await callOpenRouter(prompt, systemPrompt, true);
    await persist(req.user?.id, 'dynamic-pricing', { eventId: event?.id }, out.parsed || out.result || out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/revenue-forecast — predict event revenue
router.post('/revenue-forecast', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { event, ticketTiers, capacity, marketingBudget, historicalData } = req.body || {};
    const systemPrompt = 'You are an event revenue forecasting analyst. Always respond with valid JSON.';
    const prompt = `Forecast revenue for this event:\nEvent: ${JSON.stringify(event || {})}\nTicket tiers: ${JSON.stringify(ticketTiers || [])}\nCapacity: ${capacity ?? 'unknown'}\nMarketing budget: ${marketingBudget ?? 'unknown'}\nHistorical data: ${JSON.stringify(historicalData || [])}\n\nReturn JSON: { "expectedTicketRevenue": 0, "expectedAncillaryRevenue": 0, "expectedTotal": 0, "rangeLow": 0, "rangeHigh": 0, "confidence": "low|medium|high", "drivers": ["..."], "risks": ["..."] }`;
    const out = await callOpenRouter(prompt, systemPrompt, true);
    await persist(req.user?.id, 'revenue-forecast', { eventId: event?.id }, out.parsed || out.result || out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/artist-audience-match — match artist to target audience
router.post('/artist-audience-match', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { artist, audienceProfile, venue, marketArea } = req.body || {};
    const systemPrompt = 'You are a talent buyer scoring artist-audience fit. Always respond with valid JSON.';
    const prompt = `Score how well this artist matches the target audience:\nArtist: ${JSON.stringify(artist || {})}\nAudience profile: ${JSON.stringify(audienceProfile || {})}\nVenue: ${JSON.stringify(venue || {})}\nMarket: ${marketArea || 'unknown'}\n\nReturn JSON: { "fitScore": 0, "fitLevel": "poor|fair|good|excellent", "strengths": ["..."], "concerns": ["..."], "expectedDrawPct": 0, "marketingChannels": ["..."] }`;
    const out = await callOpenRouter(prompt, systemPrompt, true);
    await persist(req.user?.id, 'artist-audience-match', { artistId: artist?.id }, out.parsed || out.result || out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/marketing-campaign-recommender — recommend channels, budget allocation, copy themes
router.post('/marketing-campaign-recommender', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.' });
    }
    const { event, audienceProfile, budget, channels, pastCampaigns, daysUntilEvent } = req.body || {};
    const systemPrompt = 'You are a venue marketing strategist. Always respond with valid JSON.';
    const prompt = `Recommend a marketing campaign plan for the upcoming event.\nEvent: ${JSON.stringify(event || {})}\nAudience profile: ${JSON.stringify(audienceProfile || {})}\nTotal budget (USD): ${budget ?? 'unknown'}\nAvailable channels: ${JSON.stringify(channels || [])}\nPast campaign performance: ${JSON.stringify(pastCampaigns || [])}\nDays until event: ${daysUntilEvent ?? 'unknown'}\n\nReturn JSON: { "channelMix": [{ "channel": "", "budgetPct": 0, "rationale": "" }], "creativeThemes": ["..."], "messagingPillars": ["..."], "schedule": [{ "phase": "", "startDay": 0, "endDay": 0, "focus": "" }], "expectedReach": 0, "expectedConversionPct": 0, "kpis": ["..."], "summary": "" }`;
    const out = await callOpenRouter(prompt, systemPrompt, true);
    await persist(req.user?.id, 'marketing-campaign-recommender', { eventId: event?.id, budget }, out.parsed || out.result || out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/scheduling-optimizer — multi-event cannibalization / lineup balancing (NEEDS-PRODUCT-DECISION)
// PRODUCT-DECISION: Cannibalization window defaults to 14 days; competing events come from req.body.
// Output is recommendations only — no auto-rescheduling.
router.post('/scheduling-optimizer', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured.', missing: 'OPENROUTER_API_KEY' });
    }
    const { events, marketEvents, windowDays, venueCapacity } = req.body || {};
    const win = Number.isInteger(windowDays) ? windowDays : 14;
    const systemPrompt = 'You are a venue scheduling and cannibalization analyst. Always respond with valid JSON.';
    const prompt = `Analyze the upcoming schedule for cannibalization risk and lineup balance.\nProposed events: ${JSON.stringify(events || [])}\nCompeting market events: ${JSON.stringify(marketEvents || [])}\nVenue capacity: ${venueCapacity ?? 'unknown'}\nCannibalization window (days): ${win}\n\nReturn JSON: { "conflicts": [{ "eventId": "", "conflictsWith": "", "severity": "low|medium|high", "reason": "" }], "rescheduleSuggestions": [{ "eventId": "", "currentDate": "", "suggestedDate": "", "rationale": "" }], "lineupGaps": ["..."], "summary": "" }`;
    const out = await callOpenRouter(prompt, systemPrompt, true);
    await persist(req.user?.id, 'scheduling-optimizer', { eventCount: (events || []).length, windowDays: win }, out.parsed || out.result || out);
    res.json(out);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/eventbrite-sync — pull/push events to Eventbrite (NEEDS-CREDS)
// Env: EVENTBRITE_API_TOKEN required. When unset returns 503 + missing.
// Implementation is stub: validates connectivity and returns prepared payload (no live call when stub mode).
router.post('/eventbrite-sync', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.EVENTBRITE_API_TOKEN) {
      return res.status(503).json({ error: 'Eventbrite integration not configured.', missing: 'EVENTBRITE_API_TOKEN' });
    }
    const { eventId, direction } = req.body || {};
    const dir = direction === 'pull' ? 'pull' : 'push';
    // Stub: do not actually call Eventbrite; return a prepared payload preview.
    const payload = {
      direction: dir,
      eventId: eventId || null,
      preparedAt: new Date().toISOString(),
      note: 'Eventbrite live API call would be issued here. Stub returns prepared payload only.',
    };
    await persist(req.user?.id, 'eventbrite-sync', { eventId, direction: dir }, payload);
    res.json(payload);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/stripe-payment-intent — create payment intent for ticket purchase (NEEDS-CREDS)
// Env: STRIPE_SECRET_KEY required. Stub returns a mock intent ID when key configured but `stripe` lib not installed.
router.post('/stripe-payment-intent', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: 'Stripe payment integration not configured.', missing: 'STRIPE_SECRET_KEY' });
    }
    const { amount, currency, eventId, customerEmail } = req.body || {};
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number (smallest currency unit).' });
    // PRODUCT-DECISION: We avoid pulling in the heavy `stripe` SDK here (no npm install per pass-5 rules).
    // Return a stub payment intent so the FE flow can be validated end-to-end.
    const stubIntent = {
      id: 'pi_stub_' + Math.random().toString(36).slice(2, 14),
      amount,
      currency: currency || 'usd',
      status: 'requires_payment_method',
      client_secret: 'pi_stub_secret_' + Math.random().toString(36).slice(2, 14),
      metadata: { eventId: eventId || null, customerEmail: customerEmail || null },
      stub: true,
    };
    await persist(req.user?.id, 'stripe-payment-intent', { amount, currency, eventId }, stubIntent);
    res.json(stubIntent);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
