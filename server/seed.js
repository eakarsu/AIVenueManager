require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize, User, Event, TicketPricing, SeatAssignment, Performer, PerformerBooking, TechRider, SettlementReport, Venue } = require('./models');

if(process.env.ALLOW_DESTRUCTIVE_DEMO_SEED!=='true'){console.error('Refusing destructive demo seed; set ALLOW_DESTRUCTIVE_DEMO_SEED=true only for an isolated disposable database.');process.exit(2);}
async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected for seeding');
    await sequelize.sync({ force: true });
    console.log('✅ Tables recreated');

    // Users
    const adminEmail = process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
    const tenantId = process.env.SEED_TENANT_ID || process.env.TENANT_ID;
    if (!adminEmail || !adminPassword || !tenantId) {
      throw new Error('SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, and SEED_TENANT_ID are required');
    }
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await User.bulkCreate([
      { name: process.env.BOOTSTRAP_ADMIN_NAME || 'Admin User', email: adminEmail, password: hashedPassword, role: 'admin', tenantId },
      { name: 'Sarah Manager', email: 'sarah@venue.invalid', password: hashedPassword, role: 'manager', tenantId },
      { name: 'Mike Staff', email: 'mike@venue.invalid', password: hashedPassword, role: 'staff', tenantId }
    ]);
    console.log('✅ Users seeded');

    // Venues (15 items)
    const venues = await Venue.bulkCreate([
      { name: 'The Grand Arena', address: '100 Main St', city: 'New York', capacity: 5000, type: 'Arena', amenities: 'VIP Boxes, Green Rooms, Full Bar, Parking', contactPerson: 'John Smith', contactEmail: 'john@grandarena.com', contactPhone: '212-555-0100', hourlyRate: 2500, status: 'active' },
      { name: 'Blue Note Jazz Club', address: '131 W 3rd St', city: 'New York', capacity: 300, type: 'Club', amenities: 'Full Bar, Dinner Service, Sound System', contactPerson: 'Lisa Wong', contactEmail: 'lisa@bluenote.com', contactPhone: '212-555-0200', hourlyRate: 800, status: 'active' },
      { name: 'Sunset Amphitheater', address: '456 Beach Blvd', city: 'Los Angeles', capacity: 8000, type: 'Outdoor', amenities: 'VIP Area, Food Courts, Parking, Lawn Seating', contactPerson: 'Carlos Rivera', contactEmail: 'carlos@sunsetamp.com', contactPhone: '310-555-0300', hourlyRate: 5000, status: 'active' },
      { name: 'The Velvet Room', address: '789 Oak Ave', city: 'Chicago', capacity: 500, type: 'Lounge', amenities: 'Full Bar, VIP Booths, Sound System, Lighting Rig', contactPerson: 'Maria Johnson', contactEmail: 'maria@velvetroom.com', contactPhone: '312-555-0400', hourlyRate: 600, status: 'active' },
      { name: 'Metro Convention Center', address: '321 Congress Ave', city: 'Austin', capacity: 12000, type: 'Convention Center', amenities: 'Multiple Halls, Catering, AV Equipment, WiFi', contactPerson: 'Dave Wilson', contactEmail: 'dave@metrocc.com', contactPhone: '512-555-0500', hourlyRate: 8000, status: 'active' },
      { name: 'The Basement', address: '55 Underground Ln', city: 'Nashville', capacity: 200, type: 'Club', amenities: 'Bar, Small Stage, PA System', contactPerson: 'Amy Taylor', contactEmail: 'amy@basement.com', contactPhone: '615-555-0600', hourlyRate: 400, status: 'active' },
      { name: 'Riverside Pavilion', address: '888 River Rd', city: 'Portland', capacity: 3000, type: 'Outdoor', amenities: 'Covered Stage, Food Vendors, Parking', contactPerson: 'Tom Green', contactEmail: 'tom@riverside.com', contactPhone: '503-555-0700', hourlyRate: 2000, status: 'active' },
      { name: 'Crystal Ballroom', address: '1332 Burnside', city: 'Portland', capacity: 1500, type: 'Ballroom', amenities: 'Historic Venue, Balcony, Full Bar, Dance Floor', contactPerson: 'Rebecca Stone', contactEmail: 'rebecca@crystal.com', contactPhone: '503-555-0800', hourlyRate: 1200, status: 'active' },
      { name: 'The Fox Theater', address: '660 Peachtree St', city: 'Atlanta', capacity: 4600, type: 'Theater', amenities: 'Orchestra Pit, Balcony, Box Seats, Historic', contactPerson: 'James Brown', contactEmail: 'james@foxtheater.com', contactPhone: '404-555-0900', hourlyRate: 3500, status: 'active' },
      { name: 'Electric Factory', address: '421 N 7th St', city: 'Philadelphia', capacity: 2500, type: 'Warehouse', amenities: 'Industrial Space, Full Bar, Mezzanine', contactPerson: 'Kate Miller', contactEmail: 'kate@electric.com', contactPhone: '215-555-1000', hourlyRate: 1800, status: 'active' },
      { name: 'Rooftop Gardens', address: '900 Sky High Dr', city: 'Miami', capacity: 600, type: 'Rooftop', amenities: 'Open Air, Bar, City Views, Lounge Area', contactPerson: 'Diego Santos', contactEmail: 'diego@rooftop.com', contactPhone: '305-555-1100', hourlyRate: 1500, status: 'active' },
      { name: 'Symphony Hall', address: '301 Massachusetts Ave', city: 'Boston', capacity: 2600, type: 'Concert Hall', amenities: 'World-class Acoustics, Orchestra Seating, Box Seats', contactPerson: 'Eleanor Hughes', contactEmail: 'eleanor@symphony.com', contactPhone: '617-555-1200', hourlyRate: 4000, status: 'active' },
      { name: 'The Warehouse', address: '200 Industrial Way', city: 'Denver', capacity: 1800, type: 'Warehouse', amenities: 'Raw Space, High Ceilings, Loading Dock', contactPerson: 'Mark Denver', contactEmail: 'mark@warehouse.com', contactPhone: '303-555-1300', hourlyRate: 1000, status: 'maintenance' },
      { name: 'Starlight Drive-In', address: '5500 Highway 66', city: 'Tulsa', capacity: 2000, type: 'Outdoor', amenities: 'Drive-in Format, Large Screen, Concessions', contactPerson: 'Billy Ray', contactEmail: 'billy@starlight.com', contactPhone: '918-555-1400', hourlyRate: 900, status: 'active' },
      { name: 'Jazz Corner', address: '44 Music Row', city: 'Nashville', capacity: 150, type: 'Club', amenities: 'Intimate Setting, Piano, Full Bar', contactPerson: 'Nina Simmons', contactEmail: 'nina@jazzcorner.com', contactPhone: '615-555-1500', hourlyRate: 350, status: 'active' }
    ]);
    console.log('✅ Venues seeded (15)');

    // Events (18 items)
    const events = await Event.bulkCreate([
      { name: 'Summer Rock Festival', type: 'Concert', date: '2026-06-15', venue: 'Sunset Amphitheater', capacity: 8000, status: 'upcoming', description: 'Annual summer rock music festival featuring top bands', expectedAttendance: 7500, genre: 'Rock' },
      { name: 'Jazz Night Series', type: 'Concert', date: '2026-04-20', venue: 'Blue Note Jazz Club', capacity: 300, status: 'upcoming', description: 'Weekly jazz performance series', expectedAttendance: 280, genre: 'Jazz' },
      { name: 'EDM Warehouse Party', type: 'Concert', date: '2026-05-10', venue: 'Electric Factory', capacity: 2500, status: 'upcoming', description: 'Electronic dance music warehouse event', expectedAttendance: 2200, genre: 'Electronic' },
      { name: 'Country Music Awards Night', type: 'Awards', date: '2026-07-04', venue: 'The Fox Theater', capacity: 4600, status: 'upcoming', description: 'Annual country music awards ceremony', expectedAttendance: 4500, genre: 'Country' },
      { name: 'Classical Evening Gala', type: 'Concert', date: '2026-04-05', venue: 'Symphony Hall', capacity: 2600, status: 'upcoming', description: 'Evening of classical masterpieces', expectedAttendance: 2400, genre: 'Classical' },
      { name: 'Hip Hop Block Party', type: 'Festival', date: '2026-08-20', venue: 'Riverside Pavilion', capacity: 3000, status: 'upcoming', description: 'Urban music and culture festival', expectedAttendance: 2800, genre: 'Hip Hop' },
      { name: 'Indie Band Showcase', type: 'Concert', date: '2026-04-12', venue: 'The Basement', capacity: 200, status: 'upcoming', description: 'Showcase of emerging indie artists', expectedAttendance: 180, genre: 'Indie' },
      { name: 'Rooftop Sunset Sessions', type: 'Concert', date: '2026-05-25', venue: 'Rooftop Gardens', capacity: 600, status: 'upcoming', description: 'Chill sunset DJ and live music sessions', expectedAttendance: 500, genre: 'Chill/Lounge' },
      { name: 'Tech Conference After Party', type: 'Private Event', date: '2026-09-15', venue: 'The Velvet Room', capacity: 500, status: 'upcoming', description: 'Exclusive post-conference networking event', expectedAttendance: 450, genre: 'Mixed' },
      { name: 'New Years Eve Extravaganza', type: 'Gala', date: '2026-12-31', venue: 'Crystal Ballroom', capacity: 1500, status: 'upcoming', description: 'Black tie New Year celebration', expectedAttendance: 1500, genre: 'Mixed' },
      { name: 'Spring Jazz Brunch', type: 'Brunch', date: '2026-04-26', venue: 'Jazz Corner', capacity: 150, status: 'upcoming', description: 'Live jazz accompanied by gourmet brunch', expectedAttendance: 140, genre: 'Jazz' },
      { name: 'Metal Mayhem Night', type: 'Concert', date: '2026-06-28', venue: 'The Warehouse', capacity: 1800, status: 'upcoming', description: 'Heavy metal concert featuring 5 bands', expectedAttendance: 1600, genre: 'Metal' },
      { name: 'Drive-In Movie Concert', type: 'Hybrid', date: '2026-07-20', venue: 'Starlight Drive-In', capacity: 2000, status: 'upcoming', description: 'Film screening followed by live concert', expectedAttendance: 1800, genre: 'Mixed' },
      { name: 'Corporate Gala Dinner', type: 'Corporate', date: '2026-10-10', venue: 'The Grand Arena', capacity: 2000, status: 'upcoming', description: 'Annual corporate fundraiser gala', expectedAttendance: 1800, genre: 'N/A' },
      { name: 'Blues & BBQ Festival', type: 'Festival', date: '2026-08-15', venue: 'Riverside Pavilion', capacity: 3000, status: 'upcoming', description: 'Live blues music and BBQ food festival', expectedAttendance: 2700, genre: 'Blues' },
      { name: 'Acoustic Unplugged Night', type: 'Concert', date: '2026-05-03', venue: 'The Basement', capacity: 200, status: 'upcoming', description: 'Intimate acoustic performances', expectedAttendance: 190, genre: 'Acoustic' },
      { name: 'Latin Dance Night', type: 'Dance', date: '2026-06-05', venue: 'Crystal Ballroom', capacity: 1500, status: 'upcoming', description: 'Salsa, bachata, and merengue with live band', expectedAttendance: 1200, genre: 'Latin' },
      { name: 'Punk Rock Revival', type: 'Concert', date: '2026-09-22', venue: 'Electric Factory', capacity: 2500, status: 'upcoming', description: 'Classic and modern punk rock showcase', expectedAttendance: 2100, genre: 'Punk' }
    ]);
    console.log('✅ Events seeded (18)');

    // Ticket Pricing (18 items)
    await TicketPricing.bulkCreate([
      { eventId: 1, tierName: 'General Admission', basePrice: 75, currentPrice: 85, demandMultiplier: 1.13, totalSeats: 5000, soldSeats: 3200, minPrice: 60, maxPrice: 120 },
      { eventId: 1, tierName: 'VIP Pit', basePrice: 200, currentPrice: 250, demandMultiplier: 1.25, totalSeats: 500, soldSeats: 420, minPrice: 180, maxPrice: 350 },
      { eventId: 1, tierName: 'Lawn', basePrice: 45, currentPrice: 45, demandMultiplier: 1.0, totalSeats: 2500, soldSeats: 800, minPrice: 35, maxPrice: 65 },
      { eventId: 2, tierName: 'Table Seating', basePrice: 50, currentPrice: 55, demandMultiplier: 1.1, totalSeats: 200, soldSeats: 180, minPrice: 40, maxPrice: 75 },
      { eventId: 2, tierName: 'Bar Seating', basePrice: 35, currentPrice: 35, demandMultiplier: 1.0, totalSeats: 100, soldSeats: 60, minPrice: 25, maxPrice: 50 },
      { eventId: 3, tierName: 'Early Bird', basePrice: 40, currentPrice: 40, demandMultiplier: 1.0, totalSeats: 500, soldSeats: 500, minPrice: 35, maxPrice: 40 },
      { eventId: 3, tierName: 'General', basePrice: 65, currentPrice: 70, demandMultiplier: 1.08, totalSeats: 1500, soldSeats: 1100, minPrice: 55, maxPrice: 90 },
      { eventId: 3, tierName: 'VIP Lounge', basePrice: 150, currentPrice: 175, demandMultiplier: 1.17, totalSeats: 500, soldSeats: 380, minPrice: 130, maxPrice: 200 },
      { eventId: 4, tierName: 'Orchestra', basePrice: 150, currentPrice: 165, demandMultiplier: 1.1, totalSeats: 2000, soldSeats: 1800, minPrice: 120, maxPrice: 200 },
      { eventId: 4, tierName: 'Balcony', basePrice: 100, currentPrice: 100, demandMultiplier: 1.0, totalSeats: 1500, soldSeats: 900, minPrice: 80, maxPrice: 130 },
      { eventId: 4, tierName: 'Box Seats', basePrice: 300, currentPrice: 350, demandMultiplier: 1.17, totalSeats: 200, soldSeats: 190, minPrice: 250, maxPrice: 400 },
      { eventId: 5, tierName: 'Premium', basePrice: 120, currentPrice: 130, demandMultiplier: 1.08, totalSeats: 800, soldSeats: 650, minPrice: 100, maxPrice: 160 },
      { eventId: 5, tierName: 'Standard', basePrice: 75, currentPrice: 75, demandMultiplier: 1.0, totalSeats: 1800, soldSeats: 1200, minPrice: 60, maxPrice: 95 },
      { eventId: 6, tierName: 'General Admission', basePrice: 55, currentPrice: 60, demandMultiplier: 1.09, totalSeats: 2500, soldSeats: 1800, minPrice: 45, maxPrice: 80 },
      { eventId: 6, tierName: 'VIP', basePrice: 120, currentPrice: 140, demandMultiplier: 1.17, totalSeats: 500, soldSeats: 420, minPrice: 100, maxPrice: 180 },
      { eventId: 7, tierName: 'Door Entry', basePrice: 15, currentPrice: 15, demandMultiplier: 1.0, totalSeats: 200, soldSeats: 120, minPrice: 10, maxPrice: 25 },
      { eventId: 8, tierName: 'Standard', basePrice: 85, currentPrice: 90, demandMultiplier: 1.06, totalSeats: 400, soldSeats: 280, minPrice: 70, maxPrice: 110 },
      { eventId: 8, tierName: 'VIP Cabana', basePrice: 250, currentPrice: 280, demandMultiplier: 1.12, totalSeats: 200, soldSeats: 150, minPrice: 200, maxPrice: 350 }
    ]);
    console.log('✅ Ticket Pricing seeded (18)');

    // Performers (16 items)
    const performers = await Performer.bulkCreate([
      { name: 'The Rolling Thunder', genre: 'Rock', email: 'thunder@music.com', phone: '555-0101', agent: 'Rick Stone', agentEmail: 'rick@talentmgmt.com', fee: 25000, rating: 4.8, bio: 'High-energy rock band with 15 years of touring experience', status: 'available' },
      { name: 'Sarah Blues', genre: 'Jazz', email: 'sarah@jazz.com', phone: '555-0102', agent: 'Mike Webb', agentEmail: 'mike@jazzagency.com', fee: 5000, rating: 4.9, bio: 'Award-winning jazz vocalist and pianist', status: 'available' },
      { name: 'DJ Neon', genre: 'Electronic', email: 'neon@djneon.com', phone: '555-0103', agent: 'Sam Digital', agentEmail: 'sam@edmagency.com', fee: 15000, rating: 4.6, bio: 'Top EDM DJ known for immersive visual shows', status: 'booked' },
      { name: 'Dusty Roads', genre: 'Country', email: 'dusty@country.com', phone: '555-0104', agent: 'Patty Nashville', agentEmail: 'patty@nashvilletalent.com', fee: 35000, rating: 4.7, bio: 'Country music superstar with 3 platinum albums', status: 'available' },
      { name: 'Orchestra Virtuoso Ensemble', genre: 'Classical', email: 'ove@classical.com', phone: '555-0105', agent: 'Helena Strauss', agentEmail: 'helena@classicalarts.com', fee: 20000, rating: 5.0, bio: '30-piece orchestra specializing in romantic era compositions', status: 'available' },
      { name: 'MC Flow', genre: 'Hip Hop', email: 'flow@hiphop.com', phone: '555-0106', agent: 'Big T', agentEmail: 'bigt@urbantalent.com', fee: 18000, rating: 4.5, bio: 'Conscious hip hop artist with massive festival following', status: 'available' },
      { name: 'The Whiskey Cats', genre: 'Indie', email: 'cats@indie.com', phone: '555-0107', agent: 'Self-managed', agentEmail: 'cats@indie.com', fee: 3000, rating: 4.3, bio: 'Emerging indie band with strong local following', status: 'available' },
      { name: 'Luna Sunset', genre: 'Chill/Lounge', email: 'luna@sunset.com', phone: '555-0108', agent: 'Zen Agency', agentEmail: 'zen@agency.com', fee: 8000, rating: 4.7, bio: 'Ambient/chill musician perfect for sunset sessions', status: 'available' },
      { name: 'Iron Forge', genre: 'Metal', email: 'forge@metal.com', phone: '555-0109', agent: 'Heavy Mgmt', agentEmail: 'heavy@mgmt.com', fee: 12000, rating: 4.4, bio: 'Thrash metal band known for explosive live shows', status: 'available' },
      { name: 'Bobby Blues King', genre: 'Blues', email: 'bobby@blues.com', phone: '555-0110', agent: 'Delta Agency', agentEmail: 'delta@blues.com', fee: 7000, rating: 4.8, bio: 'Legendary blues guitarist and vocalist', status: 'available' },
      { name: 'Acoustic Dreams', genre: 'Acoustic', email: 'dreams@acoustic.com', phone: '555-0111', agent: 'Self-managed', agentEmail: 'dreams@acoustic.com', fee: 2500, rating: 4.6, bio: 'Singer-songwriter duo with hauntingly beautiful harmonies', status: 'available' },
      { name: 'Fuego Latino', genre: 'Latin', email: 'fuego@latin.com', phone: '555-0112', agent: 'Ritmo Agency', agentEmail: 'ritmo@agency.com', fee: 10000, rating: 4.7, bio: '8-piece Latin band specializing in salsa and bachata', status: 'available' },
      { name: 'Rage Circuit', genre: 'Punk', email: 'rage@punk.com', phone: '555-0113', agent: 'DIY Booking', agentEmail: 'diy@punk.com', fee: 5000, rating: 4.2, bio: 'Fast, loud, and unapologetic punk rock', status: 'available' },
      { name: 'The Velvet Tones', genre: 'R&B', email: 'velvet@rnb.com', phone: '555-0114', agent: 'Smooth Talent', agentEmail: 'smooth@talent.com', fee: 9000, rating: 4.5, bio: 'Silky R&B group with stunning vocal arrangements', status: 'available' },
      { name: 'Cosmic Noise', genre: 'Electronic', email: 'cosmic@noise.com', phone: '555-0115', agent: 'Sam Digital', agentEmail: 'sam@edmagency.com', fee: 11000, rating: 4.4, bio: 'Progressive electronic music with live instruments', status: 'available' },
      { name: 'Prairie Winds', genre: 'Folk', email: 'prairie@folk.com', phone: '555-0116', agent: 'Roots Agency', agentEmail: 'roots@agency.com', fee: 4000, rating: 4.6, bio: 'Americana folk ensemble with fiddle and banjo', status: 'available' }
    ]);
    console.log('✅ Performers seeded (16)');

    // Performer Bookings (16 items)
    await PerformerBooking.bulkCreate([
      { performerId: 1, eventId: 1, fee: 25000, status: 'confirmed', contractSigned: true, performanceTime: '20:00', setDuration: 120, notes: 'Headliner - full stage production' },
      { performerId: 2, eventId: 2, fee: 5000, status: 'confirmed', contractSigned: true, performanceTime: '19:30', setDuration: 90, notes: 'Solo jazz set with house band backup' },
      { performerId: 3, eventId: 3, fee: 15000, status: 'confirmed', contractSigned: true, performanceTime: '22:00', setDuration: 180, notes: 'Headliner DJ set with visual production' },
      { performerId: 4, eventId: 4, fee: 35000, status: 'confirmed', contractSigned: true, performanceTime: '21:00', setDuration: 90, notes: 'Award show performer and presenter' },
      { performerId: 5, eventId: 5, fee: 20000, status: 'confirmed', contractSigned: true, performanceTime: '19:00', setDuration: 120, notes: 'Full orchestra performance' },
      { performerId: 6, eventId: 6, fee: 18000, status: 'confirmed', contractSigned: false, performanceTime: '20:30', setDuration: 75, notes: 'Headliner with DJ support' },
      { performerId: 7, eventId: 7, fee: 3000, status: 'confirmed', contractSigned: true, performanceTime: '21:00', setDuration: 60, notes: 'Headliner for indie showcase' },
      { performerId: 8, eventId: 8, fee: 8000, status: 'pending', contractSigned: false, performanceTime: '18:00', setDuration: 120, notes: 'Sunset session performance' },
      { performerId: 9, eventId: 12, fee: 12000, status: 'confirmed', contractSigned: true, performanceTime: '22:00', setDuration: 90, notes: 'Main stage headliner' },
      { performerId: 10, eventId: 15, fee: 7000, status: 'confirmed', contractSigned: true, performanceTime: '19:00', setDuration: 90, notes: 'Blues festival headliner' },
      { performerId: 11, eventId: 16, fee: 2500, status: 'confirmed', contractSigned: true, performanceTime: '20:00', setDuration: 75, notes: 'Intimate acoustic set' },
      { performerId: 12, eventId: 17, fee: 10000, status: 'confirmed', contractSigned: true, performanceTime: '21:00', setDuration: 120, notes: 'Full Latin dance band set' },
      { performerId: 13, eventId: 18, fee: 5000, status: 'pending', contractSigned: false, performanceTime: '21:30', setDuration: 60, notes: 'Opening for punk showcase' },
      { performerId: 14, eventId: 10, fee: 9000, status: 'confirmed', contractSigned: true, performanceTime: '23:00', setDuration: 60, notes: 'NYE midnight performer' },
      { performerId: 15, eventId: 3, fee: 11000, status: 'confirmed', contractSigned: true, performanceTime: '19:00', setDuration: 120, notes: 'Opening set with live synth' },
      { performerId: 16, eventId: 11, fee: 4000, status: 'pending', contractSigned: false, performanceTime: '11:00', setDuration: 90, notes: 'Jazz brunch background music' }
    ]);
    console.log('✅ Performer Bookings seeded (16)');

    // Seat Assignments (18 items)
    await SeatAssignment.bulkCreate([
      { eventId: 1, section: 'Floor', row: 'A', seatNumber: '1-50', status: 'sold', ticketHolder: 'Various', ticketType: 'VIP Pit', price: 250, accessibilityFeatures: null },
      { eventId: 1, section: 'Floor', row: 'B', seatNumber: '1-50', status: 'sold', ticketHolder: 'Various', ticketType: 'VIP Pit', price: 250, accessibilityFeatures: null },
      { eventId: 1, section: 'GA', row: 'Standing', seatNumber: 'GA-001 to GA-5000', status: 'available', ticketHolder: null, ticketType: 'General Admission', price: 85, accessibilityFeatures: null },
      { eventId: 2, section: 'Main Floor', row: '1', seatNumber: '1-20', status: 'sold', ticketHolder: 'Various', ticketType: 'Table Seating', price: 55, accessibilityFeatures: null },
      { eventId: 2, section: 'Main Floor', row: '2', seatNumber: '1-20', status: 'reserved', ticketHolder: 'Corporate Group', ticketType: 'Table Seating', price: 55, accessibilityFeatures: null },
      { eventId: 2, section: 'Bar', row: 'Bar', seatNumber: '1-15', status: 'available', ticketHolder: null, ticketType: 'Bar Seating', price: 35, accessibilityFeatures: null },
      { eventId: 4, section: 'Orchestra', row: 'A', seatNumber: '1-40', status: 'sold', ticketHolder: 'Various', ticketType: 'Orchestra', price: 165, accessibilityFeatures: 'Wheelchair accessible aisle seats' },
      { eventId: 4, section: 'Orchestra', row: 'B', seatNumber: '1-40', status: 'sold', ticketHolder: 'Various', ticketType: 'Orchestra', price: 165, accessibilityFeatures: null },
      { eventId: 4, section: 'Balcony', row: 'AA', seatNumber: '1-50', status: 'reserved', ticketHolder: null, ticketType: 'Balcony', price: 100, accessibilityFeatures: 'Elevator access' },
      { eventId: 4, section: 'Box', row: 'Box 1', seatNumber: '1-8', status: 'sold', ticketHolder: 'VIP Guest', ticketType: 'Box Seats', price: 350, accessibilityFeatures: 'Private entrance' },
      { eventId: 5, section: 'Front', row: 'A', seatNumber: '1-30', status: 'sold', ticketHolder: 'Season ticket holders', ticketType: 'Premium', price: 130, accessibilityFeatures: null },
      { eventId: 5, section: 'Center', row: 'F', seatNumber: '1-40', status: 'available', ticketHolder: null, ticketType: 'Standard', price: 75, accessibilityFeatures: null },
      { eventId: 5, section: 'Rear', row: 'M', seatNumber: '1-50', status: 'available', ticketHolder: null, ticketType: 'Standard', price: 75, accessibilityFeatures: 'Hearing loop available' },
      { eventId: 10, section: 'Dance Floor', row: 'Standing', seatNumber: 'DF-001 to DF-800', status: 'available', ticketHolder: null, ticketType: 'General', price: 150, accessibilityFeatures: null },
      { eventId: 10, section: 'VIP Lounge', row: 'VIP', seatNumber: 'VIP-1 to VIP-50', status: 'reserved', ticketHolder: 'Various', ticketType: 'VIP', price: 500, accessibilityFeatures: null },
      { eventId: 10, section: 'Balcony', row: '1', seatNumber: '1-30', status: 'available', ticketHolder: null, ticketType: 'Balcony', price: 200, accessibilityFeatures: 'Elevator access' },
      { eventId: 6, section: 'GA', row: 'Standing', seatNumber: 'GA-001 to GA-2500', status: 'available', ticketHolder: null, ticketType: 'General Admission', price: 60, accessibilityFeatures: 'ADA viewing platform' },
      { eventId: 6, section: 'VIP', row: 'VIP', seatNumber: 'VIP-1 to VIP-500', status: 'reserved', ticketHolder: 'Various', ticketType: 'VIP', price: 140, accessibilityFeatures: null }
    ]);
    console.log('✅ Seat Assignments seeded (18)');

    // Tech Riders (16 items)
    await TechRider.bulkCreate([
      { performerId: 1, eventId: 1, soundRequirements: '32-channel FOH, 16 monitor mixes, full PA system 100dB+', lightingRequirements: '24 moving heads, LED wash, 4 follow spots, haze machine', stageRequirements: '40x30ft stage, drum riser 8x8, keyboard riser', backlineEquipment: 'Full backline: amps, drums, keys', monitorMix: '6 stereo IEM packs, 4 wedge monitors', specialRequests: 'Private tuning room, guitar tech required', hospitalityRequirements: '6 dressing rooms, catering for 12', loadInTime: '08:00', soundCheckTime: '15:00', status: 'approved' },
      { performerId: 2, eventId: 2, soundRequirements: 'Steinway grand piano, 2 vocal mics, DI for bass', lightingRequirements: 'Warm stage wash, spotlight on piano', stageRequirements: '16x12ft minimum, piano center stage', backlineEquipment: 'Grand piano, upright bass amp', monitorMix: '2 floor monitors', specialRequests: 'Piano must be tuned day of show', hospitalityRequirements: 'Green room with tea and honey', loadInTime: '14:00', soundCheckTime: '16:00', status: 'approved' },
      { performerId: 3, eventId: 3, soundRequirements: 'Pioneer CDJ-3000 x4, DJM-A9 mixer, full sub system', lightingRequirements: 'Full LED wall, lasers, strobes, CO2 jets', stageRequirements: 'Elevated DJ booth 6ft height, 12x8ft', backlineEquipment: 'CDJs and mixer provided by artist', monitorMix: 'Booth monitors L/R, sub under booth', specialRequests: 'Dedicated power circuit for DJ equipment', hospitalityRequirements: 'Private DJ booth, energy drinks, water', loadInTime: '12:00', soundCheckTime: '17:00', status: 'approved' },
      { performerId: 4, eventId: 4, soundRequirements: '48-channel FOH, 24 monitor mixes, stereo PA with delays', lightingRequirements: '32 moving heads, LED strips, pyrotechnics clearance', stageRequirements: '50x35ft stage with B-stage runway', backlineEquipment: 'Full Nashville-spec backline', monitorMix: '8 IEM packs, 6 side fills', specialRequests: 'Teleprompter for award presentations', hospitalityRequirements: '4 star dressing rooms, full catering', loadInTime: '06:00', soundCheckTime: '14:00', status: 'approved' },
      { performerId: 5, eventId: 5, soundRequirements: 'Acoustic-optimized PA, 32 orchestral mics, hanging mics', lightingRequirements: 'Classic warm lighting, music stand lights x30', stageRequirements: '50x40ft stage, orchestra risers, conductor podium', backlineEquipment: 'Timpani, harp, celesta', monitorMix: 'No monitors - acoustic venue', specialRequests: 'Stage temperature 68-72°F for instruments', hospitalityRequirements: 'Large green room for 30, tuning room', loadInTime: '09:00', soundCheckTime: '13:00', status: 'approved' },
      { performerId: 6, eventId: 6, soundRequirements: 'Full PA with heavy sub bass, 2 vocal mics, DJ booth', lightingRequirements: 'High-energy lighting, strobes, crowd blinders', stageRequirements: '30x20ft stage with DJ riser', backlineEquipment: 'DJ turntables as backup', monitorMix: '4 IEM packs, 2 side fills', specialRequests: 'Crowd barrier 6ft from stage', hospitalityRequirements: 'Private area backstage, specific food requirements', loadInTime: '10:00', soundCheckTime: '16:00', status: 'submitted' },
      { performerId: 7, eventId: 7, soundRequirements: '16-channel mixer, 4 vocal mics, 3 DI boxes', lightingRequirements: 'Basic stage wash, 4 par cans', stageRequirements: '12x10ft minimum', backlineEquipment: 'Guitar amps (Fender Twin, Vox AC30), drum kit', monitorMix: '3 floor wedges', specialRequests: 'Merch table near stage', hospitalityRequirements: 'Case of beer, veggie platter', loadInTime: '16:00', soundCheckTime: '18:00', status: 'approved' },
      { performerId: 8, eventId: 8, soundRequirements: 'Clean PA system, 2 DI, 1 vocal mic, laptop input', lightingRequirements: 'Ambient warm lighting, fairy lights, sunset tones', stageRequirements: '10x10ft raised platform', backlineEquipment: 'Keyboard stand, stool', monitorMix: '1 floor monitor', specialRequests: 'Power outlet within 10ft of performance area', hospitalityRequirements: 'Sparkling water, fruit plate', loadInTime: '15:00', soundCheckTime: '16:30', status: 'draft' },
      { performerId: 9, eventId: 12, soundRequirements: 'High-SPL PA system, 6 vocal mics, full drum mic setup', lightingRequirements: 'Aggressive lighting, strobes, fog machine', stageRequirements: '30x25ft stage, drum riser, guitar risers', backlineEquipment: 'Marshall full stacks x3, double bass drum kit', monitorMix: '5 IEM packs, 4 wedges, side fills', specialRequests: 'Extra security for pit area', hospitalityRequirements: 'Hot meals for 6, private dressing room', loadInTime: '11:00', soundCheckTime: '16:00', status: 'approved' },
      { performerId: 10, eventId: 15, soundRequirements: 'Warm tube PA, 3 vocal mics, guitar DI, harmonica mic', lightingRequirements: 'Blues club atmosphere, blue/amber washes', stageRequirements: '20x15ft stage with bar stool', backlineEquipment: 'Fender Blues Deluxe amp, SM58 for harmonica', monitorMix: '2 floor wedges', specialRequests: 'Vintage vibe preferred', hospitalityRequirements: 'Bourbon, BBQ plate', loadInTime: '13:00', soundCheckTime: '16:00', status: 'approved' },
      { performerId: 11, eventId: 16, soundRequirements: '2 vocal mics, 2 acoustic guitar DIs, minimal PA', lightingRequirements: 'Intimate warm wash, candle-style LED', stageRequirements: '8x8ft area, 2 stools, mic stands', backlineEquipment: 'None - artists bring own instruments', monitorMix: '1 shared wedge monitor', specialRequests: 'No talking/phone zone near stage', hospitalityRequirements: 'Tea, water, granola bars', loadInTime: '17:00', soundCheckTime: '18:30', status: 'approved' },
      { performerId: 12, eventId: 17, soundRequirements: '24-channel mixer, 8 vocal/instrument mics, horn mics', lightingRequirements: 'Colorful dance lighting, mirror ball, LED strips', stageRequirements: '25x20ft stage, congas riser, horn section area', backlineEquipment: 'Congas, timbales, full drum kit, bass amp', monitorMix: '6 wedge monitors, 2 side fills', specialRequests: 'Dance floor must be clear and clean', hospitalityRequirements: 'Latin food spread, energy drinks', loadInTime: '14:00', soundCheckTime: '17:00', status: 'approved' },
      { performerId: 13, eventId: 18, soundRequirements: 'Loud PA, 3 vocal mics, 2 guitar DIs', lightingRequirements: 'Raw, minimal - house lights only if needed', stageRequirements: '15x12ft, no risers needed', backlineEquipment: 'Guitar amps (any loud ones), drum kit', monitorMix: '2 wedges', specialRequests: 'No barricade - intimate crowd interaction', hospitalityRequirements: 'Pizza and beer', loadInTime: '17:00', soundCheckTime: '18:00', status: 'submitted' },
      { performerId: 14, eventId: 10, soundRequirements: '16-channel mixer, 4 vocal mics, keys DI, bass DI', lightingRequirements: 'Elegant lighting, spotlight on lead, confetti cannon for midnight', stageRequirements: '20x15ft stage, keyboard stand', backlineEquipment: 'Keyboard, bass amp, drum kit', monitorMix: '4 IEM packs', specialRequests: 'Countdown clock visible to stage at midnight', hospitalityRequirements: 'Champagne, formal catering', loadInTime: '14:00', soundCheckTime: '16:00', status: 'approved' },
      { performerId: 15, eventId: 3, soundRequirements: 'Synth-heavy setup, 4 DI, MIDI controller inputs', lightingRequirements: 'UV lighting, LED panels synced to MIDI', stageRequirements: '12x10ft riser next to DJ booth', backlineEquipment: 'Keyboard stands x3, synth table', monitorMix: '2 IEM packs, 1 sub monitor', specialRequests: 'Stable power for sensitive electronics', hospitalityRequirements: 'Water, energy bars', loadInTime: '12:00', soundCheckTime: '15:00', status: 'approved' },
      { performerId: 16, eventId: 11, soundRequirements: 'Gentle PA, fiddle mic, banjo mic, vocal mics x3', lightingRequirements: 'Warm brunch-appropriate lighting', stageRequirements: '10x10ft corner stage area', backlineEquipment: 'None - acoustic instruments provided by artists', monitorMix: '1 shared floor wedge', specialRequests: 'Performance volume must allow conversation', hospitalityRequirements: 'Brunch included for performers', loadInTime: '08:00', soundCheckTime: '09:00', status: 'draft' }
    ]);
    console.log('✅ Tech Riders seeded (16)');

    // Settlement Reports (16 items)
    await SettlementReport.bulkCreate([
      { eventId: 1, totalRevenue: 485000, ticketRevenue: 420000, concessionRevenue: 40000, merchandiseRevenue: 25000, totalExpenses: 180000, performerFees: 80000, venueRental: 40000, staffCosts: 35000, marketingCosts: 20000, miscExpenses: 5000, netProfit: 305000, status: 'finalized', notes: 'Exceeded revenue projections by 15%' },
      { eventId: 2, totalRevenue: 18500, ticketRevenue: 14500, concessionRevenue: 3000, merchandiseRevenue: 1000, totalExpenses: 12000, performerFees: 5000, venueRental: 3200, staffCosts: 2000, marketingCosts: 1500, miscExpenses: 300, netProfit: 6500, status: 'finalized', notes: 'Strong midweek performance' },
      { eventId: 3, totalRevenue: 195000, ticketRevenue: 155000, concessionRevenue: 25000, merchandiseRevenue: 15000, totalExpenses: 110000, performerFees: 45000, venueRental: 27000, staffCosts: 22000, marketingCosts: 12000, miscExpenses: 4000, netProfit: 85000, status: 'finalized', notes: 'VIP packages drove higher per-head revenue' },
      { eventId: 4, totalRevenue: 620000, ticketRevenue: 530000, concessionRevenue: 50000, merchandiseRevenue: 40000, totalExpenses: 350000, performerFees: 150000, venueRental: 70000, staffCosts: 60000, marketingCosts: 50000, miscExpenses: 20000, netProfit: 270000, status: 'finalized', notes: 'Awards ceremony broadcast rights added $80K' },
      { eventId: 5, totalRevenue: 280000, ticketRevenue: 250000, concessionRevenue: 20000, merchandiseRevenue: 10000, totalExpenses: 160000, performerFees: 65000, venueRental: 48000, staffCosts: 25000, marketingCosts: 18000, miscExpenses: 4000, netProfit: 120000, status: 'finalized', notes: 'Classical audience has high concession spend' },
      { eventId: 6, totalRevenue: 210000, ticketRevenue: 175000, concessionRevenue: 22000, merchandiseRevenue: 13000, totalExpenses: 95000, performerFees: 38000, venueRental: 24000, staffCosts: 18000, marketingCosts: 12000, miscExpenses: 3000, netProfit: 115000, status: 'pending', notes: 'Sponsorship revenue not yet finalized' },
      { eventId: 7, totalRevenue: 4200, ticketRevenue: 2700, concessionRevenue: 1200, merchandiseRevenue: 300, totalExpenses: 6500, performerFees: 3000, venueRental: 1600, staffCosts: 800, marketingCosts: 900, miscExpenses: 200, netProfit: -2300, status: 'finalized', notes: 'Loss event - indie showcase needs better promotion' },
      { eventId: 8, totalRevenue: 62000, ticketRevenue: 51200, concessionRevenue: 8000, merchandiseRevenue: 2800, totalExpenses: 38000, performerFees: 12000, venueRental: 12000, staffCosts: 8000, marketingCosts: 5000, miscExpenses: 1000, netProfit: 24000, status: 'draft', notes: 'Premium pricing worked well for rooftop venue' },
      { eventId: 9, totalRevenue: 85000, ticketRevenue: 67500, concessionRevenue: 12000, merchandiseRevenue: 5500, totalExpenses: 45000, performerFees: 8000, venueRental: 15000, staffCosts: 12000, marketingCosts: 8000, miscExpenses: 2000, netProfit: 40000, status: 'finalized', notes: 'Corporate client covered additional expenses' },
      { eventId: 10, totalRevenue: 350000, ticketRevenue: 285000, concessionRevenue: 40000, merchandiseRevenue: 25000, totalExpenses: 180000, performerFees: 45000, venueRental: 48000, staffCosts: 40000, marketingCosts: 35000, miscExpenses: 12000, netProfit: 170000, status: 'draft', notes: 'NYE premium pricing highly effective' },
      { eventId: 11, totalRevenue: 8500, ticketRevenue: 5600, concessionRevenue: 2400, merchandiseRevenue: 500, totalExpenses: 7200, performerFees: 4000, venueRental: 1400, staffCosts: 1000, marketingCosts: 600, miscExpenses: 200, netProfit: 1300, status: 'finalized', notes: 'Small profit but great community engagement' },
      { eventId: 12, totalRevenue: 125000, ticketRevenue: 105000, concessionRevenue: 12000, merchandiseRevenue: 8000, totalExpenses: 72000, performerFees: 30000, venueRental: 18000, staffCosts: 14000, marketingCosts: 8000, miscExpenses: 2000, netProfit: 53000, status: 'pending', notes: 'Metal audience merchandise sales exceeded expectations' },
      { eventId: 13, totalRevenue: 95000, ticketRevenue: 72000, concessionRevenue: 15000, merchandiseRevenue: 8000, totalExpenses: 55000, performerFees: 15000, venueRental: 18000, staffCosts: 12000, marketingCosts: 8000, miscExpenses: 2000, netProfit: 40000, status: 'finalized', notes: 'Unique format attracted diverse audience' },
      { eventId: 14, totalRevenue: 420000, ticketRevenue: 360000, concessionRevenue: 35000, merchandiseRevenue: 25000, totalExpenses: 250000, performerFees: 50000, venueRental: 100000, staffCosts: 50000, marketingCosts: 40000, miscExpenses: 10000, netProfit: 170000, status: 'draft', notes: 'Corporate sponsorships covered 40% of expenses' },
      { eventId: 15, totalRevenue: 175000, ticketRevenue: 140000, concessionRevenue: 25000, merchandiseRevenue: 10000, totalExpenses: 85000, performerFees: 28000, venueRental: 24000, staffCosts: 18000, marketingCosts: 12000, miscExpenses: 3000, netProfit: 90000, status: 'finalized', notes: 'Food vendor partnerships highly profitable' },
      { eventId: 16, totalRevenue: 5800, ticketRevenue: 3800, concessionRevenue: 1500, merchandiseRevenue: 500, totalExpenses: 5200, performerFees: 2500, venueRental: 1200, staffCosts: 800, marketingCosts: 500, miscExpenses: 200, netProfit: 600, status: 'finalized', notes: 'Break-even with good audience satisfaction scores' }
    ]);
    console.log('✅ Settlement Reports seeded (16)');

    console.log('\n🎉 All seed data inserted successfully!');
    console.log(`Admin identity provisioned for ${adminEmail}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
