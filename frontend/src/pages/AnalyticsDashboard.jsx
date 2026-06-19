import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, TrendingUp, Calendar, Layers, Activity } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';

export default function AnalyticsDashboard() {
  const { apiFetch } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch('/analytics/dashboard');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-luxury-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { metrics, charts } = data;
  const COLORS = ['#A4956C', '#BEB28E', '#D5CEB4', '#E7E3D4', '#6366F1', '#10B981'];

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Analytics Hub</h1>
        <p className="text-xs text-slate-400 mt-1">Deep analytics on client volume conversions, revenue trends, and service popularity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Package Popularity */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm">
          <h3 className="font-outfit font-bold text-base mb-6">Package Popularity Breakdown</h3>
          <div className="h-72">
            {charts.packagePopularity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.packagePopularity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" className="dark:stroke-slate-900" />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: 'white', fontSize: '11px' }} />
                  <Bar dataKey="count" fill="#A4956C" radius={[4, 4, 0, 0]}>
                    {charts.packagePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-slate-400 text-xs">No records available.</span>
              </div>
            )}
          </div>
        </div>

        {/* Event distribution */}
        <div className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm">
          <h3 className="font-outfit font-bold text-base mb-6">Event Categories Share</h3>
          <div className="h-72 flex items-center">
            {charts.eventDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.eventDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {charts.eventDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', color: 'white', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-slate-400 text-xs">No events recorded.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
