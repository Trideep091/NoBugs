import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  Activity,
  Layers,
  Flame,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FastForward,
} from 'lucide-react';

export default function TimeMachineView({ incidents, session }) {
  const [currentSecond, setCurrentSecond] = useState(0); // Starts at 02:00:00 (Baseline)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Playback timer (7200 seconds = 2-hour timeline)
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentSecond((prev) => {
          if (prev >= 7200) {
            setIsPlaying(false);
            return 7200;
          }
          return Math.min(7200, prev + 10 * playbackSpeed);
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const formatTimestamp = (sec) => {
    const baseHour = 2; // 02:00:00
    const totalSec = baseHour * 3600 + sec;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Determine active failure phase across 2-hour timeline
  const getPhaseInfo = (sec) => {
    if (sec < 2400) {
      return {
        title: 'Phase 0 • Baseline Traffic (02:00 - 02:40)',
        status: 'Healthy',
        desc: 'Routine HTTP requests, auth token verifications, and background vacuuming (~1,450 req/s).',
        color: 'text-emerald-600 dark:text-emerald-400',
        badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    }
    if (sec < 3900) {
      return {
        title: 'Phase 1 • Early Warning & Mild Drift (02:40 - 03:05)',
        status: 'Mild',
        desc: 'Cache miss rate spiked on user_session keys; query acquisition latency elevated to 1,200ms.',
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      };
    }
    if (sec < 5700) {
      return {
        title: 'Phase 2 • ROOT CAUSE CASCADE: Critical Collapse (03:05 - 03:35)',
        status: 'Critical',
        desc: 'Connection pool saturation (475 timeouts). Payment circuit breaker tripped OPEN. Checkout returning 503.',
        color: 'text-red-600 dark:text-red-400',
        badge: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
      };
    }
    if (sec < 6600) {
      return {
        title: 'Phase 3 • Mild Recovery in Progress (03:35 - 03:50)',
        status: 'Mild',
        desc: 'PgBouncer multiplexer deployed. Payment circuit breaker in HALF-OPEN probe state.',
        color: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      };
    }
    return {
      title: 'Phase 4 • Fully Recovered Baseline (03:50 - 04:00)',
      status: 'Healthy',
      desc: 'All HTTP 5xx errors eliminated. Connection pool latency returned to baseline 12ms.',
      color: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    };
  };

  const currentPhase = getPhaseInfo(currentSecond);

  // Compute status per service based on currentSecond: Healthy (Green), Mild (Yellow), Critical (Red)
  const getServiceHealth = (svc) => {
    if (currentSecond < 2400) return 'Healthy';
    if (currentSecond < 3900) {
      return (svc === 'cache' || svc === 'db') ? 'Mild' : 'Healthy';
    }
    if (currentSecond < 5700) {
      return svc === 'cache' ? 'Mild' : 'Critical';
    }
    if (currentSecond < 6600) {
      return 'Mild';
    }
    return 'Healthy';
  };

  const services = ['db', 'payment', 'checkout', 'api-gateway', 'cache', 'auth'];

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
            Incident Time Machine
          </h1>
          <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
            Replay and animate the chronological cascade from baseline to root-cause onset and multi-service collapse.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2 bg-white dark:bg-[#151821] p-1.5 rounded-xl border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white transition-colors"
            title={isPlaying ? 'Pause' : 'Play replay'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              setCurrentSecond(0);
              setIsPlaying(true);
            }}
            className="p-2 rounded-lg text-[#705D55] dark:text-[#A9B2C3] hover:bg-[#FAF8F5] dark:hover:bg-[#1C202C] transition-colors"
            title="Restart replay from 03:00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 2 : playbackSpeed === 2 ? 5 : 1)}
            className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg text-[#8C4A26] dark:text-[#E07A5F] bg-[#F7EDE7] dark:bg-[#2A1F1B] border border-[#E8DFD8] dark:border-[#5A2718]"
            title="Toggle playback speed"
          >
            {playbackSpeed}x Speed
          </button>
        </div>
      </div>

      {/* Main Slider & Timestamp Cockpit */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8DFD8] dark:border-[#272C3D]">
          <div>
            <span className="text-xs uppercase font-bold text-[#9C8980] dark:text-[#6B768E]">
              Simulation Timeline
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
                {formatTimestamp(currentSecond)}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${currentPhase.badge}`}>
                {currentPhase.status}
              </span>
            </div>
          </div>

          <div className="text-right sm:max-w-md">
            <span className={`text-xs font-bold ${currentPhase.color}`}>
              {currentPhase.title}
            </span>
            <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3] mt-0.5">
              {currentPhase.desc}
            </p>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={7200}
            step={5}
            value={currentSecond}
            onChange={(e) => setCurrentSecond(Number(e.target.value))}
            className="w-full h-2.5 bg-[#E8DFD8] dark:bg-[#272C3D] rounded-lg appearance-none cursor-pointer accent-[#8C4A26] dark:accent-[#E07A5F]"
          />
          <div className="flex justify-between text-[11px] font-mono text-[#9C8980] dark:text-[#6B768E]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">02:00:00 (Baseline)</span>
            <span>02:30:00 (Normal)</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">03:00:00 (Mild Drift)</span>
            <span className="text-red-600 dark:text-red-400 font-bold">03:30:00 (Critical Peak)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">04:00:00 (Recovered)</span>
          </div>
        </div>

        {/* Live Service Degradation Grid */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#9C8980] dark:text-[#6B768E] block mb-3">
            Real-time Service Health at {formatTimestamp(currentSecond)}
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {services.map((svc) => {
              const health = getServiceHealth(svc);
              return (
                <div
                  key={svc}
                  className={`p-3.5 rounded-xl border text-center transition-all ${
                    health === 'Critical'
                      ? 'border-red-500 bg-red-50/50 dark:bg-red-950/30'
                      : health === 'Degraded' || health === 'Warning'
                      ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30'
                      : 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20'
                  }`}
                >
                  <span className="text-xs font-mono font-bold uppercase text-[#2C1810] dark:text-[#F3EFEA] block truncate">
                    {svc}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider mt-1 block ${
                      health === 'Critical'
                        ? 'text-red-700 dark:text-red-400'
                        : health === 'Degraded' || health === 'Warning'
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {health}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Before vs After Onset Comparison Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
          Telemetry Contrast: Before vs After Onset
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 space-y-2">
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
              BEFORE ONSET (03:00:00 &ndash; 03:02:59)
            </span>
            <ul className="space-y-1.5 text-emerald-900/80 dark:text-emerald-300/80 leading-relaxed">
              <li>&bull; DB connection pool acquisition: average 8ms (pool capacity 20)</li>
              <li>&bull; Payment gateway response time: 42ms nominal</li>
              <li>&bull; Checkout HTTP status distribution: 99.8% 200 OK</li>
              <li>&bull; Ingress 5xx error rate: 0.02%</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 space-y-2">
            <span className="font-bold text-red-800 dark:text-red-300 text-xs">
              AFTER ONSET (03:03:00 &ndash; 03:10:00)
            </span>
            <ul className="space-y-1.5 text-red-900/80 dark:text-red-300/80 leading-relaxed">
              <li>&bull; DB connection pool lease wait: timeout &gt; 5000ms (100% saturation)</li>
              <li>&bull; Payment circuit breaker: tripped to OPEN state (80% failure rate)</li>
              <li>&bull; Checkout service response: HTTP 503 Service Unavailable</li>
              <li>&bull; Ingress 5xx error rate: 5.8% (290&times; surge over baseline)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
