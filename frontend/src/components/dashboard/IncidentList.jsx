import React, { useState } from 'react';
import {
  TrendingUp,
  Minus,
  TrendingDown,
  AlertOctagon,
  Clock,
  Layers,
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Sparkles,
  Download,
} from 'lucide-react';

export default function IncidentList({ incidents, onSelectIncident }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  if (!incidents || incidents.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D]">
        <Layers className="w-10 h-10 text-[#9C8980] dark:text-[#6B768E] mx-auto mb-3" />
        <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
          No Incidents Found
        </h3>
        <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] mt-1">
          Ingest raw logs or load the sample incident to extract clustered templates.
        </p>
      </div>
    );
  }

  // Filter incidents
  const filtered = incidents.filter((inc) => {
    const matchesPriority =
      priorityFilter === 'ALL' || inc.priority.toUpperCase() === priorityFilter.toUpperCase();
    const matchesSearch =
      searchQuery === '' ||
      inc.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inc.services || []).some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPriority && matchesSearch;
  });

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60 ring-1 ring-red-500/20';
      case 'High':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/60';
      case 'Mild':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend.includes('accelerating')) {
      return (
        <span className="inline-flex items-center space-x-1 text-red-600 dark:text-red-400 font-semibold text-[11px]">
          <TrendingUp className="w-3.5 h-3.5 animate-bounce" />
          <span>Accelerating</span>
        </span>
      );
    }
    if (trend.includes('resolved') || trend.includes('decaying')) {
      return (
        <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Decaying</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-[#705D55] dark:text-[#A9B2C3] font-medium text-[11px]">
        <Minus className="w-3.5 h-3.5" />
        <span>Flat / Ongoing</span>
      </span>
    );
  };

  // Helper to format templates with highlighted <*>
  const renderTemplateHighlight = (template) => {
    const parts = template.split(/(<\*>)/g);
    return parts.map((part, i) => {
      if (part === '<*>') {
        return (
          <span
            key={i}
            className="px-1 py-0.2 mx-0.5 rounded text-[10px] font-mono font-bold bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718]"
          >
            &lt;*&gt;
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-2xl shadow-sm overflow-hidden">
      {/* Header with Search and Priority Filters */}
      <div className="p-4 sm:p-5 border-b border-[#E8DFD8] dark:border-[#272C3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#8C4A26]/10 dark:bg-[#E07A5F]/20 flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F]">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2C1810] dark:text-[#F3EFEA]">
              Ranked Incident Patterns
            </h3>
            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
              Sorted by composite impact score (severity &times; frequency &times; blast radius &times; rate of change)
            </p>
          </div>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9C8980] dark:text-[#6B768E] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter template or service..."
              className="pl-8 pr-3 py-1.5 text-xs bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-lg text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26] dark:focus:ring-[#E07A5F] w-48 sm:w-56"
            />
          </div>

          {/* Priority filter buttons */}
          <div className="flex items-center bg-[#FAF8F5] dark:bg-[#12151D] p-0.5 rounded-lg border border-[#E8DFD8] dark:border-[#272C3D] text-[11px]">
            {['ALL', 'CRITICAL', 'HIGH', 'MILD'].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  priorityFilter === p
                    ? 'bg-white dark:bg-[#1C202C] text-[#8C4A26] dark:text-[#E07A5F] shadow-xs'
                    : 'text-[#705D55] dark:text-[#A9B2C3] hover:text-[#2C1810] dark:hover:text-[#F3EFEA]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export JSON Report Button */}
          <button
            onClick={() => {
              const exportData = {
                title: "NoBugs Incident Summary Report",
                exported_at: new Date().toISOString(),
                total_patterns: incidents.length,
                incidents: incidents.map(inc => ({
                  id: inc.id,
                  priority: inc.priority,
                  score: inc.score,
                  template: inc.template,
                  services: inc.services,
                  log_count: inc.log_count,
                  first_seen: inc.first_seen,
                  last_seen: inc.last_seen,
                  trend: inc.trend,
                  error_rate_per_min: inc.error_rate_per_min,
                  doubling_time_sec: inc.doubling_time_sec,
                  time_to_saturation: inc.time_to_saturation,
                  sample_lines: inc.sample_lines
                }))
              };
              const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nobugs_incident_report_${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] hover:bg-[#F5EFEB] dark:hover:bg-[#2A1F1B] text-xs font-semibold text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718] transition-colors shadow-xs"
            title="Download Incident Summaries as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (JSON)</span>
          </button>
        </div>
      </div>

      {/* Incident List Rows */}
      <div className="divide-y divide-[#E8DFD8] dark:divide-[#272C3D]">
        {filtered.map((inc, index) => (
          <div
            key={inc.id || inc.cluster_id}
            onClick={() => onSelectIncident && onSelectIncident(inc)}
            className="p-4 sm:p-5 hover:bg-[#FAF8F5]/80 dark:hover:bg-[#191D27] cursor-pointer transition-colors group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            {/* Left: Priority badge + Template + Services */}
            <div className="flex items-start space-x-3.5 flex-1 min-w-0">
              {/* Rank and Priority */}
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <span className="text-[10px] font-mono font-bold text-[#9C8980] dark:text-[#6B768E] mb-1">
                  #{index + 1}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${getPriorityBadgeClass(
                    inc.priority
                  )}`}
                >
                  {inc.priority}
                </span>
              </div>

              {/* Template Body */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-xs sm:text-sm font-mono text-[#2C1810] dark:text-[#F3EFEA] font-medium leading-relaxed group-hover:text-[#8C4A26] dark:group-hover:text-[#E07A5F] transition-colors break-words">
                  {renderTemplateHighlight(inc.template)}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
                  {/* Service badges */}
                  <div className="flex items-center space-x-1">
                    {(inc.services || []).map((svc) => (
                      <span
                        key={svc}
                        className="px-2 py-0.5 rounded-md bg-[#FAF8F5] dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D] font-mono text-[10px] text-[#705D55] dark:text-[#A9B2C3]"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>

                  <span>&bull;</span>

                  {/* First seen */}
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-[#9C8980]" />
                    <span>Onset: {inc.first_seen || 'N/A'}</span>
                  </span>

                  <span>&bull;</span>

                  {/* Rate of change */}
                  <span>{inc.error_rate_per_min || 0} err/min</span>
                </div>
              </div>
            </div>

            {/* Right: Metrics & Trend + CTA */}
            <div className="flex items-center justify-between lg:justify-end space-x-6 flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8DFD8]/60 dark:border-[#272C3D]/60">
              {/* Count */}
              <div className="text-right">
                <span className="text-base font-extrabold text-[#2C1810] dark:text-[#F3EFEA]">
                  {inc.log_count?.toLocaleString()}
                </span>
                <span className="block text-[10px] uppercase font-semibold text-[#9C8980] dark:text-[#6B768E]">
                  Logs
                </span>
              </div>

              {/* Trend */}
              <div className="text-right min-w-[110px]">
                {getTrendIcon(inc.trend)}
                <span className="block text-[10px] text-[#9C8980] dark:text-[#6B768E]">
                  {inc.time_to_saturation !== 'insufficient data' ? inc.time_to_saturation : 'Trend status'}
                </span>
              </div>

              {/* Score pill */}
              <div className="text-right min-w-[50px]">
                <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D]">
                  <span className="text-xs font-mono font-bold text-[#8C4A26] dark:text-[#E07A5F]">
                    {inc.score}
                  </span>
                </div>
                <span className="block text-[10px] text-[#9C8980] dark:text-[#6B768E]">Score</span>
              </div>

              {/* Action Chevron */}
              <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] text-[#705D55] dark:text-[#A9B2C3] group-hover:bg-[#8C4A26] dark:group-hover:bg-[#E07A5F] group-hover:text-white flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-[#705D55] dark:text-[#A9B2C3]">
            No incidents matched your search filter "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
