const express = require('express');
const { PerformerBooking, Performer, Event, Venue, sequelize } = require('../models');
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
    const { count, rows } = await PerformerBooking.findAndCountAll({
      include: [Performer, Event], order: [['id', 'DESC']], limit, offset
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await PerformerBooking.findByPk(req.params.id, { include: [Performer, Event] });
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const booking = await PerformerBooking.create(req.body);
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const booking = await PerformerBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    await booking.update(req.body);
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const booking = await PerformerBooking.findByPk(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    await booking.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: DB-grounded analyze booking
router.post('/ai/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { id, performerName, eventName, fee, eventType, capacity } = req.body;
    let booking = null;
    if (id) booking = await PerformerBooking.findByPk(id, { include: [Performer, Event] });

    const pName = booking?.Performer?.name || performerName;
    const eName = booking?.Event?.name || eventName;
    const bookingFee = booking?.fee || fee;
    const eType = booking?.Event?.type || eventType;
    const cap = booking?.Event?.capacity || capacity;
    const genre = booking?.Performer?.genre || 'Unknown';
    const performerRating = booking?.Performer?.rating || 'N/A';
    const contractSigned = booking?.contractSigned || false;

    const prompt = `Analyze this performer booking deal. Return analysis.

Performer: ${pName} (Genre: ${genre}, Rating: ${performerRating}/5)
Event: ${eName} (${eType})
Booking Fee: $${bookingFee}
Venue Capacity: ${cap}
Contract Signed: ${contractSigned}

Analyze: 1) Fee reasonableness 2) Expected ROI 3) Contract recommendations 4) Marketing strategy 5) Risks 6) Benchmarks`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert entertainment business analyst specializing in live event performer bookings.');
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'performer-bookings/ai/analyze', JSON.stringify({ id, performerName: pName, fee: bookingFee }), JSON.stringify(aiResponse.result)] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
