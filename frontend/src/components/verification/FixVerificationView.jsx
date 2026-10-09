import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ClipboardPaste,
  Sparkles,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  FileCheck,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';

export default function FixVerificationView({ sessionId }) {
  const [postfixText, setPostfixText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    if (!sessionId) {
      setError('No active baseline session. Please ingest baseline logs first.');
      return;
    }
    if (!postfixText.trim() && !selectedFile) {
      setError('Please provide post-fix logs via text or file.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyFix(sessionId, postfixText, selectedFile);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Verification analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePostfixLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const sample = await api.getSamplePostfixLogs();
      setPostfixText(sample.content);
      // Auto-trigger verification
      const res = await api.verifyFix(sessionId, sample.content, null);
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to load post-fix sample logs.');
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D]">
        <FileCheck className="w-12 h-12 text-[#9C8980] dark:text-[#6B768E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#2C1810] dark:text-[#F3EFEA]">
          No Baseline Session Active
        </h3>
        <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] mt-1">
          Ingest a log window in Home / Import first to establish the baseline incident patterns before verifying a fix.
        </p>
      </div>
    );
  }

  const getVerdictBadge = (verdict) => {
    switch (verdict) {
      case 'RESOLVED':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 ring-2 ring-emerald-500/20';
      case 'MITIGATED':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
      case 'REGRESSED':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 ring-2 ring-red-500/20';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
            Post-Fix Log Verification
          </h1>
          <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
            Upload or paste a post-patch log window to verify whether error patterns decreased, persisted, or regressed.
          </p>
        </div>

        <button
          onClick={loadSamplePostfixLogs}
          disabled={loading}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-all disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{loading ? 'Verifying...' : 'Load & Verify Post-Fix Logs (1-Click)'}</span>
        </button>
      </div>

      {/* Input Box for Post-fix Logs */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
          Post-Fix Log Window Ingestion
        </h3>

        <div className="space-y-2">
          <textarea
            rows={5}
            value={postfixText}
            onChange={(e) => setPostfixText(e.target.value)}
            placeholder="Paste post-fix log lines here to evaluate error rate reduction..."
            className="w-full p-3.5 bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] rounded-xl text-xs font-mono text-[#2C1810] dark:text-[#F3EFEA] focus:outline-none focus:ring-1 focus:ring-[#8C4A26] resize-none"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] text-[#9C8980] dark:text-[#6B768E]">
            {postfixText.trim()
              ? `${postfixText.split('\n').filter((l) => l.trim()).length} post-fix lines entered`
              : 'Awaiting post-patch logs'}
          </span>
          <button
            onClick={handleVerify}
            disabled={loading || !postfixText.trim()}
            className="px-5 py-2 rounded-xl bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating...' : 'Run Fix Verification'}</span>
          </button>
        </div>
      </div>

      {/* Verification Results Panel */}
      {result && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Verdict Banner */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9C8980] dark:text-[#6B768E]">
                  Official Verdict
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${getVerdictBadge(
                    result.verdict
                  )}`}
                >
                  {result.verdict}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#2C1810] dark:text-[#F3EFEA]">
                {result.summary}
              </p>
            </div>

            <div className="flex items-center space-x-6 flex-shrink-0">
              <div className="text-right">
                <span className="text-2xl font-extrabold text-[#2C1810] dark:text-[#F3EFEA]">
                  {result.before_error_count?.toLocaleString()}
                </span>
                <span className="block text-[10px] uppercase font-semibold text-[#9C8980]">
                  Before Errors
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#9C8980]" />
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {result.after_error_count?.toLocaleString()}
                </span>
                <span className="block text-[10px] uppercase font-semibold text-[#9C8980]">
                  After Errors
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  -{result.reduction_pct}%
                </span>
                <span className="block text-[10px] uppercase font-semibold text-[#9C8980]">
                  Reduction
                </span>
              </div>
            </div>
          </div>

          {/* Pattern by Pattern Comparison Table */}
          <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E8DFD8] dark:border-[#272C3D]">
              <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                Incident Pattern Status Breakdown
              </h3>
            </div>

            <div className="divide-y divide-[#E8DFD8] dark:divide-[#272C3D]">
              {result.pattern_comparison.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1 min-w-0 pr-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FAF8F5] dark:bg-[#1C202C] text-[#705D55] dark:text-[#A9B2C3]">
                        {p.service}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'ELIMINATED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : p.status === 'DECREASED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.status} ({p.delta_pct}%)
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#2C1810] dark:text-[#F3EFEA] truncate" title={p.template}>
                      {p.template}
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 flex-shrink-0 text-right">
                    <div>
                      <span className="font-mono font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                        {p.before_count}
                      </span>
                      <span className="block text-[10px] text-[#9C8980]">Before</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#9C8980]" />
                    <div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {p.after_count}
                      </span>
                      <span className="block text-[10px] text-[#9C8980]">After</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
