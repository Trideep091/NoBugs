import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  FileCode,
  RotateCcw,
} from 'lucide-react';

export default function LogIngestionSection({ onIngestSuccess, onLoadSample, isProcessing }) {
  // File drag & drop state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Paste text state
  const [pastedText, setPastedText] = useState('');
  const [textTitle, setTextTitle] = useState('Pasted Log Window');

  // Progress state
  const [progressStep, setProgressStep] = useState(0); // 0 = idle, 1 = stream, 2 = privacy, 3 = drain3, 4 = scoring
  const [errorMsg, setErrorMsg] = useState(null);

  // Prevent browser from navigating away if file is dropped outside zone
  useEffect(() => {
    const handleWindowDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleWindowDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);

  // Handle Drag & Drop with counter to prevent child element flickering
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      submitFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      submitFile(file);
    }
    if (e.target) e.target.value = '';
  };

  const submitFile = async (file) => {
    if (!file) return;
    setErrorMsg(null);
    animateProgress();
    try {
      await onIngestSuccess({ type: 'file', file: file, title: file.name });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process log file.');
      setProgressStep(0);
    }
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    submitFile(file);
  };

  // Submission for File
  const handleFileSubmit = async () => {
    if (!selectedFile) return;
    await submitFile(selectedFile);
  };

  // Submission for Pasted Text
  const handleTextSubmit = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('Please paste some log text before analyzing.');
      return;
    }
    setErrorMsg(null);
    animateProgress();
    try {
      await onIngestSuccess({ type: 'text', raw_logs: pastedText, title: textTitle });
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process pasted logs.');
      setProgressStep(0);
    }
  };

  const animateProgress = () => {
    setProgressStep(1);
    setTimeout(() => setProgressStep(2), 250);
    setTimeout(() => setProgressStep(3), 550);
    setTimeout(() => setProgressStep(4), 850);
  };

  const loadSampleSnippet = () => {
    setPastedText(
`2026-10-10 03:02:40 WARN [cache] Cache miss spike on key user_session:8492, falling back to primary replica
2026-10-10 03:03:15 WARN [db] Connection pool acquisition latency spike: acquired connection in 3420ms for host 10.0.4.12:5432
2026-10-10 03:04:02 ERROR [db] Connection pool acquisition timeout after 5000ms for host postgres-primary-01.internal
2026-10-10 03:04:45 ERROR [payment] Payment provider transaction RPC timeout: db_unreachable after 30000ms for tx_849210 card=4111222233339182 email=buyer@example.com
2026-10-10 03:05:12 CRITICAL [payment] Payment circuit breaker tripped to OPEN state for provider stripe-direct: error threshold 80% exceeded
2026-10-10 03:05:30 ERROR [checkout] Checkout service received HTTP 503 Service Unavailable from upstream payment-svc for cart_10492
2026-10-10 03:06:01 ERROR [api-gateway] Order submission failed: checkout upstream 503 on route /api/v2/orders/submit for user_8492
2026-10-10 03:06:20 CRITICAL [api-gateway] Rate of 5xx errors exceeded alert threshold (5.8% > 1.0%) on cluster edge-us-east`
    );
    setTextTitle('Sample Onset Cascade');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* 1-Click Demo Incident Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-white via-[#FAF8F5] to-[#F7EDE7] dark:from-[#151821] dark:via-[#191D27] dark:to-[#2A1F1B] border border-[#E8DFD8] dark:border-[#383F54] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-[#8C4A26]/10 dark:bg-[#E07A5F]/20 text-[#8C4A26] dark:text-[#E07A5F] text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D3B] dark:text-[#F4A261]" />
            <span>Interactive Demo Ready</span>
          </div>
          <h2 className="text-xl font-bold text-[#2C1810] dark:text-[#F3EFEA]">
            10,000-Line Multi-Service Incident Story
          </h2>
          <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] max-w-2xl leading-relaxed">
            Instantly ingest a realistic production failure cascade across 6 services (<span className="font-mono text-[11px] font-medium text-[#8C4A26] dark:text-[#E07A5F]">api-gateway, checkout, payment, db, cache, auth</span>): slow pool acquisition &rarr; DB timeouts &rarr; payment circuit breaker &rarr; checkout 503s &rarr; customer order drop, with active red-herrings and sensitive token redaction.
          </p>
        </div>
        <button
          onClick={onLoadSample}
          disabled={isProcessing}
          className="flex-shrink-0 px-5 py-3 rounded-xl bg-gradient-to-r from-[#8C4A26] to-[#C86D3B] hover:from-[#7A3F1F] hover:to-[#B65D2E] dark:from-[#E07A5F] dark:to-[#F4A261] dark:hover:from-[#D1684B] dark:hover:to-[#E59350] text-white font-semibold text-xs shadow-md shadow-[#8C4A26]/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isProcessing ? 'Mining 10k Log Lines...' : 'Load 10,000 Sample Logs'}</span>
        </button>
      </div>

      {/* Progress State Indicator (Active when ingesting) */}
      {isProcessing && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#8C4A26]/30 dark:border-[#E07A5F]/30 shadow-lg animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F] animate-spin" />
              <span className="text-xs font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                Processing Ingestion Pipeline
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#8C4A26] dark:text-[#E07A5F]">
              Stage {progressStep || 1}/4
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
              progressStep >= 1 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-[#E8DFD8] dark:border-[#272C3D] opacity-50'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">1. Ingest Stream</span>
            </div>
            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
              progressStep >= 2 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-[#E8DFD8] dark:border-[#272C3D] opacity-50'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">2. Privacy Shield</span>
            </div>
            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
              progressStep >= 3 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-[#E8DFD8] dark:border-[#272C3D] opacity-50'
            }`}>
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">3. Drain3 Mining</span>
            </div>
            <div className={`p-2.5 rounded-lg border flex items-center space-x-2 ${
              progressStep >= 4 ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'border-[#E8DFD8] dark:border-[#272C3D] opacity-50'
            }`}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">4. Impact Scoring</span>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center space-x-3 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TWO SECTIONS: Section 1 Drag & Drop | Section 2 Copy & Paste */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: DRAG AND DROP FILE */}
        <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8] dark:border-[#272C3D]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8C4A26]/10 dark:bg-[#E07A5F]/20 flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F]">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    Section 1 &bull; Drag & Drop Log File
                  </h3>
                  <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
                    Upload raw files (.log, .txt, .json)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C202C] text-[#705D55] dark:text-[#A9B2C3] border border-[#E8DFD8] dark:border-[#272C3D]">
                Multi-format
              </span>
            </div>

            {/* Drop Zone Box */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
                dragActive
                  ? 'border-[#8C4A26] dark:border-[#E07A5F] bg-[#F7EDE7] dark:bg-[#2A1F1B] ring-4 ring-[#8C4A26]/20 dark:ring-[#E07A5F]/20 scale-[1.02]'
                  : selectedFile
                  ? 'border-emerald-400 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-[#D6C7BC] dark:border-[#383F54] hover:border-[#8C4A26] dark:hover:border-[#E07A5F] bg-[#FAF8F5]/60 dark:bg-[#12151D]/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".log,.txt,.json,.csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {dragActive ? (
                <div className="pointer-events-none space-y-2.5 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-[#8C4A26] dark:bg-[#E07A5F] text-white flex items-center justify-center mx-auto shadow-lg shadow-[#8C4A26]/20">
                    <UploadCloud className="w-8 h-8 animate-bounce" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#8C4A26] dark:text-[#E07A5F]">
                      Release to drop log file here
                    </p>
                    <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                      Ready to parse and cluster log stream
                    </p>
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2 pointer-events-auto">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA] max-w-[260px] truncate mx-auto">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Attached &amp; ready
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    className="text-[11px] text-[#8C4A26] dark:text-[#E07A5F] hover:underline"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pointer-events-none">
                  <div className="w-12 h-12 rounded-xl bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] flex items-center justify-center mx-auto">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#2C1810] dark:text-[#F3EFEA]">
                      Click or drag log file to this area
                    </p>
                    <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3] mt-0.5">
                      Supports up to 50,000 lines per file (JSON, Syslog, Apache/Nginx, Custom)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between">
            <span className="text-[11px] text-[#9C8980] dark:text-[#6B768E]">
              {selectedFile ? 'File attached' : 'No file selected'}
            </span>
            <button
              onClick={handleFileSubmit}
              disabled={!selectedFile || isProcessing}
              className="px-4 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isProcessing ? 'Ingesting...' : 'Ingest Log File'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION 2: COPY AND PASTE TEXT */}
        <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8DFD8] dark:border-[#272C3D]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8C4A26]/10 dark:bg-[#E07A5F]/20 flex items-center justify-center text-[#8C4A26] dark:text-[#E07A5F]">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    Section 2 &bull; Copy & Paste Log Content
                  </h3>
                  <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
                    Paste raw error dump directly from Datadog, Grafana, or terminal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadSampleSnippet}
                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] hover:underline border border-[#E8DFD8] dark:border-[#5A2718]"
              >
                Paste Sample Snippet
              </button>
            </div>

            {/* Paste Textarea */}
            <div className="relative">
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste raw log lines here... e.g.&#10;2026-10-10 03:00:01 ERROR [payment] timeout...&#10;2026-10-10 03:00:02 ERROR [db] Connection pool timeout..."
                rows={9}
                className="w-full p-3.5 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs font-mono text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-2 focus:ring-[#8C4A26] dark:focus:ring-[#E07A5F] transition-all resize-none leading-relaxed"
              />
              {pastedText && (
                <button
                  type="button"
                  onClick={() => setPastedText('')}
                  className="absolute right-3 top-3 p-1 rounded-md bg-white dark:bg-[#1C202C] text-[#9C8980] hover:text-[#DC2626] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm text-[10px]"
                  title="Clear text"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between">
            <div className="text-[11px] text-[#9C8980] dark:text-[#6B768E]">
              {pastedText.trim()
                ? `${pastedText.split('\n').filter((l) => l.trim()).length} lines ready`
                : '0 lines entered'}
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!pastedText.trim() || isProcessing}
              className="px-4 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>{isProcessing ? 'Analyzing...' : 'Analyze Pasted Logs'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
