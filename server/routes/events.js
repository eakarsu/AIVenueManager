const express = require('express');
const { Event, TicketPricing, SeatAssignment, PerformerBooking, sequelize } = require('../models');
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
    const { count, rows } = await Event.findAndCountAll({ order: [['date', 'ASC']], limit, offset });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Seat map for event
router.get('/:id/seat-map', auth, async (req, res) => {
  try {
    const seats = await SeatAssignment.findAll({
      where: { eventId: req.params.id },
      order: [['section', 'ASC'], ['row', 'ASC'], ['seatNumber', 'ASC']]
    });
    const map = {};
    for (const seat of seats) {
      if (!map[seat.section]) map[seat.section] = {};
      if (!map[seat.section][seat.row]) map[seat.section][seat.row] = [];
      map[seat.section][seat.row].push({ id: seat.id, seatNumber: seat.seatNumber, status: seat.status, price: seat.price, accessibilityFeatures: seat.accessibilityFeatures });
    }
    const sections = Object.entries(map).map(([sectionName, rows]) => ({
      section: sectionName,
      rows: Object.entries(rows).map(([rowName, s]) => ({ row: rowName, seats: s, available: s.filter(x => x.status === 'available').length, total: s.length }))
    }));
    res.json({ event_id: req.params.id, sections, total_seats: seats.length, available: seats.filter(s => s.status === 'available').length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.update(req.body);
    res.json(event);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Event forecast (DB-grounded)
router.post('/:id/ai-forecast', auth, aiRateLimiter, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Not found' });

    const [pricingTiers, seatStats, bookings] = await Promise.all([
      TicketPricing.findAll({ where: { eventId: req.params.id } }),
      SeatAssignment.findAll({ where: { eventId: req.params.id } }),
      PerformerBooking.findAll({ where: { eventId: req.params.id } })
    ]);

    const totalSold = pricingTiers.reduce((s, t) => s + (t.soldSeats || 0), 0);
    const totalCap = pricingTiers.reduce((s, t) => s + (t.totalSeats || 0), 0);
    const totalFees = bookings.reduce((s, b) => s + parseFloat(b.fee || 0), 0);

    const prompt = `Event forecast analysis. Return valid JSON only.
Event: ${event.name} (${event.type}), Date: ${event.date}
Capacity: ${event.capacity}, Sold: ${totalSold}/${totalCap}
Performer Fees: $${totalFees}
Tiers: ${pricingTiers.map(t => `${t.tierName}: $${t.currentPrice}`).join(', ')}

Return JSON: {"attendance_forecast":number,"revenue_forecast":number,"sellout_probability":number,"risk_factors":["string"],"opportunities":["string"],"recommended_actions":["string"]}`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert live event forecasting analyst. Return only valid JSON.', true);
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'events/ai-forecast', JSON.stringify({ event_id: req.params.id }), JSON.stringify(aiResponse.parsed || {})] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
