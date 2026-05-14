import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { section: 'Overview', items: [
    { path: '/', label: 'Dashboard', icon: '📊' }
  ]},
  { section: 'Core Management', items: [
    { path: '/events', label: 'Events', icon: '🎪' },
    { path: '/venues', label: 'Venues', icon: '🏟️' },
    { path: '/performers', label: 'Performers', icon: '🎤' },
    { path: '/performer-bookings', label: 'Bookings', icon: '📋' }
  ]},
  { section: 'AI-Powered', items: [
    { path: '/ticket-pricing', label: 'Ticket Pricing', icon: '🎫' },
    { path: '/seat-assignments', label: 'Seat Assignments', icon: '💺' },
    { path: '/seat-recommend', label: 'Seat Recommend', icon: '🎯' },
    { path: '/tech-riders', label: 'Tech Riders', icon: '🔧' },
    { path: '/settlements', label: 'Settlements', icon: '💰' }
  ]},
  { section: 'New AI Tools', items: [
    { path: '/ai/dynamic-pricing', label: 'Dynamic Pricing', icon: '💸' },
    { path: '/ai/revenue-forecast', label: 'Revenue Forecast', icon: '📈' },
    { path: '/ai/artist-match', label: 'Artist Match', icon: '🎶' },
    { path: '/ai/marketing-campaign', label: 'Marketing Campaign', icon: '📣' },
    { path: '/ai/scheduling-optimizer', label: 'Scheduling', icon: '🗓️' }
  ]},
  { section: 'Integrations', items: [
    { path: '/integrations/eventbrite', label: 'Eventbrite Sync', icon: '🎟️' },
    { path: '/integrations/stripe-payment', label: 'Stripe Payment', icon: '💳' }
  ]}
];

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>AI Venue Manager</h2>
          <p>Smart Event Platform</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(section => (
            <div key={section.section} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map(item => (
                <button
                  key={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  <span className="icon">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.charAt(0)}</div>
            <div className="user-details">
              <p>{user.name}</p>
              <span>{user.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={onLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
