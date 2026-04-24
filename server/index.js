require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// Middleware
app.use(cors());
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database sync and start
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    await sequelize.sync({ alter: true });
    console.log('✅ Models synchronized');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Unable to start server:', err.message);
    process.exit(1);
  }
}

start();
