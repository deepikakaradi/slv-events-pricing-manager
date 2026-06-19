import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, User, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function LoginRegister() {
  const { login, register, setPage } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('sales');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !password || !role) {
          throw new Error('Please fill in all fields');
        }
        await register(name, email, password, role);
      } else {
        if (!email || !password) {
          throw new Error('Please enter email and password');
        }
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Background elements */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-luxury-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back to landing */}
      <button 
        onClick={() => setPage('landing')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 hover:text-luxury-500 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </button>

      {/* Main Glass Form Card */}
      <div className="w-full max-w-md glass-card p-8 rounded-2xl border border-white/20 dark:border-slate-800/40 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-luxury-400 to-luxury-600 flex items-center justify-center shadow-lg shadow-luxury-500/20 mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="font-outfit font-bold text-2xl tracking-wide text-slate-800 dark:text-white leading-none">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            {isRegister ? 'Register your employee role' : 'Access your events workspace'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                placeholder="email@slvevents.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none focus:border-luxury-500 transition-colors"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 pl-1">Authorized Role</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('sales')}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    role === 'sales'
                      ? 'border-luxury-500 bg-luxury-500/10 text-luxury-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  Sales Representative
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    role === 'admin'
                      ? 'border-luxury-500 bg-luxury-500/10 text-luxury-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900/40 text-slate-400'
                  }`}
                >
                  System Administrator
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-luxury-500 to-luxury-600 shadow-lg shadow-luxury-500/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isRegister ? 'Authorized Register' : 'Access Dashboard'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-200/50 dark:border-slate-800/40 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-luxury-500 transition-colors"
          >
            {isRegister ? 'Already have an employee account? Sign In' : "Don't have an account? Request access"}
          </button>
        </div>
      </div>
    </div>
  );
}
