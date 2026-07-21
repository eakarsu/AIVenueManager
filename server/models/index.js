const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// User Model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('admin', 'manager', 'staff'), defaultValue: 'manager' }
  ,tenantId: { type: DataTypes.STRING, field: 'tenant_id', allowNull: true }
}, { tableName: 'users', timestamps: true });

// Events Model
const Event = sequelize.define('Event', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  venue: { type: DataTypes.STRING, allowNull: false },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('upcoming', 'ongoing', 'completed', 'cancelled'), defaultValue: 'upcoming' },
  description: { type: DataTypes.TEXT },
  expectedAttendance: { type: DataTypes.INTEGER },
  genre: { type: DataTypes.STRING }
}, { tableName: 'events', timestamps: true });

// Ticket Pricing Model
const TicketPricing = sequelize.define('TicketPricing', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  tierName: { type: DataTypes.STRING, allowNull: false },
  basePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currentPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  demandMultiplier: { type: DataTypes.DECIMAL(5, 2), defaultValue: 1.0 },
  totalSeats: { type: DataTypes.INTEGER, allowNull: false },
  soldSeats: { type: DataTypes.INTEGER, defaultValue: 0 },
  minPrice: { type: DataTypes.DECIMAL(10, 2) },
  maxPrice: { type: DataTypes.DECIMAL(10, 2) }
}, { tableName: 'ticket_pricing', timestamps: true });

// Seat Assignment Model
const SeatAssignment = sequelize.define('SeatAssignment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  section: { type: DataTypes.STRING, allowNull: false },
  row: { type: DataTypes.STRING, allowNull: false },
  seatNumber: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('available', 'reserved', 'sold', 'blocked'), defaultValue: 'available' },
  ticketHolder: { type: DataTypes.STRING },
  ticketType: { type: DataTypes.STRING },
  price: { type: DataTypes.DECIMAL(10, 2) },
  accessibilityFeatures: { type: DataTypes.STRING }
}, { tableName: 'seat_assignments', timestamps: true });

// Performer Model
const Performer = sequelize.define('Performer', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  genre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  agent: { type: DataTypes.STRING },
  agentEmail: { type: DataTypes.STRING },
  fee: { type: DataTypes.DECIMAL(10, 2) },
  rating: { type: DataTypes.DECIMAL(3, 1) },
  bio: { type: DataTypes.TEXT },
  status: { type: DataTypes.ENUM('available', 'booked', 'unavailable'), defaultValue: 'available' }
}, { tableName: 'performers', timestamps: true });

// Performer Booking Model
const PerformerBooking = sequelize.define('PerformerBooking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  performerId: { type: DataTypes.INTEGER, allowNull: false },
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  fee: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'confirmed', 'cancelled'), defaultValue: 'pending' },
  contractSigned: { type: DataTypes.BOOLEAN, defaultValue: false },
  performanceTime: { type: DataTypes.STRING },
  setDuration: { type: DataTypes.INTEGER },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'performer_bookings', timestamps: true });

// Tech Rider Model
const TechRider = sequelize.define('TechRider', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  performerId: { type: DataTypes.INTEGER, allowNull: false },
  eventId: { type: DataTypes.INTEGER },
  soundRequirements: { type: DataTypes.TEXT },
  lightingRequirements: { type: DataTypes.TEXT },
  stageRequirements: { type: DataTypes.TEXT },
  backlineEquipment: { type: DataTypes.TEXT },
  monitorMix: { type: DataTypes.TEXT },
  specialRequests: { type: DataTypes.TEXT },
  hospitalityRequirements: { type: DataTypes.TEXT },
  loadInTime: { type: DataTypes.STRING },
  soundCheckTime: { type: DataTypes.STRING },
  status: { type: DataTypes.ENUM('draft', 'submitted', 'approved', 'fulfilled'), defaultValue: 'draft' }
}, { tableName: 'tech_riders', timestamps: true });

// Settlement Report Model
const SettlementReport = sequelize.define('SettlementReport', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventId: { type: DataTypes.INTEGER, allowNull: false },
  totalRevenue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  ticketRevenue: { type: DataTypes.DECIMAL(12, 2) },
  concessionRevenue: { type: DataTypes.DECIMAL(12, 2) },
  merchandiseRevenue: { type: DataTypes.DECIMAL(12, 2) },
  totalExpenses: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  performerFees: { type: DataTypes.DECIMAL(12, 2) },
  venueRental: { type: DataTypes.DECIMAL(12, 2) },
  staffCosts: { type: DataTypes.DECIMAL(12, 2) },
  marketingCosts: { type: DataTypes.DECIMAL(12, 2) },
  miscExpenses: { type: DataTypes.DECIMAL(12, 2) },
  netProfit: { type: DataTypes.DECIMAL(12, 2) },
  status: { type: DataTypes.ENUM('draft', 'pending', 'finalized'), defaultValue: 'draft' },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'settlement_reports', timestamps: true });

// Venue Model
const Venue = sequelize.define('Venue', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  address: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  capacity: { type: DataTypes.INTEGER },
  type: { type: DataTypes.STRING },
  amenities: { type: DataTypes.TEXT },
  contactPerson: { type: DataTypes.STRING },
  contactEmail: { type: DataTypes.STRING },
  contactPhone: { type: DataTypes.STRING },
  hourlyRate: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM('active', 'maintenance', 'inactive'), defaultValue: 'active' }
}, { tableName: 'venues', timestamps: true });

// Associations
Event.hasMany(TicketPricing, { foreignKey: 'eventId' });
TicketPricing.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(SeatAssignment, { foreignKey: 'eventId' });
SeatAssignment.belongsTo(Event, { foreignKey: 'eventId' });

Performer.hasMany(PerformerBooking, { foreignKey: 'performerId' });
PerformerBooking.belongsTo(Performer, { foreignKey: 'performerId' });

Event.hasMany(PerformerBooking, { foreignKey: 'eventId' });
PerformerBooking.belongsTo(Event, { foreignKey: 'eventId' });

Performer.hasMany(TechRider, { foreignKey: 'performerId' });
TechRider.belongsTo(Performer, { foreignKey: 'performerId' });

Event.hasMany(TechRider, { foreignKey: 'eventId' });
TechRider.belongsTo(Event, { foreignKey: 'eventId' });

Event.hasMany(SettlementReport, { foreignKey: 'eventId' });
SettlementReport.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = {
  sequelize,
  User,
  Event,
  TicketPricing,
  SeatAssignment,
  Performer,
  PerformerBooking,
  TechRider,
  SettlementReport,
  Venue
};
