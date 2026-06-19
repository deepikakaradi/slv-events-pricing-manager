import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LandingPage from './pages/LandingPage';
import LoginRegister from './pages/LoginRegister';
import SidebarLayout from './components/SidebarLayout';
import Dashboard from './pages/Dashboard';
import QuoteBuilder from './pages/QuoteBuilder';
import PackageManager from './pages/PackageManager';
import EventTypeManager from './pages/EventTypeManager';
import PricingEngine from './pages/PricingEngine';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import NotificationCenter from './pages/NotificationCenter';
import Settings from './pages/Settings';

function AppContent() {
  const { token, page, user } = useApp();

  // Unauthorized Views (Landing page, Login & Registration)
  if (!token) {
    if (page === 'register') {
      return <LoginRegister />;
    } else if (page === 'login') {
      return <LoginRegister />;
    } else {
      return <LandingPage />;
    }
  }

  // Authorized sidebar layout views
  const renderActivePage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard />;
      case 'builder':
        return <QuoteBuilder />;
      case 'packages':
        return user?.role === 'admin' ? <PackageManager /> : <Dashboard />;
      case 'events':
        return user?.role === 'admin' ? <EventTypeManager /> : <Dashboard />;
      case 'pricing':
        return user?.role === 'admin' ? <PricingEngine /> : <Dashboard />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'notifications':
        return <NotificationCenter />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <SidebarLayout>{renderActivePage()}</SidebarLayout>;
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
