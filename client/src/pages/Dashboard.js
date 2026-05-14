import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const features = [
  { path: '/events', title: 'Event Management', desc: 'Create and manage events with full lifecycle tracking', icon: '🎪', badge: 'core', colors: ['#6366f1', '#818cf8'] },
  { path: '/ticket-pricing', title: 'Ticket Pricing Optimization', desc: 'AI-powered dynamic pricing based on demand and event type', icon: '🎫', badge: 'ai', colors: ['#8b5cf6', '#a855f7'] },
  { path: '/seat-assignments', title: 'Seat Assignment', desc: 'Intelligent seat layout management with AI optimization', icon: '💺', badge: 'ai', colors: ['#06b6d4', '#22d3ee'] },
  { path: '/performers', title: 'Performer Directory', desc: 'Manage performer profiles, genres, and availability', icon: '🎤', badge: 'core', colors: ['#f59e0b', '#fbbf24'] },
  { path: '/performer-bookings', title: 'Performer Booking', desc: 'AI-assisted booking with fee analysis and contract management', icon: '📋', badge: 'ai', colors: ['#10b981', '#34d399'] },
  { path: '/tech-riders', title: 'Tech Rider Management', desc: 'AI analysis of technical requirements and equipment needs', icon: '🔧', badge: 'ai', colors: ['#ef4444', '#f87171'] },
  { path: '/settlements', title: 'Settlement Reporting', desc: 'AI financial analysis with revenue and expense tracking', icon: '💰', badge: 'ai', colors: ['#22c55e', '#4ade80'] },
  { path: '/venues', title: 'Venue Management', desc: 'AI-powered venue analysis and optimization recommendations', icon: '🏟️', badge: 'ai', colors: ['#3b82f6', '#60a5fa'] },
  { path: '/seat-recommend', title: 'AI Seat Recommendation', desc: 'Find the best contiguous seat blocks for any party — budget, accessibility, view-aware', icon: '🎯', badge: 'ai', colors: ['#a855f7', '#d946ef'] }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ events: 0, performers: 0, venues: 0, revenue: 0 });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [events, performers, venues, settlements] = await Promise.all([
          api.get('/events'),
          api.get('/performers'),
          api.get('/venues'),
          api.get('/settlements')
        ]);
        const totalRevenue = settlements.data.reduce((sum, s) => sum + parseFloat(s.totalRevenue || 0), 0);
        setStats({
          events: events.data.length,
          performers: performers.data.length,
          venues: venues.data.length,
          revenue: totalRevenue
        });
      } catch (err) {
        console.error('Failed to load stats');
      }
    };
    loadStats();
  }, []);

  return (
    <div>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to AI Venue Manager — your intelligent event management platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/events')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>🎪</div>
          <div className="stat-value">{stats.events}</div>
          <div className="stat-label">Active Events</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/performers')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>🎤</div>
          <div className="stat-value">{stats.performers}</div>
          <div className="stat-label">Performers</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/venues')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee' }}>🏟️</div>
          <div className="stat-value">{stats.venues}</div>
          <div className="stat-label">Venues</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/settlements')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>💰</div>
          <div className="stat-value">${(stats.revenue / 1000).toFixed(0)}K</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '4px' }}>Features</h2>
      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>Click a card to manage each feature</p>
      <div className="features-grid">
        {features.map(f => (
          <div
            key={f.path}
            className="feature-card"
            onClick={() => navigate(f.path)}
            style={{ '--card-color': f.colors[0], '--card-color-end': f.colors[1] }}
          >
            <div className="card-icon" style={{ background: `linear-gradient(135deg, ${f.colors[0]}22, ${f.colors[1]}22)` }}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
            <span className={`card-badge ${f.badge === 'ai' ? 'badge-ai' : 'badge-core'}`}>
              {f.badge === 'ai' ? '✨ AI Powered' : '⚡ Core Feature'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
