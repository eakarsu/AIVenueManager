const express = require('express');
const { Performer } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const performers = await Performer.findAll({ order: [['name', 'ASC']] });
    res.json(performers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const performer = await Performer.findByPk(req.params.id);
    if (!performer) return res.status(404).json({ error: 'Not found' });
    res.json(performer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const performer = await Performer.create(req.body);
    res.status(201).json(performer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const performer = await Performer.findByPk(req.params.id);
    if (!performer) return res.status(404).json({ error: 'Not found' });
    await performer.update(req.body);
    res.json(performer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const performer = await Performer.findByPk(req.params.id);
    if (!performer) return res.status(404).json({ error: 'Not found' });
    await performer.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Recommend performers
router.post('/ai/recommend', auth, async (req, res) => {
  try {
    const { eventName, eventType, genre, budget, capacity, targetAudience } = req.body;

    const prompt = `As a talent booking expert, recommend performers for this event:

Event: ${eventName}
Type: ${eventType}
Genre Preference: ${genre || 'Open'}
Budget: $${budget || 'Flexible'}
Venue Capacity: ${capacity}
Target Audience: ${targetAudience || 'General'}

Provide detailed booking recommendations including:
1. Ideal performer profile for this event
2. Fee negotiation strategy and typical ranges
3. Contract key terms to include
4. Rider expectations for this caliber of performer
5. Marketing leverage from booking
6. Risk assessment (cancellation history, reliability)
7. Alternative performer suggestions at different price points`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert talent booking agent for live events. Provide strategic, budget-conscious recommendations.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
