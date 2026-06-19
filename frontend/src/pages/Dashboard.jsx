import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { 
  TrendingUp, 
  Calendar, 
  FileText, 
  Layers, 
  Clock, 
  ArrowRight,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

export default function Dashboard() {
  const { apiFetch, setPage } = useApp();
  const [data, setData] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboard = await apiFetch('/analytics/dashboard');
      const quotesList = await apiFetch('/quotes');
      setData(dashboard);
      setQuotes(quotesList);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (quoteId, status) => {
    try {
      await apiFetch(`/quotes/${quoteId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      fetchDashboardData(); // Reload stats
    } catch (err) {
      alert('Failed to update quote status: ' + err.message);
    }
  };

  // CSV Export utility
  const exportToCSV = () => {
    if (quotes.length === 0) return;
    
    const headers = ['Quote ID', 'Client Name', 'Client Email', 'Event Type', 'Package', 'Guests', 'Final Price (Inc Tax)', 'Status', 'Date'];
    const rows = quotes.map(q => [
      q.id,
      q.client_name,
      q.client_email,
      q.event_name,
      `${q.package_name} (${q.package_tier})`,
      q.guest_count,
      q.final_price.toFixed(2),
      q.status,
      new Date(q.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SLV_Quotation_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-luxury-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-xs tracking-wider uppercase font-bold">Synchronizing Dashboard Metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 glass-card border border-rose-500/20 bg-rose-500/5 text-center space-y-4 rounded-2xl max-w-xl mx-auto mt-20">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h3 className="font-outfit font-bold text-lg text-rose-600 dark:text-rose-400">Dashboard Synchronization Error</h3>
        <p className="text-sm text-slate-400">{error}</p>
        <button onClick={fetchDashboardData} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold">Retry connection</button>
      </div>
    );
  }

  const { metrics, charts, recentActivity } = data;

  const COLORS = ['#A4956C', '#BEB28E', '#D5CEB4', '#E7E3D4', '#10B981', '#6366F1'];

  return (
    <div className="space-y-8 font-sans">
      {/* Upper Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Workspace Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time revenue indicators, client activity metrics, and pending follow-ups.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/60 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            <span>Export CSV Report</span>
          </button>
          <button
            onClick={() => setPage('builder')}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg shadow-luxury-500/10 hover:scale-[1.01] transition-transform"
          >
            Create New Quotation
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Approved Revenue', value: `₹${formatCurrency(metrics.revenue)}`, sub: 'Realized business volume', icon: TrendingUp, color: 'text-luxury-500' },
          { label: 'Active Packages', value: metrics.activePackages, sub: 'Tier versions published', icon: Layers, color: 'text-indigo-500' },
          { label: 'Quotes Generated', value: metrics.totalQuotes, sub: 'Total pipeline entries', icon: FileText, color: 'text-emerald-500' },
          { label: 'Active Event Types', value: metrics.activeEvents, sub: 'Configured event slabs', icon: Calendar, color: 'text-amber-500' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-24 h-24 bg-luxury-400/5 rounded-bl-[100px] pointer-events-none" />
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">{kpi.label}</span>
                <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center`}>
                  <Icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold font-outfit text-slate-800 dark:text-white leading-none mb-1.5">{kpi.value}</h2>
              <span className="text-[10px] text-slate-500">{kpi.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trends Chart (Area) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm">
          <h3 className="font-outfit font-bold text-base mb-6">Revenue Growth Trends</h3>
          <div className="h-72 w-full">
            {charts.revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueTrends}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A4956C" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#A4956C" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-900" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#A4956C" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-slate-400 text-xs">No approved revenue transactions recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        {/* Package Popularity (Bar Chart) */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <h3 className="font-outfit font-bold text-base mb-6">Package Popularity</h3>
          <div className="h-60 w-full flex items-center">
            {charts.packagePopularity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.packagePopularity}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94A3B8" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.95)', 
                      borderRadius: '12px', 
                      color: 'white', 
                      fontSize: '11px' 
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {charts.packagePopularity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <span className="text-slate-400 text-xs">No packages built yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Recent Quotations & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quotations List */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-white/20 dark:border-slate-800/40 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/40 flex justify-between items-center bg-white/30 dark:bg-slate-900/30">
            <h3 className="font-outfit font-bold text-base">Recent Quotations</h3>
            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-md font-mono">{quotes.length} total</span>
          </div>

          <div className="overflow-x-auto">
            {quotes.length > 0 ? (
              <table className="w-full text-left modern-table">
                <thead>
                  <tr>
                    <th>Client / Contact</th>
                    <th>Package Selection</th>
                    <th>Final Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.slice(0, 5).map((q) => (
                    <tr key={q.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors">
                      <td>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 leading-none mb-1">{q.client_name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{q.client_email}</span>
                      </td>
                      <td>
                        <div className="text-xs font-semibold text-slate-800 dark:text-white leading-none mb-1 truncate max-w-[150px]">{q.package_name}</div>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-luxury-500">{q.package_tier}</span>
                      </td>
                      <td className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                        ${formatCurrency(q.final_price)}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                          q.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
                        }`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-1.5">
                          {q.status === 'Pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(q.id, 'Approved')}
                                className="p-1 rounded-md text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                title="Approve Quote"
                              >
                                <CheckCircle className="h-4.5 w-4.5" />
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(q.id, 'Rejected')}
                                className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Reject Quote"
                              >
                                <XCircle className="h-4.5 w-4.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                No quotations constructed yet. Generate one in the Quote Builder!
              </div>
            )}
          </div>
        </div>

        {/* Activity Logs */}
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-outfit font-bold text-base mb-6">Activity Timeline</h3>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 text-xs leading-normal">
                    <div className="w-2 h-2 rounded-full bg-luxury-400 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {log.action}
                      </p>
                      <div className="flex items-center space-x-1.5 mt-1 text-[10px] text-slate-400 font-mono">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="uppercase font-bold text-luxury-500">{log.user_name || 'System'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-12 text-xs">No recent actions logged.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
