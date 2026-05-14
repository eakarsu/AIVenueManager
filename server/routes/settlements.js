const express = require('express');
const { SettlementReport, Event, PerformerBooking, sequelize } = require('../models');
const auth = require('../middleware/auth');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const { callOpenRouter } = require('../services/openrouter');
const PDFDocument = require('pdfkit');
const router = express.Router();

const paginate = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, parseInt(query.limit) || 20);
  return { limit, offset: (page - 1) * limit, page };
};

router.get('/', auth, async (req, res) => {
  try {
    const { limit, offset, page } = paginate(req.query);
    const { count, rows } = await SettlementReport.findAndCountAll({
      include: [Event], order: [['id', 'DESC']], limit, offset
    });
    res.json({ data: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
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

// AI: Analyze settlement (text)
router.post('/ai/analyze', auth, aiRateLimiter, async (req, res) => {
  try {
    const { id, eventName, totalRevenue, ticketRevenue, concessionRevenue, merchandiseRevenue,
            totalExpenses, performerFees, venueRental, staffCosts, marketingCosts, netProfit } = req.body;
    let report = null;
    if (id) report = await SettlementReport.findByPk(id, { include: [Event] });

    const name = report?.Event?.name || eventName || 'Event';
    const rev = report?.totalRevenue || totalRevenue || 0;
    const exp = report?.totalExpenses || totalExpenses || 0;
    const net = report?.netProfit || netProfit || 0;

    const prompt = `As a financial analyst for live events, analyze this settlement report:
Event: ${name}
Total Revenue: $${rev}, Ticket: $${report?.ticketRevenue || ticketRevenue || 0}, Concessions: $${report?.concessionRevenue || concessionRevenue || 0}, Merch: $${report?.merchandiseRevenue || merchandiseRevenue || 0}
Expenses: $${exp}, Performer: $${report?.performerFees || performerFees || 0}, Venue: $${report?.venueRental || venueRental || 0}, Staff: $${report?.staffCosts || staffCosts || 0}, Marketing: $${report?.marketingCosts || marketingCosts || 0}
Net Profit: $${net}

Provide: 1) Profitability assessment 2) Revenue mix 3) Cost structure 4) Benchmarks 5) Recommendations 6) Risks 7) Future projections`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert entertainment industry financial analyst.');
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'settlements/ai/analyze', JSON.stringify({ id, eventName: name }), JSON.stringify(aiResponse.result)] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI: Narrative summary (structured JSON)
router.post('/:id/ai-narrative', auth, aiRateLimiter, async (req, res) => {
  try {
    const report = await SettlementReport.findByPk(req.params.id, { include: [Event] });
    if (!report) return res.status(404).json({ error: 'Not found' });

    const margin = report.totalRevenue > 0 ? ((report.netProfit / report.totalRevenue) * 100).toFixed(1) : 0;

    const prompt = `Generate a professional settlement narrative. Return valid JSON only.

Event: ${report.Event?.name} on ${report.Event?.date}
Revenue: $${report.totalRevenue} (tickets: $${report.ticketRevenue}, concessions: $${report.concessionRevenue}, merch: $${report.merchandiseRevenue})
Expenses: $${report.totalExpenses} (performer: $${report.performerFees}, venue: $${report.venueRental}, staff: $${report.staffCosts}, marketing: $${report.marketingCosts})
Net Profit: $${report.netProfit} (${margin}% margin)

Return JSON: {"executive_summary":"string","financial_highlights":"string","performer_payment":number,"net_revenue":number,"margin_pct":number,"revenue_breakdown":{"tickets":number,"concessions":number,"merchandise":number},"expense_breakdown":{"performer":number,"venue":number,"staff":number,"marketing":number},"insights":["string"],"recommendations":["string"]}`;

    const aiResponse = await callOpenRouter(prompt, 'You are an expert entertainment industry financial analyst. Return only valid JSON.', true);
    await sequelize.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result) VALUES ($1, $2, $3, $4)`,
      { bind: [req.user.id, 'settlements/ai-narrative', JSON.stringify({ report_id: req.params.id }), JSON.stringify(aiResponse.parsed || {})] }
    );
    res.json(aiResponse);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PDF generation
router.get('/:id/pdf', auth, async (req, res) => {
  try {
    const report = await SettlementReport.findByPk(req.params.id, { include: [Event] });
    if (!report) return res.status(404).json({ error: 'Not found' });

    // Get AI narrative
    let narrative = null;
    try {
      const aiRes = await callOpenRouter(
        `Write a 3-sentence executive summary for this event settlement: ${report.Event?.name}, Revenue $${report.totalRevenue}, Net Profit $${report.netProfit}. Return plain text.`,
        'You are an entertainment financial analyst.'
      );
      narrative = aiRes.result;
    } catch (_) {}

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="settlement-${req.params.id}.pdf"`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('Settlement Report', { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(report.Event?.name || 'Event', { align: 'center' });
    doc.fontSize(11).text(`Date: ${report.Event?.date ? new Date(report.Event.date).toLocaleDateString() : 'N/A'}`, { align: 'center' });
    doc.moveDown(2);

    // Revenue
    doc.fontSize(14).font('Helvetica-Bold').text('Revenue');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Ticket Revenue:        $${Number(report.ticketRevenue || 0).toFixed(2)}`);
    doc.text(`Concession Revenue:    $${Number(report.concessionRevenue || 0).toFixed(2)}`);
    doc.text(`Merchandise Revenue:   $${Number(report.merchandiseRevenue || 0).toFixed(2)}`);
    doc.font('Helvetica-Bold').text(`Total Revenue:         $${Number(report.totalRevenue || 0).toFixed(2)}`);
    doc.moveDown();

    // Expenses
    doc.fontSize(14).text('Expenses');
    doc.fontSize(11).font('Helvetica');
    doc.text(`Performer Fees:        $${Number(report.performerFees || 0).toFixed(2)}`);
    doc.text(`Venue Rental:          $${Number(report.venueRental || 0).toFixed(2)}`);
    doc.text(`Staff Costs:           $${Number(report.staffCosts || 0).toFixed(2)}`);
    doc.text(`Marketing Costs:       $${Number(report.marketingCosts || 0).toFixed(2)}`);
    doc.text(`Misc Expenses:         $${Number(report.miscExpenses || 0).toFixed(2)}`);
    doc.font('Helvetica-Bold').text(`Total Expenses:        $${Number(report.totalExpenses || 0).toFixed(2)}`);
    doc.moveDown();

    // Net
    doc.fontSize(16).font('Helvetica-Bold').text(`Net Profit: $${Number(report.netProfit || 0).toFixed(2)}`);
    doc.moveDown(2);

    // AI Narrative
    if (narrative) {
      doc.fontSize(14).font('Helvetica-Bold').text('AI Executive Summary');
      doc.fontSize(11).font('Helvetica').text(narrative, { width: 500 });
    }

    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
