const express = require('express');
const { TicketPricing, Event, sequelize } = require('../models');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  return { limit, offset: (page - 1) * limit, page };
};

router.get('/', auth, async (req, res) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { count, rows } = await TicketPricing.findAndCountAll({
      include: [Event], order: [['id', 'ASC']], limit, offset
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const pricing = await TicketPricing.findByPk(req.params.id, { include: [Event] });
    if (!pricing) return res.status(404).json({ error: 'Not found' });
    res.json(pricing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const pricing = await TicketPricing.create(req.body);
    res.status(201).json(pricing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const pricing = await TicketPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ error: 'Not found' });
    await pricing.update(req.body);
    res.json(pricing);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const pricing = await TicketPricing.findByPk(req.params.id);
    if (!pricing) return res.status(404).json({ error: 'Not found' });
    await pricing.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: DB-grounded optimize pricing
router.post('/ai/optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { id, eventId, eventName, eventType, capacity, soldSeats, basePrice, tierName } = req.body;
    let pricingRecord = null;
    if (id) pricingRecord = await TicketPricing.findByPk(id, { include: [Event] });

    const name = pricingRecord?.Event?.name || eventName || 'Event';
    const type = pricingRecord?.Event?.type || eventType || 'Concert';
    const cap = pricingRecord?.totalSeats || capacity || 0;
    const sold = pricingRecord?.soldSeats || soldSeats || 0;
    const price = pricingRecord?.basePrice || basePrice || 0;
    const tier = pricingRecord?.tierName || tierName || 'General';
    const eventDate = pricingRecord?.Event?.date;
    const daysUntil = eventDate ? Math.ceil((new Date(eventDate) - new Date()) / (1000 * 60 * 60 * 24)) : 'unknown';
    const sellRate = cap > 0 ? ((sold / cap) * 100).toFixed(1) : 0;

    const prompt = `Analyze and optimize ticket pricing. Return valid JSON only.

Event: ${name} (${type})
Tier: ${tier}
Base Price: $${price}
Sold: ${sold}/${cap} (${sellRate}%)
Days Until Event: ${daysUntil}

Return JSON:
{"optimal_price":number,"price_change_pct":number,"strategy":"string","demand_level":"low|medium|high|very_high","tier_adjustments":[{"tier":"string","action":"string","new_price":number,"reasoning":"string"}],"early_bird_discount":number,"last_minute_action":"string","revenue_projection":number,"insights":["string"]}`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert ticket pricing analyst. Return only valid JSON.', true);

    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'ticket-pricing/ai/optimize', JSON.stringify({ id, eventName: name, tier, sold, cap }), JSON.stringify(aiResponse.parsed || aiResponse.result)] }
    );

    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Demand-curve auto-adjust
router.post('/:id/auto-adjust', auth, aiRateLimiter, async (req, res) => {
  try {
    const pricing = await TicketPricing.findByPk(req.params.id, { include: [Event] });
    if (!pricing) return res.status(404).json({ error: 'Not found' });

    const allTiers = await TicketPricing.findAll({ where: { eventId: pricing.eventId } });
    const daysUntil = pricing.Event?.date ? Math.ceil((new Date(pricing.Event.date) - new Date()) / (1000 * 60 * 60 * 24)) : 'unknown';

    const prompt = `Dynamic pricing engine. Analyze ticket tiers and recommend adjustments. Return valid JSON only.

Event: ${pricing.Event?.name}
Days Until Event: ${daysUntil}

Tiers:
${allTiers.map(t => `- ${t.tierName}: $${t.currentPrice} (${t.soldSeats}/${t.totalSeats} = ${t.totalSeats > 0 ? ((t.soldSeats/t.totalSeats)*100).toFixed(0) : 0}%)`).join('\n')}

Return JSON:
{"adjustments":[{"tier":"string","from_price":number,"to_price":number,"reasoning":"string"}],"revenue_impact_estimate":"string","urgency":"low|medium|high","overall_strategy":"string"}`;

    const aiResponse = await callOpenRouter(prompt, 'You are a live event dynamic pricing expert. Return only valid JSON.', true);

    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'ticket-pricing/auto-adjust', JSON.stringify({ pricing_id: req.params.id }), JSON.stringify(aiResponse.parsed || {})] }
    );

    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
