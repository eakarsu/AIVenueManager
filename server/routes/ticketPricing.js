const express = require('express');
const { TicketPricing, Event } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const pricing = await TicketPricing.findAll({ include: [Event], order: [['id', 'ASC']] });
    res.json(pricing);
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

// AI: Optimize pricing
router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const { eventId, eventName, eventType, capacity, soldSeats, basePrice, tierName } = req.body;
    const sellRate = capacity > 0 ? ((soldSeats / capacity) * 100).toFixed(1) : 0;

    const prompt = `As a venue ticket pricing expert, analyze and optimize pricing for this event:

Event: ${eventName}
Type: ${eventType}
Tier: ${tierName}
Current Base Price: $${basePrice}
Capacity: ${capacity}
Tickets Sold: ${soldSeats} (${sellRate}% sold)

Provide detailed pricing optimization recommendations including:
1. Optimal price point for maximum revenue
2. Dynamic pricing strategy based on current demand
3. Suggested tier adjustments
4. Early bird and last-minute pricing tactics
5. Revenue projection at different price points
6. Comparison with industry benchmarks for this event type`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert ticket pricing analyst for live events and venues. Provide data-driven, actionable pricing recommendations.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
