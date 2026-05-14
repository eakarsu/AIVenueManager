const express = require('express');
const { SeatAssignment, Event, sequelize } = require('../models');
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
    const { count, rows } = await SeatAssignment.findAndCountAll({
      include: [Event], order: [['section', 'ASC'], ['row', 'ASC']], limit, offset
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const seat = await SeatAssignment.findByPk(req.params.id, { include: [Event] });
    if (!seat) return res.status(404).json({ error: 'Not found' });
    res.json(seat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const seat = await SeatAssignment.create(req.body);
    res.status(201).json(seat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const seat = await SeatAssignment.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ error: 'Not found' });
    await seat.update(req.body);
    res.json(seat);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const seat = await SeatAssignment.findByPk(req.params.id);
    if (!seat) return res.status(404).json({ error: 'Not found' });
    await seat.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Seat map for event
router.get('/event/:eventId/seat-map', auth, async (req, res) => {
  try {
    const seats = await SeatAssignment.findAll({
      where: { eventId: req.params.eventId },
      order: [['section', 'ASC'], ['row', 'ASC'], ['seatNumber', 'ASC']]
    });

    // Group by section and row
    const map = {};
    for (const seat of seats) {
      if (!map[seat.section]) map[seat.section] = {};
      if (!map[seat.section][seat.row]) map[seat.section][seat.row] = [];
      map[seat.section][seat.row].push({
        id: seat.id,
        seatNumber: seat.seatNumber,
        status: seat.status,
        ticketType: seat.ticketType,
        price: seat.price,
        accessibilityFeatures: seat.accessibilityFeatures
      });
    }

    const sections = Object.entries(map).map(([sectionName, rows]) => ({
      section: sectionName,
      rows: Object.entries(rows).map(([rowName, seats]) => ({
        row: rowName,
        seats,
        available: seats.filter(s => s.status === 'available').length,
        total: seats.length
      }))
    }));

    res.json({ event_id: req.params.eventId, sections, total_seats: seats.length, available: seats.filter(s => s.status === 'available').length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Optimize seat layout (text)
router.post('/ai/optimize', auth, aiRateLimiter, async (req, res) => {
  try {
    const { eventName, eventType, capacity, sections, currentLayout } = req.body;
    const prompt = `Venue seating optimization expert. Event: ${eventName} (${eventType}), Capacity: ${capacity}.
Provide: 1) Optimal section layout 2) Row/seat numbering 3) ADA placement 4) Premium vs standard zones 5) Sightline analysis 6) Crowd flow 7) Revenue maximization`;
    const aiResponse = await callOpenRouter(prompt, 'You are an expert venue seating layout designer.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Seat recommendation (structured JSON)
router.post('/recommend', auth, aiRateLimiter, async (req, res) => {
  try {
    const { event_id, party_size, accessibility_needs, budget_max, view_preference } = req.body;

    // Fetch available seats from DB
    const availableSeats = await SeatAssignment.findAll({
      where: { eventId: event_id, status: 'available' },
      order: [['section', 'ASC'], ['row', 'ASC']],
      limit: 200
    });

    const event = await Event.findByPk(event_id);
    const seatSummary = availableSeats.slice(0, 50).map(s =>
      `${s.section}-${s.row}${s.seatNumber} ($${s.price || 'N/A'}) ${s.accessibilityFeatures ? '[ADA]' : ''}`
    ).join(', ');

    const prompt = `Seat recommendation engine. Return valid JSON only.

Event: ${event?.name || `Event ${event_id}`}
Party Size: ${party_size}
Accessibility Needs: ${accessibility_needs || 'none'}
Budget Max: $${budget_max || 'unlimited'} per seat
View Preference: ${view_preference || 'any'}
Total Available Seats: ${availableSeats.length}

Sample Available Seats: ${seatSummary || 'No seats found'}

Return JSON: {"recommended_seats":[{"row":"string","seat":"string","section":"string","price":number,"reason":"string","accessibility":boolean}],"alternative_options":[{"row":"string","seat":"string","section":"string","price":number,"reason":"string"}],"total_cost":number,"booking_tip":"string"}`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert venue seating coordinator. Return only valid JSON.', true);
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'seat-assignments/recommend', JSON.stringify({ event_id, party_size, accessibility_needs, budget_max }), JSON.stringify(aiResponse.parsed || {})] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
