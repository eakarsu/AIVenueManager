const express = require('express');
const { PerformerBooking, Performer, Event } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const bookings = await PerformerBooking.findAll({ include: [Performer, Event], order: [['id', 'DESC']] });
    res.json(bookings);
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

// AI: Analyze booking
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const { performerName, eventName, fee, eventType, capacity } = req.body;

    const prompt = `Analyze this performer booking deal:

Performer: ${performerName}
Event: ${eventName}
Event Type: ${eventType}
Booking Fee: $${fee}
Venue Capacity: ${capacity}

Provide analysis including:
1. Is the fee reasonable for this type of event and capacity?
2. Expected ROI from this booking
3. Contract recommendations
4. Marketing strategy to leverage this booking
5. Potential risks and mitigation strategies
6. Comparable booking benchmarks`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert entertainment business analyst specializing in live event performer bookings.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
