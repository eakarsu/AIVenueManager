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
import SeatRecommendPage from './pages/SeatRecommendPage';
import AIDynamicPricingPage from './pages/AIDynamicPricingPage';
import AIRevenueForecastPage from './pages/AIRevenueForecastPage';
import AIArtistAudienceMatchPage from './pages/AIArtistAudienceMatchPage';
import AIMarketingCampaignPage from './pages/AIMarketingCampaignPage';
import AISchedulingOptimizerPage from './pages/AISchedulingOptimizerPage';
import EventbriteSyncPage from './pages/EventbriteSyncPage';
import StripePaymentPage from './pages/StripePaymentPage';
// === Batch 08 Gaps & Frontend Mounts ===
import CfDynamicPricingOptimizerAdjustingByDemandTime from './pages/CfDynamicPricingOptimizerAdjustingByDemandTime'
import CfArtistAudienceMatcherRecommendingArtistsByTarget from './pages/CfArtistAudienceMatcherRecommendingArtistsByTarget'
import CfRevenuePredictionForecastingEventProfitability from './pages/CfRevenuePredictionForecastingEventProfitability'
import CfSchedulingOptimizerMinimizingCannibalizationAcrossEvents from './pages/CfSchedulingOptimizerMinimizingCannibalizationAcrossEvents'
import CfMarketingCampaignRecommenderSuggestingChannelsBudgets from './pages/CfMarketingCampaignRecommenderSuggestingChannelsBudgets'
import CfPatronCrmWithLoyaltySeasonTicketSubscription from './pages/CfPatronCrmWithLoyaltySeasonTicketSubscription'
import GapNoAiDynamicPricingBasedOnDemand from './pages/GapNoAiDynamicPricingBasedOnDemand'
import GapNoAiArtistAudienceMatching from './pages/GapNoAiArtistAudienceMatching'
import GapNoAiDemandForecasting from './pages/GapNoAiDemandForecasting'
import GapNoIntegrationsWithTicketingPlatformsEventbriteTicketmaster from './pages/GapNoIntegrationsWithTicketingPlatformsEventbriteTicketmaster'
import GapNoPaymentProcessingIntegration from './pages/GapNoPaymentProcessingIntegration'
import GapNoMarketingAutomation from './pages/GapNoMarketingAutomation'
import GapNoCustomerSelfServicePortal from './pages/GapNoCustomerSelfServicePortal'
import GapNoWebhooks from './pages/GapNoWebhooks'
import GapNoAuditLogging from './pages/GapNoAuditLogging'
import GapNoNotificationsSubsystem from './pages/GapNoNotificationsSubsystem'
import GapNoMultiVenueFranchiseChainManagement from './pages/GapNoMultiVenueFranchiseChainManagement'

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
          <Route path="/seat-recommend" element={<SeatRecommendPage />} />
          <Route path="/ai/dynamic-pricing" element={<AIDynamicPricingPage />} />
          <Route path="/ai/revenue-forecast" element={<AIRevenueForecastPage />} />
          <Route path="/ai/artist-match" element={<AIArtistAudienceMatchPage />} />
          <Route path="/ai/marketing-campaign" element={<AIMarketingCampaignPage />} />
          <Route path="/ai/scheduling-optimizer" element={<AISchedulingOptimizerPage />} />
          <Route path="/integrations/eventbrite" element={<EventbriteSyncPage />} />
          <Route path="/integrations/stripe-payment" element={<StripePaymentPage />} />
          {/* // === Batch 08 Gaps & Frontend Mounts === */}
      <Route path="/cf-dynamic-pricing-optimizer-adjusting-by-demand-time-to-event-comparables" element={<ProtectedRoute><CfDynamicPricingOptimizerAdjustingByDemandTime /></ProtectedRoute>} />
      <Route path="/cf-artist-audience-matcher-recommending-artists-by-target-audience" element={<ProtectedRoute><CfArtistAudienceMatcherRecommendingArtistsByTarget /></ProtectedRoute>} />
      <Route path="/cf-revenue-prediction-forecasting-event-profitability" element={<ProtectedRoute><CfRevenuePredictionForecastingEventProfitability /></ProtectedRoute>} />
      <Route path="/cf-scheduling-optimizer-minimizing-cannibalization-across-events" element={<ProtectedRoute><CfSchedulingOptimizerMinimizingCannibalizationAcrossEvents /></ProtectedRoute>} />
      <Route path="/cf-marketing-campaign-recommender-suggesting-channels-budgets" element={<ProtectedRoute><CfMarketingCampaignRecommenderSuggestingChannelsBudgets /></ProtectedRoute>} />
      <Route path="/cf-patron-crm-with-loyalty-season-ticket-subscription-support" element={<ProtectedRoute><CfPatronCrmWithLoyaltySeasonTicketSubscription /></ProtectedRoute>} />
      <Route path="/gap-no-ai-dynamic-pricing-based-on-demand" element={<ProtectedRoute><GapNoAiDynamicPricingBasedOnDemand /></ProtectedRoute>} />
      <Route path="/gap-no-ai-artist-audience-matching" element={<ProtectedRoute><GapNoAiArtistAudienceMatching /></ProtectedRoute>} />
      <Route path="/gap-no-ai-demand-forecasting" element={<ProtectedRoute><GapNoAiDemandForecasting /></ProtectedRoute>} />
      <Route path="/gap-no-integrations-with-ticketing-platforms-eventbrite-ticketmaster" element={<ProtectedRoute><GapNoIntegrationsWithTicketingPlatformsEventbriteTicketmaster /></ProtectedRoute>} />
      <Route path="/gap-no-payment-processing-integration" element={<ProtectedRoute><GapNoPaymentProcessingIntegration /></ProtectedRoute>} />
      <Route path="/gap-no-marketing-automation" element={<ProtectedRoute><GapNoMarketingAutomation /></ProtectedRoute>} />
      <Route path="/gap-no-customer-self-service-portal" element={<ProtectedRoute><GapNoCustomerSelfServicePortal /></ProtectedRoute>} />
      <Route path="/gap-no-webhooks" element={<ProtectedRoute><GapNoWebhooks /></ProtectedRoute>} />
      <Route path="/gap-no-audit-logging" element={<ProtectedRoute><GapNoAuditLogging /></ProtectedRoute>} />
      <Route path="/gap-no-notifications-subsystem" element={<ProtectedRoute><GapNoNotificationsSubsystem /></ProtectedRoute>} />
      <Route path="/gap-no-multi-venue-franchise-chain-management" element={<ProtectedRoute><GapNoMultiVenueFranchiseChainManagement /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
