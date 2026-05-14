require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/ticket-pricing', require('./routes/ticketPricing'));
app.use('/api/seat-assignments', require('./routes/seatAssignments'));
app.use('/api/performers', require('./routes/performers'));
app.use('/api/performer-bookings', require('./routes/performerBookings'));
app.use('/api/tech-riders', require('./routes/techRiders'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database sync and start
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    await sequelize.sync({ force: false });
    console.log('Models synchronized');

    // Create ai_results table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    app.use('/api/dynamic-pricing-optimizer', require('./routes/dynamicPricingOptimizer')); app.use('/api/artist-audience-matcher', require('./routes/artistAudienceMatcher')); app.use('/api/revenue-prediction', require('./routes/revenuePrediction')); app.use('/api/scheduling-optimizer', require('./routes/schedulingOptimizer')); app.use('/api/marketing-campaign-recommender', require('./routes/marketingCampaignRecommender')); app.use('/api/patron-crm', require('./routes/patronCrm'));

// === Batch 08 Gaps & Frontend Mounts ===
app.use('/api/gap-no-ai-dynamic-pricing-based-on-demand', require('./routes/gapNoAiDynamicPricingBasedOnDemand'));
app.use('/api/gap-no-ai-artist-audience-matching', require('./routes/gapNoAiArtistAudienceMatching'));
app.use('/api/gap-no-ai-demand-forecasting', require('./routes/gapNoAiDemandForecasting'));
app.use('/api/gap-no-integrations-with-ticketing-platforms-eventbrite-ticketmaster', require('./routes/gapNoIntegrationsWithTicketingPlatformsEventbriteTicketmaster'));
app.use('/api/gap-no-payment-processing-integration', require('./routes/gapNoPaymentProcessingIntegration'));
app.use('/api/gap-no-marketing-automation', require('./routes/gapNoMarketingAutomation'));
app.use('/api/gap-no-customer-self-service-portal', require('./routes/gapNoCustomerSelfServicePortal'));
app.use('/api/gap-no-webhooks', require('./routes/gapNoWebhooks'));
app.use('/api/gap-no-audit-logging', require('./routes/gapNoAuditLogging'));
app.use('/api/gap-no-notifications-subsystem', require('./routes/gapNoNotificationsSubsystem'));
app.use('/api/gap-no-multi-venue-franchise-chain-management', require('./routes/gapNoMultiVenueFranchiseChainManagement'));

app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Unable to start server:', err.message);
    process.exit(1);
  }
}

start();
