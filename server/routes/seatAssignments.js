const express = require('express');
const { SeatAssignment, Event } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const seats = await SeatAssignment.findAll({ include: [Event], order: [['section', 'ASC'], ['row', 'ASC']] });
    res.json(seats);
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

// AI: Optimize seat layout
router.post('/ai/optimize', auth, async (req, res) => {
  try {
    const { eventName, eventType, capacity, sections, currentLayout } = req.body;

    const prompt = `As a venue seating optimization expert, analyze and optimize the seat layout:

Event: ${eventName}
Type: ${eventType}
Total Capacity: ${capacity}
Current Sections: ${sections || 'Standard layout'}
Current Layout: ${currentLayout || 'Not specified'}

Provide detailed seating optimization including:
1. Optimal section layout for this event type
2. Row and seat numbering recommendations
3. Accessibility seating placement (ADA compliance)
4. Premium vs standard zone allocation
5. Sight-line analysis and recommendations
6. Crowd flow and emergency exit considerations
7. Revenue maximization through strategic seat categorization`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert venue seating layout designer. Optimize for audience experience, safety, and revenue.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
