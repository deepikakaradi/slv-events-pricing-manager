import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarDays, Plus, Edit, Check, X, AlertCircle } from 'lucide-react';

export default function EventTypeManager() {
  const { events, apiFetch, fetchEvents } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStatus, setEditStatus] = useState('active');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name) return;

    setLoading(true);
    try {
      await apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({ name, description })
      });
      fetchEvents();
      setName('');
      setDescription('');
      setShowAdd(false);
    } catch (err) {
      setError(err.message || 'Failed to create event type');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (eType) => {
    setEditId(eType.id);
    setEditName(eType.name);
    setEditDesc(eType.description || '');
    setEditStatus(eType.status);
  };

  const handleEditSave = async () => {
    if (!editName) return;
    try {
      await apiFetch(`/events/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName, description: editDesc, status: editStatus })
      });
      setEditId(null);
      fetchEvents();
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-outfit font-extrabold text-3xl tracking-tight text-slate-800 dark:text-white">Event Types</h1>
          <p className="text-xs text-slate-400 mt-1">Configure baseline event categories that map to customized services pricing rules.</p>
        </div>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white shadow-lg hover:scale-[1.01] transition-transform"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Event Type</span>
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={handleAddSubmit} className="glass-card p-6 rounded-2xl border border-white/20 dark:border-slate-800/40 space-y-4">
          <h3 className="font-outfit font-bold text-base">Add New Event Category</h3>
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center space-x-2">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Event Type Name</label>
              <input
                type="text"
                placeholder="e.g. Anniversary Party"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
              <input
                type="text"
                placeholder="Brief summary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/60 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-luxury-500 to-luxury-600 text-white"
            >
              Save Event Type
            </button>
          </div>
        </form>
      )}

      {/* Events table */}
      <div className="glass-card rounded-2xl border border-white/20 dark:border-slate-800/40 overflow-hidden shadow-sm">
        <table className="w-full text-left modern-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const isEditing = editId === e.id;
              return (
                <tr key={e.id} className="hover:bg-slate-100/30 dark:hover:bg-slate-900/30 transition-colors">
                  <td>
                    <div className="w-8 h-8 rounded-lg bg-luxury-500/10 flex items-center justify-center text-luxury-500">
                      <CalendarDays className="h-4.5 w-4.5" />
                    </div>
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none"
                      />
                    ) : (
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{e.name}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 text-xs focus:outline-none"
                      />
                    ) : (
                      <span className="text-slate-400 text-xs leading-relaxed">{e.description || 'No description provided'}</span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900 text-xs focus:outline-none"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {e.status}
                      </span>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <button onClick={handleEditSave} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded">
                          <Check className="h-4.5 w-4.5" />
                        </button>
                        <button onClick={() => setEditId(null)} className="p-1 text-rose-500 hover:bg-rose-500/10 rounded">
                          <X className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleEditClick(e)}
                        className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
