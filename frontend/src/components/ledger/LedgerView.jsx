import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
  Search,
  Sparkles,
  History,
  FileText,
} from 'lucide-react';

export default function LedgerView({ initialIncident }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(!!initialIncident);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields
  const [title, setTitle] = useState(
    initialIncident ? `Postmortem: ${initialIncident.template.slice(0, 50)}...` : ''
  );
  const [problem, setProblem] = useState(
    initialIncident
      ? `Incident #${initialIncident.id} in ${initialIncident.services?.join(', ')} with ${initialIncident.log_count} errors starting at ${initialIncident.first_seen}.`
      : ''
  );
  const [rootCause, setRootCause] = useState('');
  const [fixApplied, setFixApplied] = useState('');
  const [services, setServices] = useState(
    initialIncident?.services?.join(', ') || 'db, payment, checkout'
  );
  const [outcome, setOutcome] = useState('Resolved');

  useEffect(() => {
    loadLedger();
  }, []);

  useEffect(() => {
    if (initialIncident) {
      setTitle(`Postmortem: ${(initialIncident.template || '').slice(0, 50)}...`);
      setProblem(
        `Incident #${initialIncident.id} in ${initialIncident.services?.join(', ') || 'services'} with ${initialIncident.log_count || 0} errors starting at ${initialIncident.first_seen || 'N/A'}.`
      );
      setServices(initialIncident.services?.join(', ') || 'db, payment, checkout');
      setShowForm(true);
    }
  }, [initialIncident]);

  const loadLedger = async () => {
    setLoading(false);
    try {
      const data = await api.getLedgerEntries();
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !rootCause.trim() || !fixApplied.trim()) {
      alert('Please fill in title, root cause, and fix applied.');
      return;
    }

    setSaving(true);
    try {
      const servicesArray = services
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const newEntry = await api.createLedgerEntry({
        title,
        problem,
        root_cause: rootCause,
        fix_applied: fixApplied,
        services_affected: servicesArray,
        outcome,
        incident_id: initialIncident?.id || null,
      });

      setEntries([newEntry, ...entries]);
      setShowForm(false);
      // Reset
      setTitle('');
      setProblem('');
      setRootCause('');
      setFixApplied('');
    } catch (err) {
      alert(`Failed to save ledger entry: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = entries.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      e.problem.toLowerCase().includes(q) ||
      e.root_cause.toLowerCase().includes(q) ||
      e.fix_applied.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
            Incident Ledger &amp; Knowledge Base
          </h1>
          <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
            Record verified postmortems, root causes, and fixes. These entries power automated fingerprint similarity matching.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel Entry' : 'Record New Postmortem'}</span>
        </button>
      </div>

      {/* Postmortem Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#8C4A26]/30 dark:border-[#E07A5F]/30 shadow-lg space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E8DFD8] dark:border-[#272C3D]">
            <BookOpen className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
            <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
              Record Incident Resolution Postmortem
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
                Incident Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Peak Hours Postgres Pool Starvation"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
                Resolution Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
              >
                <option value="Resolved">Resolved</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Monitoring">Monitoring</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
              Observed Problem &amp; Symptoms
            </label>
            <textarea
              rows={2}
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              placeholder="What alerts fired? What broke?"
              className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
                Root Cause Identified *
              </label>
              <textarea
                rows={3}
                required
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="Technical root cause (e.g. HikariCP max_connections capped at 20 while worker pods scaled to 80)"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
                Fix Applied *
              </label>
              <textarea
                rows={3}
                required
                value={fixApplied}
                onChange={(e) => setFixApplied(e.target.value)}
                placeholder="What action fixed it? (e.g. Raised max_connections to 50 in ConfigMap and restarted pods)"
                className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] mb-1">
              Services Affected (comma-separated)
            </label>
            <input
              type="text"
              value={services}
              onChange={(e) => setServices(e.target.value)}
              placeholder="db, payment, checkout, api-gateway"
              className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C202C] text-xs font-medium text-[#705D55] dark:text-[#A9B2C3] border border-[#E8DFD8] dark:border-[#272C3D]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Postmortem to Ledger'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Ledger Search & Past Records */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#9C8980] dark:text-[#6B768E] absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search historical fixes or root causes..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26]"
            />
          </div>
          <span className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
            {filtered.length} entries indexed
          </span>
        </div>

        {/* Ledger Entries List */}
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-3 hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-[#8C4A26] dark:text-[#E07A5F]">
                    #{entry.id}
                  </span>
                  <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    {entry.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    {entry.outcome}
                  </span>
                  <span className="text-[11px] text-[#9C8980] dark:text-[#6B768E]">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-semibold text-[#705D55] dark:text-[#A9B2C3] uppercase text-[10px] tracking-wider">
                    Root Cause:
                  </span>
                  <p className="text-[#2C1810] dark:text-[#F3EFEA] leading-relaxed">
                    {entry.root_cause}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase text-[10px] tracking-wider">
                    Fix That Worked:
                  </span>
                  <p className="text-[#2C1810] dark:text-[#F3EFEA] bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 leading-relaxed font-mono text-[11px]">
                    {entry.fix_applied}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#9C8980] dark:text-[#6B768E]">Services:</span>
                  {(entry.services_affected || []).map((s) => (
                    <span
                      key={s}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#1C202C] text-[#705D55] dark:text-[#A9B2C3]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Feeds Fingerprint Matcher
                </span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-[#705D55] dark:text-[#A9B2C3]">
              No postmortems match your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
