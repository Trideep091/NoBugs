import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, ShieldAlert, LogOut, User, Activity, Sparkles } from 'lucide-react';

export default function Navbar({ onLoadSampleLogs, isLoadingSample }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#E8DFD8] dark:border-[#272C3D] bg-white/80 dark:bg-[#151821]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Brand & Tagline */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#0C0E12] flex items-center justify-center shadow-md shadow-[#8C4A26]/10 border border-[#E8DFD8] dark:border-[#383F54] transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="NoBugs Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
                NoBugs
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718]">
                v1.0
              </span>
            </div>
            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] font-normal hidden sm:block">
              Find the signal in the noise.
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls & User */}
      <div className="flex items-center space-x-3">
        {onLoadSampleLogs && (
          <button
            onClick={onLoadSampleLogs}
            disabled={isLoadingSample}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#F7EDE7] hover:bg-[#EEDFD5] dark:bg-[#2A1F1B] dark:hover:bg-[#382823] text-[#8C4A26] dark:text-[#F4A261] border border-[#E8DFD8] dark:border-[#5A2718] transition-all disabled:opacity-50 shadow-sm"
            title="Load 10,000-line realistic multi-service cascade failure scenario"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C86D3B] dark:text-[#F4A261] flex-shrink-0" />
            <span className="hidden sm:inline">{isLoadingSample ? 'Clustering 10k Logs...' : 'Load Sample Logs'}</span>
            <span className="inline sm:hidden">{isLoadingSample ? 'Clustering...' : 'Sample Logs'}</span>
          </button>
        )}

        {/* Live On-Call indicator */}
        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#FAF8F5] dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D] text-xs text-[#705D55] dark:text-[#A9B2C3]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-[11px]">3 AM Guard Active</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#705D55] dark:text-[#A9B2C3] hover:bg-[#F5EFEB] dark:hover:bg-[#1C202C] border border-transparent hover:border-[#E8DFD8] dark:hover:border-[#272C3D] transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-[#8C4A26]" />
          )}
        </button>

        {/* User Badge / Logout */}
        {user && (
          <div className="flex items-center space-x-2 pl-2 border-l border-[#E8DFD8] dark:border-[#272C3D]">
            <div className="flex items-center space-x-2 bg-[#FAF8F5] dark:bg-[#1C202C] px-2.5 py-1 rounded-lg border border-[#E8DFD8] dark:border-[#272C3D]">
              <div className="w-5 h-5 rounded-full bg-[#8C4A26]/10 dark:bg-[#E07A5F]/20 flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F] font-bold text-[10px]">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium text-[#2C1810] dark:text-[#F3EFEA] max-w-[100px] truncate">
                {user.name || user.email}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#9C8980] hover:text-[#DC2626] dark:text-[#6B768E] dark:hover:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
