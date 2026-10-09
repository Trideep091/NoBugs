import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppShell({
  activeTab,
  setActiveTab,
  sessionStats,
  onLoadSampleLogs,
  isLoadingSample,
  children,
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] dark:bg-[#0C0E12] text-[#2C1810] dark:text-[#F3EFEA] transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        onLoadSampleLogs={onLoadSampleLogs}
        isLoadingSample={isLoadingSample}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sessionStats={sessionStats}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
