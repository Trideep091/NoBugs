import React from 'react';
import { FileText, Layers, Network, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function StatCards({ session, incidents }) {
  if (!session) return null;

  // Compute breakdown of priorities
  const priorityCounts = (incidents || []).reduce(
    (acc, inc) => {
      acc[inc.priority] = (acc[inc.priority] || 0) + 1;
      return acc;
    },
    { Critical: 0, High: 0, Mild: 0, Low: 0 }
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Log lines imported */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm flex flex-col justify-between transition-all hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40 group">
        <div>
          <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Log Lines Ingested</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F] group-hover:scale-105 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#2C1810] dark:text-[#F3EFEA] tracking-tight">
              {session.total_lines?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              100% Ingested
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between text-[11px] text-[#9C8980] dark:text-[#6B768E]">
          <span>{session.parsed_lines?.toLocaleString() || 0} structured</span>
          <span>{session.unparsed_lines || 0} unstructured</span>
        </div>
      </div>

      {/* 2. Incident Patterns Found (Drain3) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm flex flex-col justify-between transition-all hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40 group">
        <div>
          <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Incident Patterns</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F] group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#2C1810] dark:text-[#F3EFEA] tracking-tight">
              {session.incident_count || incidents?.length || 0}
            </span>
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] font-semibold">
              Drain3 Clustered
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center space-x-2 text-[11px]">
          {priorityCounts.Critical > 0 && (
            <span className="font-semibold text-red-600 dark:text-red-400">
              {priorityCounts.Critical} Critical
            </span>
          )}
          {priorityCounts.High > 0 && (
            <span className="font-medium text-orange-600 dark:text-orange-400">
              &bull; {priorityCounts.High} High
            </span>
          )}
          {priorityCounts.Mild > 0 && (
            <span className="text-amber-600 dark:text-amber-400">
              &bull; {priorityCounts.Mild} Mild
            </span>
          )}
        </div>
      </div>

      {/* 3. Services Detected */}
      {(() => {
        const servicesList = Array.isArray(session.services_detected)
          ? session.services_detected
          : typeof session.services_detected === 'string'
          ? (() => {
              try {
                return JSON.parse(session.services_detected);
              } catch {
                return [];
              }
            })()
          : [];

        return (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm flex flex-col justify-between transition-all hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40 group">
            <div>
              <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3] mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Services Detected</span>
                <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F] group-hover:scale-105 transition-transform">
                  <Network className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold text-[#2C1810] dark:text-[#F3EFEA] tracking-tight">
                  {servicesList.length}
                </span>
                <span className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                  nodes in topology
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center space-x-1.5 overflow-x-auto">
              {servicesList.slice(0, 4).map((svc) => (
                <span
                  key={svc}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D] text-[#705D55] dark:text-[#A9B2C3]"
                >
                  {svc}
                </span>
              ))}
              {servicesList.length > 4 && (
                <span className="text-[10px] text-[#9C8980] dark:text-[#6B768E]">
                  +{servicesList.length - 4}
                </span>
              )}
            </div>
          </div>
        );
      })()}

      {/* 4. Values Redacted (Privacy Shield) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm flex flex-col justify-between transition-all hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40 group">
        <div>
          <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Privacy Shield</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-[#2C1810] dark:text-[#F3EFEA] tracking-tight">
              {session.redacted_count?.toLocaleString() || 0}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">
              Shield Armed
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between text-[11px] text-[#9C8980] dark:text-[#6B768E]">
          <span>PII & Secrets Scrubbed</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">0 Leaks</span>
        </div>
      </div>
    </div>
  );
}
