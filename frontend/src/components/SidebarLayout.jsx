import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  LayoutDashboard, 
  Layers, 
  CalendarDays, 
  Sliders, 
  FileText, 
  BarChart3, 
  Bell, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Sparkles,
  User
} from 'lucide-react';

export default function SidebarLayout({ children }) {
  const { user, page, setPage, logout, unreadNotifications, theme, toggleTheme } = useApp();

  const navigation = [
    { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', roles: ['admin', 'sales'] },
    { name: 'Quote Builder', icon: FileText, page: 'builder', roles: ['admin', 'sales'] },
    { name: 'Package Manager', icon: Layers, page: 'packages', roles: ['admin'] },
    { name: 'Event Types', icon: CalendarDays, page: 'events', roles: ['admin'] },
    { name: 'Pricing Engine', icon: Sliders, page: 'pricing', roles: ['admin'] },
    { name: 'Analytics Hub', icon: BarChart3, page: 'analytics', roles: ['admin', 'sales'] },
    { name: 'Notifications', icon: Bell, page: 'notifications', roles: ['admin', 'sales'], badge: unreadNotifications },
    { name: 'Settings', icon: Settings, page: 'settings', roles: ['admin', 'sales'] },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-luxury-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar Panel */}
      <aside className="w-64 glass-card border-r border-slate-200/50 dark:border-slate-800/30 flex flex-col justify-between h-screen sticky top-0 z-30">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-200/40 dark:border-slate-800/20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-luxury-400 to-luxury-600 flex items-center justify-center shadow-lg shadow-luxury-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-outfit font-bold text-lg tracking-wide text-slate-800 dark:text-white leading-none">SLV Events</h1>
              <span className="text-[10px] text-luxury-500 dark:text-luxury-400 font-semibold tracking-widest uppercase">Pricing Tier Suite</span>
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navigation.map((item) => {
              if (user && item.roles.includes(user.role)) {
                const Icon = item.icon;
                const isActive = page === item.page;
                return (
                  <button
                    key={item.name}
                    onClick={() => setPage(item.page)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-luxury-500/15 to-luxury-500/5 text-luxury-500 dark:text-luxury-400 font-semibold shadow-inner'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-luxury-500' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              }
              return null;
            })}
          </nav>
        </div>

        {/* User Card & Settings */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-300 dark:border-slate-700">
                <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="text-left leading-none">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[110px]">
                  {user ? user.name : 'Guest User'}
                </p>
                <span className="text-[10px] uppercase font-bold text-luxury-500 dark:text-luxury-400 tracking-wider">
                  {user ? user.role : ''}
                </span>
              </div>
            </div>
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-luxury-500 transition-colors"
              title="Toggle dark/light mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 dark:hover:bg-rose-500/5 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen relative z-10">
        {children}
      </main>
    </div>
  );
}
