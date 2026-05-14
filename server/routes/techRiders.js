const express = require('express');
const { TechRider, Performer, Event, Venue, sequelize } = require('../models');
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
    const { count, rows } = await TechRider.findAndCountAll({
      include: [Performer, Event], order: [['id', 'DESC']], limit, offset
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
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

// AI: Analyze tech rider (text)
router.post('/ai/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { id, performerName, soundRequirements, lightingRequirements, stageRequirements, backlineEquipment, venueCapacity } = req.body;
    let rider = null;
    if (id) rider = await TechRider.findByPk(id, { include: [Performer, Event] });

    const pName = rider?.Performer?.name || performerName || 'Unknown';
    const sound = rider?.soundRequirements || soundRequirements || 'Not specified';
    const lighting = rider?.lightingRequirements || lightingRequirements || 'Not specified';
    const stage = rider?.stageRequirements || stageRequirements || 'Not specified';
    const backline = rider?.backlineEquipment || backlineEquipment || 'Not specified';
    const capacity = rider?.Event?.capacity || venueCapacity || 'Not specified';

    const prompt = `As a technical production expert, analyze this tech rider:
Performer: ${pName}, Venue Capacity: ${capacity}
Sound: ${sound}
Lighting: ${lighting}
Stage: ${stage}
Backline: ${backline}

Provide: 1) Feasibility 2) Equipment costs 3) Setup time 4) Crew needed 5) Issues 6) Cost optimization 7) Safety`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert live event technical director.');
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'tech-riders/ai/analyze', JSON.stringify({ id, performerName: pName }), JSON.stringify(aiResponse.result)] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Feasibility check (structured JSON)
router.post('/:id/feasibility-check', auth, aiRateLimiter, async (req, res) => {
  try {
    const rider = await TechRider.findByPk(req.params.id, { include: [Performer, Event] });
    if (!rider) return res.status(404).json({ error: 'Not found' });

    let venueInfo = 'Standard venue with basic PA, 12-light rig, 24x16 stage';
    if (rider.Event?.venue) {
      const venues = await Venue.findAll({ where: { name: rider.Event.venue }, limit: 1 });
      if (venues[0]) venueInfo = `${venues[0].name}: capacity ${venues[0].capacity}, amenities: ${venues[0].amenities || 'standard'}`;
    }

    const prompt = `Venue technical director checking tech rider feasibility. Return valid JSON only.

Performer: ${rider.Performer?.name}, Event: ${rider.Event?.name}
Venue: ${venueInfo}
Sound: ${rider.soundRequirements || 'Standard PA'}
Lighting: ${rider.lightingRequirements || 'Standard rig'}
Stage: ${rider.stageRequirements || 'Standard stage'}
Backline: ${rider.backlineEquipment || 'None'}
Special: ${rider.specialRequests || 'None'}

Return JSON: {"feasible":boolean,"missing_items":[{"item":"string","rental_cost":number,"availability":"in_stock|rental|special_order"}],"total_procurement_cost":number,"setup_hours":number,"crew_needed":{"sound":number,"lighting":number,"stage":number},"recommendations":["string"],"risk_level":"low|medium|high"}`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert live event technical director. Return only valid JSON.', true);
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'tech-riders/feasibility-check', JSON.stringify({ rider_id: req.params.id }), JSON.stringify(aiResponse.parsed || {})] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
