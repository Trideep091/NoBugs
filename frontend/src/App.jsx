import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppShell from './components/layout/AppShell';
import LogIngestionSection from './components/ingestion/LogIngestionSection';
import StatCards from './components/dashboard/StatCards';
import IncidentList from './components/dashboard/IncidentList';
import IncidentModal from './components/dashboard/IncidentModal';
import GraphAnalysisView from './components/graph/GraphAnalysisView';
import TimeMachineView from './components/timemachine/TimeMachineView';
import LedgerView from './components/ledger/LedgerView';
import FixVerificationView from './components/verification/FixVerificationView';
import { api } from './api/client';
import { ShieldAlert, Sparkles, Layers, Cpu, History, Database, ArrowRight } from 'lucide-react';

function DashboardContent({ activeTab, setActiveTab }) {
  const [session, setSession] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [ledgerIncidentFocus, setLedgerIncidentFocus] = useState(null);

  // Ingestion handler for File and Pasted Text
  const handleIngest = async (data) => {
    setIsProcessing(true);
    try {
      let result;
      if (data.type === 'file') {
        result = await api.ingestFile(data.file, data.title);
      } else {
        result = await api.ingestText(data.raw_logs, data.title);
      }
      setSession(result.session);
      setIncidents(result.incidents);
      setActiveTab('dashboard');
    } finally {
      setIsProcessing(false);
    }
  };

  // 1-Click Sample Ingestion Handler (10,000 lines)
  const handleLoadSample = async () => {
    setIsProcessing(true);
    try {
      const result = await api.ingestSample();
      setSession(result.session);
      setIncidents(result.incidents);
      setActiveTab('dashboard');
    } catch (err) {
      alert(`Failed to load sample incident: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenLedgerWithIncident = (inc) => {
    setLedgerIncidentFocus(inc);
    setSelectedIncident(null);
    setActiveTab('ledger');
  };

  return (
    <AppShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      sessionStats={session}
      onLoadSampleLogs={handleLoadSample}
      isLoadingSample={isProcessing}
    >
      {/* TAB 1: Home / Import (Drag & Drop + Copy/Paste) */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
                Log Stream Ingestion
              </h1>
              <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                Drag and drop raw logs or paste dumps to discover incident patterns without regexes.
              </p>
            </div>
            {session && (
              <button
                onClick={() => setActiveTab('dashboard')}
                className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718] text-xs font-semibold flex items-center space-x-1.5 hover:bg-[#EEDFD5] dark:hover:bg-[#382823] transition-colors"
              >
                <span>Active Session ({incidents.length} Incidents)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <LogIngestionSection
            onIngestSuccess={handleIngest}
            onLoadSample={handleLoadSample}
            isProcessing={isProcessing}
          />

          {session && (
            <div className="pt-6 border-t border-[#E8DFD8] dark:border-[#272C3D] space-y-4">
              <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                Current Session Summary
              </h3>
              <StatCards session={session} incidents={incidents} />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Incident Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
                Incident Dashboard
              </h1>
              <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                {session
                  ? `Showing results for: ${session.title}`
                  : 'No active session loaded. Import logs to see ranked incidents.'}
              </p>
            </div>

            <button
              onClick={() => setActiveTab('import')}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#151821] text-[#705D55] dark:text-[#A9B2C3] border border-[#E8DFD8] dark:border-[#272C3D] text-xs font-medium hover:text-[#2C1810] dark:hover:text-[#F3EFEA] transition-colors"
            >
              + Ingest New Logs
            </button>
          </div>

          {session ? (
            <>
              <StatCards session={session} incidents={incidents} />
              <IncidentList
                incidents={incidents}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            </>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] space-y-4">
              <Layers className="w-12 h-12 text-[#8C4A26] dark:text-[#E07A5F] mx-auto opacity-70" />
              <div>
                <h3 className="text-base font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                  No Ingested Logs Yet
                </h3>
                <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] max-w-sm mx-auto mt-1">
                  Upload a log file, paste raw lines, or click below to launch the 10k-line demo incident.
                </p>
              </div>
              <button
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-md transition-all inline-flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Load 10k Demo Logs</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Graph Analysis (Causality & Blast Radius) */}
      {activeTab === 'graph' && (
        <GraphAnalysisView sessionId={session?.session_id} />
      )}

      {/* TAB 4: Time Machine (Replay Animation & Onset Contrast) */}
      {activeTab === 'timemachine' && (
        <TimeMachineView incidents={incidents} session={session} />
      )}

      {/* TAB 5: Incident Ledger (Postmortems & Fingerprint Matching) */}
      {activeTab === 'ledger' && (
        <LedgerView initialIncident={ledgerIncidentFocus} />
      )}

      {/* TAB 6: Fix Verification (Before vs After Diff & Verdict) */}
      {activeTab === 'verify' && (
        <FixVerificationView sessionId={session?.session_id} />
      )}

      {/* Incident Modal (Milestone 3 AI Investigation) */}
      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onOpenLedgerWithIncident={handleOpenLedgerWithIncident}
        />
      )}
    </AppShell>
  );
}

function MainApp() {
  const [activeTab, setActiveTab] = useState('import');
  return <DashboardContent activeTab={activeTab} setActiveTab={setActiveTab} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
