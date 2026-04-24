import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import EventsPage from './pages/EventsPage';
import TicketPricingPage from './pages/TicketPricingPage';
import SeatAssignmentsPage from './pages/SeatAssignmentsPage';
import PerformersPage from './pages/PerformersPage';
import PerformerBookingsPage from './pages/PerformerBookingsPage';
import TechRidersPage from './pages/TechRidersPage';
import SettlementsPage from './pages/SettlementsPage';
import VenuesPage from './pages/VenuesPage';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/ticket-pricing" element={<TicketPricingPage />} />
          <Route path="/seat-assignments" element={<SeatAssignmentsPage />} />
          <Route path="/performers" element={<PerformersPage />} />
          <Route path="/performer-bookings" element={<PerformerBookingsPage />} />
          <Route path="/tech-riders" element={<TechRidersPage />} />
          <Route path="/settlements" element={<SettlementsPage />} />
          <Route path="/venues" element={<VenuesPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
