import React, { useState } from 'react';
import {
  FileText,
  LayoutDashboard,
  GitFork,
  History,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Cpu,
  Layers,
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, sessionStats }) {
  const [collapsed, setCollapsed] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  const navItems = [
    {
      id: 'import',
      label: 'Home / Import',
      icon: FileText,
      badge: null,
      desc: 'Ingest or paste logs',
    },
    {
      id: 'dashboard',
      label: 'Incident Dashboard',
      icon: LayoutDashboard,
      badge: sessionStats?.incident_count ? `${sessionStats.incident_count}` : null,
      desc: 'Clustered template rankings',
    },
    {
      id: 'graph',
      label: 'Graph Analysis',
      icon: GitFork,
      badge: null,
      desc: 'Causality & Blast radius',
    },
    {
      id: 'timemachine',
      label: 'Time Machine',
      icon: History,
      badge: null,
      desc: 'Onset replay slider',
    },
    {
      id: 'ledger',
      label: 'Incident Ledger',
      icon: BookOpen,
      badge: null,
      desc: 'Postmortems & fixes',
    },
    {
      id: 'verify',
      label: 'Fix Verification',
      icon: CheckCircle2,
      badge: null,
      desc: 'Compare before / after',
    },
  ];

  return (
    <aside
      className={`h-[calc(100vh-4rem)] border-r border-[#E8DFD8] dark:border-[#272C3D] bg-white dark:bg-[#151821] flex flex-col justify-between transition-all duration-300 relative z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Navigation Items */}
      <div className="p-3 space-y-1 overflow-y-auto">
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          {!collapsed && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9C8980] dark:text-[#6B768E]">
              Intelligence Views
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md text-[#705D55] dark:text-[#A9B2C3] hover:bg-[#F5EFEB] dark:hover:bg-[#1C202C] transition-colors ml-auto"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-xl transition-all text-left group ${
                collapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 space-x-3'
              } ${
                isActive
                  ? 'bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] font-semibold shadow-sm border border-[#E8DFD8] dark:border-[#5A2718]'
                  : 'text-[#705D55] dark:text-[#A9B2C3] hover:bg-[#FAF8F5] dark:hover:bg-[#1C202C] hover:text-[#2C1810] dark:hover:text-[#F3EFEA]'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                  isActive
                    ? 'text-[#8C4A26] dark:text-[#E07A5F]'
                    : 'text-[#9C8980] dark:text-[#6B768E]'
                }`}
              />
              {!collapsed && (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="truncate">
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="text-[11px] text-[#9C8980] dark:text-[#6B768E] truncate">
                      {item.desc}
                    </p>
                  </div>
                  {item.badge && (
                    <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#8C4A26] dark:bg-[#E07A5F] text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine Status Footer */}
      <div className="p-3 border-t border-[#E8DFD8] dark:border-[#272C3D] bg-[#FAF8F5]/60 dark:bg-[#12151D]/60">
        {!collapsed ? (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3]">
              <span className="flex items-center space-x-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-[#8C4A26] dark:text-[#E07A5F]" />
                <span>Drain3 Miner</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between text-[#705D55] dark:text-[#A9B2C3]">
              <span className="flex items-center space-x-1.5 font-medium">
                <Database className="w-3.5 h-3.5 text-[#8C4A26] dark:text-[#E07A5F]" />
                <span>Fingerprint DB</span>
              </span>
              <span className="text-[10px] text-[#9C8980] dark:text-[#6B768E]">SQLite</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="System Online" />
          </div>
        )}
      </div>
    </aside>
  );
}
