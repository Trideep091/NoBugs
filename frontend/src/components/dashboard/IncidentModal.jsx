import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Terminal,
  ArrowRight,
  Flame,
  Brain,
  History,
  RotateCcw,
} from 'lucide-react';

export default function IncidentModal({ incident, onClose, onOpenLedgerWithIncident }) {
  const [analysis, setAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(true);
  const [challenging, setChallenging] = useState(false);
  const [similarLedger, setSimilarLedger] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!incident) return;

    let isMounted = true;
    setLoadingAi(true);
    setError(null);

    // Fetch AI investigation & similar ledger match
    Promise.all([
      api.getAiInvestigation(incident.id),
      api.getSimilarLedger(incident.id).catch(() => ({ match: null })),
    ])
      .then(([aiRes, ledgerRes]) => {
        if (!isMounted) return;
        setAnalysis(aiRes);
        if (ledgerRes && ledgerRes.match) {
          setSimilarLedger(ledgerRes.match);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to fetch AI investigation.');
      })
      .finally(() => {
        if (isMounted) setLoadingAi(false);
      });

    return () => {
      isMounted = false;
    };
  }, [incident]);

  const handleChallenge = async () => {
    if (!incident || !analysis) return;
    setChallenging(true);
    try {
      const topHypothesis = analysis.hypotheses?.[0]?.title || incident.template;
      const res = await api.challengeAiTheory(incident.id, topHypothesis);
      setAnalysis(res);
    } catch (err) {
      alert(`Challenge request failed: ${err.message}`);
    } finally {
      setChallenging(false);
    }
  };

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col transition-all">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[#E8DFD8] dark:border-[#272C3D] flex items-start justify-between gap-4 bg-[#FAF8F5]/60 dark:bg-[#12151D]/60 flex-shrink-0">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  incident.priority === 'Critical'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    : incident.priority === 'High'
                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {incident.priority} Incident
              </span>
              <span className="text-xs font-mono font-semibold text-[#8C4A26] dark:text-[#E07A5F] px-2 py-0.5 rounded bg-[#F7EDE7] dark:bg-[#2A1F1B]">
                Score: {incident.score} pts
              </span>
              <span className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                {incident.log_count?.toLocaleString()} occurrences
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold font-mono text-[#2C1810] dark:text-[#F3EFEA] break-words">
              {incident.template}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#9C8980] hover:text-[#2C1810] dark:hover:text-[#F3EFEA] hover:bg-[#FAF8F5] dark:hover:bg-[#1C202C] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loadingAi ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8C4A26] to-[#C86D3B] dark:from-[#E07A5F] dark:to-[#F4A261] flex items-center justify-center text-white mx-auto animate-spin">
                <Brain className="w-5 h-5" />
              </div>
              <p className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                Claude AI SRE Investigator Synthesizing Incident...
              </p>
              <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] max-w-sm mx-auto">
                Analyzing redacted cluster templates, error timestamps, and evaluating competing root-cause hypotheses.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          ) : analysis ? (
            <>
              {/* Executive Summary Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-white dark:from-[#191D27] dark:to-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#8C4A26] dark:text-[#E07A5F] text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#C86D3B] dark:text-[#F4A261]" />
                    <span>AI Diagnosis &bull; {analysis.mode || 'Claude AI'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-[#705D55] dark:text-[#A9B2C3]">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Onset: {analysis.start_time || incident.first_seen}</span>
                  </div>
                </div>

                <p className="text-sm text-[#2C1810] dark:text-[#F3EFEA] leading-relaxed">
                  {analysis.explanation}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#705D55] dark:text-[#A9B2C3]">
                    Impacted Services:
                  </span>
                  {(analysis.affected_services || incident.services || []).map((svc) => (
                    <span
                      key={svc}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718]"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>

              {/* Similar Ledger Match (if found) */}
              {similarLedger && (
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 flex items-start justify-between gap-3">
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center space-x-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        Similar to Past Incident #{similarLedger.ledger_id}: {similarLedger.title} ({similarLedger.similarity_score}% Match)
                      </span>
                    </div>
                    <p className="text-emerald-700 dark:text-emerald-300/80">
                      <strong className="font-semibold">Fix That Worked Before:</strong> {similarLedger.fix_applied}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                    {similarLedger.outcome}
                  </span>
                </div>
              )}

              {/* 3 Competing Hypotheses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    3 Competing Root-Cause Hypotheses
                  </h3>
                  <button
                    onClick={handleChallenge}
                    disabled={challenging}
                    className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#1C202C] hover:bg-[#F5EFEB] dark:hover:bg-[#252B3B] text-xs font-semibold text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#272C3D] transition-all disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${challenging ? 'animate-spin' : ''}`} />
                    <span>{challenging ? 'Re-evaluating...' : 'Challenge This Theory'}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(analysis.hypotheses || []).map((hypo, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border transition-all ${
                        idx === 0
                          ? 'border-[#8C4A26]/40 dark:border-[#E07A5F]/40 bg-white dark:bg-[#151821] shadow-xs'
                          : 'border-[#E8DFD8] dark:border-[#272C3D] bg-[#FAF8F5]/50 dark:bg-[#12151D]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              idx === 0
                                ? 'bg-[#8C4A26] dark:bg-[#E07A5F] text-white'
                                : 'bg-[#E8DFD8] dark:bg-[#272C3D] text-[#705D55] dark:text-[#A9B2C3]'
                            }`}
                          >
                            {hypo.rank || idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                            {hypo.title}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#8C4A26] dark:text-[#E07A5F]">
                          {hypo.probability_pct}% Probability
                        </span>
                      </div>

                      {/* Supporting Evidence Lines */}
                      {hypo.supporting_evidence?.length > 0 && (
                        <div className="space-y-1 mb-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9C8980] dark:text-[#6B768E]">
                            Supporting Log Lines:
                          </span>
                          <div className="space-y-1">
                            {hypo.supporting_evidence.map((line, lIdx) => (
                              <div
                                key={lIdx}
                                className="p-1.5 rounded bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] font-mono text-[11px] text-[#705D55] dark:text-[#A9B2C3] truncate"
                              >
                                &ldquo;{line}&rdquo;
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Contrary Evidence */}
                      {hypo.contrary_evidence && (
                        <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                          <strong className="font-semibold">Contrary Evidence / Doubt: </strong>
                          {hypo.contrary_evidence}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Test & Next Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Distinguishing test */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    <Terminal className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
                    <span>Distinguishing Diagnostic Test</span>
                  </div>
                  <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] leading-relaxed">
                    Execute this check to definitively confirm Hypothesis 1:
                  </p>
                  <div className="p-2.5 rounded-lg bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] font-mono text-xs text-[#8C4A26] dark:text-[#E07A5F] break-all select-all">
                    {analysis.distinguishing_test}
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="p-4 rounded-xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Recommended Immediate Action</span>
                  </div>
                  <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] leading-relaxed">
                    Prioritized on-call mitigation:
                  </p>
                  <p className="text-xs font-medium text-[#2C1810] dark:text-[#F3EFEA] bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40">
                    {analysis.recommended_action}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#E8DFD8] dark:border-[#272C3D] bg-[#FAF8F5]/60 dark:bg-[#12151D]/60 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => onOpenLedgerWithIncident && onOpenLedgerWithIncident(incident)}
            className="text-xs text-[#8C4A26] dark:text-[#E07A5F] hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Record Fix in Incident Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1C202C] hover:bg-[#F5EFEB] dark:hover:bg-[#252B3B] text-xs font-semibold text-[#705D55] dark:text-[#A9B2C3] border border-[#E8DFD8] dark:border-[#272C3D] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
