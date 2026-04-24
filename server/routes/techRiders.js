const express = require('express');
const { TechRider, Performer, Event } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const riders = await TechRider.findAll({ include: [Performer, Event], order: [['id', 'DESC']] });
    res.json(riders);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const rider = await TechRider.findByPk(req.params.id, { include: [Performer, Event] });
    if (!rider) return res.status(404).json({ error: 'Not found' });
    res.json(rider);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const rider = await TechRider.create(req.body);
    res.status(201).json(rider);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const rider = await TechRider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Not found' });
    await rider.update(req.body);
    res.json(rider);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const rider = await TechRider.findByPk(req.params.id);
    if (!rider) return res.status(404).json({ error: 'Not found' });
    await rider.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Analyze tech rider
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const { performerName, soundRequirements, lightingRequirements, stageRequirements, backlineEquipment, venueCapacity } = req.body;

    const prompt = `As a technical production expert, analyze this tech rider:

Performer: ${performerName}
Venue Capacity: ${venueCapacity || 'Not specified'}

Sound Requirements: ${soundRequirements || 'Not specified'}
Lighting Requirements: ${lightingRequirements || 'Not specified'}
Stage Requirements: ${stageRequirements || 'Not specified'}
Backline Equipment: ${backlineEquipment || 'Not specified'}

Provide detailed analysis including:
1. Feasibility assessment for a standard venue
2. Equipment availability and rental cost estimates
3. Setup time requirements
4. Crew requirements (sound, lighting, stage)
5. Potential issues and solutions
6. Cost optimization recommendations
7. Safety and compliance considerations`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert live event technical director. Provide practical, safety-focused technical production analysis.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
