const express = require('express');
const { SettlementReport, Event } = require('../models');
const auth = require('../middleware/auth');
const { callOpenRouter } = require('../services/openrouter');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const reports = await SettlementReport.findAll({ include: [Event], order: [['id', 'DESC']] });
    res.json(reports);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const report = await SettlementReport.findByPk(req.params.id, { include: [Event] });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const report = await SettlementReport.create(req.body);
    res.status(201).json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const report = await SettlementReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    await report.update(req.body);
    res.json(report);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await SettlementReport.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    await report.destroy();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Analyze settlement
router.post('/ai/analyze', auth, async (req, res) => {
  try {
    const { eventName, totalRevenue, ticketRevenue, concessionRevenue, merchandiseRevenue,
            totalExpenses, performerFees, venueRental, staffCosts, marketingCosts, netProfit } = req.body;

    const prompt = `As a financial analyst for live events, analyze this settlement report:

Event: ${eventName}

REVENUE:
- Total Revenue: $${totalRevenue}
- Ticket Revenue: $${ticketRevenue || 0}
- Concession Revenue: $${concessionRevenue || 0}
- Merchandise Revenue: $${merchandiseRevenue || 0}

EXPENSES:
- Total Expenses: $${totalExpenses}
- Performer Fees: $${performerFees || 0}
- Venue Rental: $${venueRental || 0}
- Staff Costs: $${staffCosts || 0}
- Marketing Costs: $${marketingCosts || 0}

NET PROFIT: $${netProfit}

Provide comprehensive financial analysis including:
1. Profitability assessment and margin analysis
2. Revenue mix evaluation
3. Cost structure analysis
4. Comparison with industry benchmarks
5. Specific recommendations to improve profitability
6. Risk factors and financial health indicators
7. Projections for similar future events`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert entertainment industry financial analyst. Provide data-driven financial insights and actionable recommendations.');
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
