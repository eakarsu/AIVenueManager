const express = require('express');
const { Venue } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const venues = await Venue.findAll({ order: [['name', 'ASC']] });
    res.json(venues);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Not found' });
    res.json(venue);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const venue = await Venue.create(req.body);
    res.status(201).json(venue);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Not found' });
    await venue.update(req.body);
    res.json(venue);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const venue = await Venue.findByPk(req.params.id);
    if (!venue) return res.status(404).json({ error: 'Not found' });
    await venue.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Venue analysis
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const { name, capacity, type, amenities, city } = req.body;

    const prompt = `Analyze this venue and provide optimization recommendations:

Venue: ${name}
Type: ${type}
City: ${city || 'Not specified'}
Capacity: ${capacity}
Amenities: ${amenities || 'Standard'}

Provide analysis including:
1. Venue utilization optimization strategies
2. Recommended event types for this venue
3. Revenue maximization opportunities
4. Facility improvement suggestions
5. Market positioning analysis
6. Competitive advantages and weaknesses`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert venue management consultant. Provide strategic advice for venue optimization.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
