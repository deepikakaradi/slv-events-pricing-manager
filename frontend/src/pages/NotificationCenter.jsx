import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell, Check, Clock, ShieldAlert } from 'lucide-react';

export default function NotificationCenter() {
  const { notifications, markNotificationRead } = useApp();

  return (
    <div className="space-y-8 font-sans max-w-3xl">
      <div>
        <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Notification Center</h1>
        <p className="text-xs text-slate-400 mt-1">Stay updated with client inquiries status changes, pending approvals, and team activity logs.</p>
      </div>

      <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-800/40 divide-y divide-slate-200/50 dark:divide-slate-800/20 overflow-hidden shadow-sm">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n.id} className={`p-5 flex items-start justify-between space-x-4 transition-colors ${n.is_read === 0 ? 'bg-luxury-500/5' : ''}`}>
              <div className="flex items-start space-x-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${n.is_read === 0 ? 'bg-luxury-500/10 text-luxury-500' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>
                  <Bell className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className={`text-sm ${n.is_read === 0 ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1.5 flex items-center space-x-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {n.is_read === 0 && (
                <button
                  onClick={() => markNotificationRead(n.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 hover:text-luxury-500 hover:border-luxury-500/50 transition-all"
                >
                  <Check className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-500 mx-auto">
              <Bell className="h-6 w-6" />
            </div>
            <p className="text-slate-400 text-xs font-semibold">Your inbox is completely clear.</p>
          </div>
        )}
      </div>
    </div>
  );
}
