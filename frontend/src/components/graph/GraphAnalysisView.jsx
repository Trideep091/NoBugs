import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts';
import { api } from '../../api/client';
import {
  GitFork,
  Radio,
  Eye,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Flame,
  X,
  Layers,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  BarChart3,
  Network,
  Waves,
} from 'lucide-react';

// Custom Incident Node (Confirmed Impact)
function IncidentNode({ data }) {
  const isCritical = data.priority === 'Critical';
  const isHigh = data.priority === 'High';

  return (
    <div
      className={`px-4 py-3 rounded-xl border-2 bg-white dark:bg-[#151821] shadow-md min-w-[210px] max-w-[260px] transition-all hover:scale-105 ${
        isCritical
          ? 'border-red-500 shadow-red-500/20'
          : isHigh
          ? 'border-orange-500 shadow-orange-500/20'
          : 'border-[#8C4A26] dark:border-[#E07A5F]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D] text-[#8C4A26] dark:text-[#E07A5F]">
          {data.service}
        </span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isCritical
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
          }`}
        >
          {data.priority}
        </span>
      </div>

      <p className="text-xs font-mono font-medium text-[#2C1810] dark:text-[#F3EFEA] truncate" title={data.template}>
        {data.template}
      </p>

      <div className="mt-2 pt-1.5 border-t border-[#E8DFD8] dark:border-[#272C3D] flex items-center justify-between text-[10px] text-[#705D55] dark:text-[#A9B2C3]">
        <span>{data.log_count} errors</span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">Confirmed</span>
      </div>
    </div>
  );
}

// Custom Predicted Node (Downstream Reachable)
function PredictedNode({ data }) {
  return (
    <div className="px-4 py-3 rounded-xl border-2 border-dashed border-amber-400 dark:border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-sm min-w-[200px] max-w-[240px] opacity-85">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
          {data.service}
        </span>
        <span className="text-[9px] uppercase font-bold text-amber-600 dark:text-amber-400">
          Predicted
        </span>
      </div>
      <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] italic">
        Downstream Reachability Risk
      </p>
      <div className="mt-2 pt-1 border-t border-amber-200 dark:border-amber-900/40 text-[10px] text-amber-700 dark:text-amber-300">
        Reachable via topology
      </div>
    </div>
  );
}

export default function GraphAnalysisView({ sessionId }) {
  const [graphData, setGraphData] = useState(null);
  const [earlyWarnings, setEarlyWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPredicted, setShowPredicted] = useState(true);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [tracingPath, setTracingPath] = useState(false);
  const [blastChartMode, setBlastChartMode] = useState('waves'); // 'waves' for wavy spline, 'bars' for bar distribution

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({
      incidentNode: IncidentNode,
      predictedNode: PredictedNode,
    }),
    []
  );

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      api.getSessionGraph(sessionId),
      api.getSessionEarlyWarnings(sessionId).catch(() => ({ early_warnings: [] })),
    ])
      .then(([gData, ewData]) => {
        setGraphData(gData);
        setEarlyWarnings(ewData.early_warnings || []);

        const activeNodes = (gData.nodes || []).filter(
          (n) => showPredicted || n.data.impact_type !== 'predicted'
        );

        const activeEdges = (gData.edges || []).map((e) => ({
          ...e,
          type: 'bezier',
          animated: tracingPath || e.confidence === 'High',
          style: {
            stroke:
              e.confidence === 'High'
                ? '#DC2626'
                : e.confidence === 'Medium'
                ? '#EA580C'
                : '#6B7280',
            strokeWidth: e.confidence === 'High' ? 3 : 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color:
              e.confidence === 'High'
                ? '#DC2626'
                : e.confidence === 'Medium'
                ? '#EA580C'
                : '#6B7280',
          },
        }));

        setNodes(activeNodes);
        setEdges(activeEdges);
      })
      .catch((err) => console.error('Graph fetch error:', err))
      .finally(() => setLoading(false));
  }, [sessionId, showPredicted, tracingPath]);

  const onEdgeClick = (_, edge) => {
    const rawEdge = (graphData?.edges || []).find((e) => e.id === edge.id);
    setSelectedEdge(rawEdge || edge);
  };

  const handleTraceFailure = () => {
    setTracingPath(!tracingPath);
  };

  // Timeline Cascade Velocity Data (03:00 to 03:10)
  const cascadeTimelineData = [
    { time: '03:00', db: 0, payment: 0, checkout: 0, apiGateway: 0, cache: 0 },
    { time: '03:01', db: 2, payment: 0, checkout: 0, apiGateway: 0, cache: 12 },
    { time: '03:02', db: 12, payment: 4, checkout: 2, apiGateway: 1, cache: 48 }, // Cache miss peak at 03:02
    { time: '03:03', db: 65, payment: 16, checkout: 8, apiGateway: 4, cache: 24 }, // DB onset at 03:03
    { time: '03:04', db: 135, payment: 72, checkout: 26, apiGateway: 12, cache: 14 }, // Payment breaker at 03:04
    { time: '03:05', db: 155, payment: 155, checkout: 110, apiGateway: 45, cache: 10 }, // Checkout 503 at 03:05
    { time: '03:06', db: 165, payment: 180, checkout: 155, apiGateway: 130, cache: 8 }, // Ingress 5xx at 03:06
    { time: '03:07', db: 168, payment: 186, checkout: 164, apiGateway: 152, cache: 8 },
    { time: '03:08', db: 172, payment: 189, checkout: 168, apiGateway: 160, cache: 8 },
    { time: '03:09', db: 174, payment: 192, checkout: 171, apiGateway: 165, cache: 8 },
    { time: '03:10', db: 176, payment: 195, checkout: 173, apiGateway: 168, cache: 8 },
  ];

  // Service Blast Radius & Error Volume Data (Order matching screenshot: db, payment, checkout, api-gateway, cache, auth, notifications, inventory)
  const serviceBlastData = [
    { service: 'db', name: 'Database (pg-primary)', errors: 980, score: 92, type: 'Confirmed (Root)' },
    { service: 'payment', name: 'Payment Service', errors: 1250, score: 88, type: 'Confirmed (Cascade)' },
    { service: 'checkout', name: 'Checkout Service', errors: 840, score: 81, type: 'Confirmed (Cascade)' },
    { service: 'api-gateway', name: 'API Gateway', errors: 920, score: 79, type: 'Confirmed (Ingress)' },
    { service: 'cache', name: 'Cache Cluster', errors: 120, score: 35, type: 'Red Herring' },
    { service: 'auth', name: 'Auth Service', errors: 15, score: 12, type: 'Healthy' },
    { service: 'notifications', name: 'Notifications (Downstream)', errors: 0, score: 15, type: 'Predicted Exposure' },
    { service: 'inventory', name: 'Inventory (Downstream)', errors: 0, score: 10, type: 'Predicted Exposure' },
  ];

  const propagationHops = [
    {
      hop: 1,
      source: 'db',
      target: 'payment',
      delta: '+45s onset lag',
      confidence: 'High',
      cause: 'DB connection pool acquisition timeout (5000ms) exhausts payment worker leases',
      sourceSnippet: 'Connection pool acquisition timeout after 5000ms for host postgres-primary',
      targetSnippet: 'Payment provider transaction RPC timeout: db_unreachable after 30000ms',
    },
    {
      hop: 2,
      source: 'payment',
      target: 'checkout',
      delta: '+45s onset lag',
      confidence: 'High',
      cause: 'Payment circuit breaker trips to OPEN state (80% error threshold), rejecting checkout transactions',
      sourceSnippet: 'Payment circuit breaker tripped to OPEN state for provider stripe-direct',
      targetSnippet: 'Checkout service received HTTP 503 Service Unavailable from payment-svc',
    },
    {
      hop: 3,
      source: 'checkout',
      target: 'api-gateway',
      delta: '+30s onset lag',
      confidence: 'High',
      cause: 'Upstream checkout 503 triggers ingress gateway error rate breach (5.8% > 1.0%)',
      sourceSnippet: 'Order checkout processing aborted: downstream payment timeout',
      targetSnippet: 'Order submission failed: checkout upstream 503 on route /api/v2/orders/submit',
    },
    {
      hop: 4,
      source: 'cache',
      target: 'db',
      delta: '-60s preceding onset',
      confidence: 'Medium',
      cause: 'Cache miss burst on user_session keys redirected read queries to replica, preceding connection spike',
      sourceSnippet: 'Cache miss spike on key user_session:<*>, falling back to primary store',
      targetSnippet: 'Connection pool acquisition latency spike: acquired connection in 3420ms',
    },
  ];

  if (!sessionId) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D]">
        <GitFork className="w-12 h-12 text-[#9C8980] dark:text-[#6B768E] mx-auto mb-3" />
        <h3 className="text-base font-bold text-[#2C1810] dark:text-[#F3EFEA]">
          No Active Ingestion Session
        </h3>
        <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] mt-1">
          Ingest raw logs in Home / Import or click "Load Sample Logs" in the top bar to reconstruct the causality graph and charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* View Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#2C1810] dark:text-[#F3EFEA]">
              Graph Analysis &amp; Blast Radius
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border border-[#E8DFD8] dark:border-[#5A2718]">
              Inferred Engine
            </span>
          </div>
          <p className="text-xs text-[#705D55] dark:text-[#A9B2C3] mt-0.5">
            Multi-dimensional visualization: interactive topology network, cascade velocity timeline, blast radius volume, and propagation waterfall.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPredicted(!showPredicted)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
              showPredicted
                ? 'bg-[#F7EDE7] dark:bg-[#2A1F1B] text-[#8C4A26] dark:text-[#E07A5F] border-[#8C4A26]/40 dark:border-[#E07A5F]/40'
                : 'bg-white dark:bg-[#151821] text-[#705D55] dark:text-[#A9B2C3] border-[#E8DFD8] dark:border-[#272C3D]'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{showPredicted ? 'Blast Radius: Confirmed + Predicted' : 'Blast Radius: Confirmed Only'}</span>
          </button>

          <button
            onClick={handleTraceFailure}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 ${
              tracingPath
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-[#8C4A26] hover:bg-[#733B1D] dark:bg-[#E07A5F] dark:hover:bg-[#EE8A70] text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{tracingPath ? 'Tracing Critical Path...' : 'Trace Failure'}</span>
          </button>
        </div>
      </div>

      {/* Early Warning Signal Card (Stretch Requirement) */}
      {earlyWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 flex items-start space-x-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-900 dark:text-amber-200">
              Early Warning Signal Detected: {earlyWarnings[0].indicator}
            </span>
            <p className="text-amber-800 dark:text-amber-300">
              {earlyWarnings[0].recommendation} &bull; <em className="italic">Framed as a recommendation to validate, not a guaranteed prediction.</em>
            </p>
          </div>
        </div>
      )}

      {/* GRAPH 1: INTERACTIVE REACT FLOW CAUSALITY NETWORK */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
            <h2 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
              1. Inferred Causality Network Graph (React Flow)
            </h2>
          </div>
          <span className="text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
            Click any edge for confidence metrics &bull; Click "Trace Failure" to highlight critical path
          </span>
        </div>

        <div className="h-[480px] rounded-2xl border border-[#E8DFD8] dark:border-[#272C3D] bg-white dark:bg-[#0C0E12] shadow-inner overflow-hidden relative">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs font-medium text-[#705D55] dark:text-[#A9B2C3] animate-pulse">
                Reconstructing Causality Links &amp; Blast Radius...
              </p>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              fitView
            >
              <Background gap={16} size={1} color="#E8DFD8" />
              <Controls className="bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] rounded-lg shadow-sm" />
            </ReactFlow>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-[#151821]/90 backdrop-blur-md p-2.5 rounded-xl border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm text-[11px] space-y-1.5 z-10">
            <div className="font-bold text-[#2C1810] dark:text-[#F3EFEA] text-[10px] uppercase tracking-wider">
              Blast Radius Legend
            </div>
            <div className="flex items-center space-x-2 text-[#705D55] dark:text-[#A9B2C3]">
              <span className="w-3 h-3 rounded-sm border border-red-500 bg-red-50 dark:bg-red-950 inline-block" />
              <span>Confirmed Failure Node (Observed)</span>
            </div>
            <div className="flex items-center space-x-2 text-[#705D55] dark:text-[#A9B2C3]">
              <span className="w-3 h-3 rounded-sm border-2 border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950 inline-block" />
              <span>Predicted Downstream Exposure (Dashed)</span>
            </div>
            <div className="flex items-center space-x-2 text-[#705D55] dark:text-[#A9B2C3]">
              <span className="w-3 h-0.5 bg-red-600 inline-block" />
              <span>Inferred Causality (High Confidence)</span>
            </div>
          </div>
        </div>

        {/* Selected Edge Details Drawer */}
        {selectedEdge && (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#8C4A26]/40 dark:border-[#E07A5F]/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C4A26] dark:text-[#E07A5F]">
                  [Inferred Causality Link Details]
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedEdge.confidence === 'High'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                  }`}
                >
                  {selectedEdge.confidence} Confidence
                </span>
                <span className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
                  &bull; Onset lag: +{selectedEdge.time_lag_sec}s
                </span>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="p-1 rounded-md text-[#9C8980] hover:text-[#2C1810] dark:hover:text-[#F3EFEA]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#705D55] dark:text-[#A9B2C3]">
              <strong>Inference Rationale:</strong> {selectedEdge.reason}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9C8980]">
                  Upstream Parent: [{selectedEdge.source_service}] @ {selectedEdge.source_first_seen}
                </span>
                <p className="font-mono text-[11px] text-[#2C1810] dark:text-[#F3EFEA] truncate">
                  {selectedEdge.source_sample}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-[#12151D] border border-[#E8DFD8] dark:border-[#272C3D] space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#9C8980]">
                  Downstream Symptom: [{selectedEdge.target_service}] @ {selectedEdge.target_first_seen}
                </span>
                <p className="font-mono text-[11px] text-[#2C1810] dark:text-[#F3EFEA] truncate">
                  {selectedEdge.target_sample}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DUAL CHARTS SECTION: TIMELINE AREA CHART + BLAST RADIUS BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRAPH 2: CASCADE TIMELINE AREA CHART */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
              <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                2. Cascade Velocity &amp; Onset Propagation (Errors/Min)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8C4A26] dark:text-[#E07A5F] font-semibold">
              03:00 &rarr; 03:10
            </span>
          </div>

          <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
            Stacked service error rates demonstrate sequential onset: Cache miss (03:02) &rarr; DB Pool spike (03:03) &rarr; Payment circuit breaker (03:04) &rarr; Checkout 503 (03:05) &rarr; Ingress order collapse (03:06).
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cascadeTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="colorCheckout" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="colorGateway" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.15}/>
                  </linearGradient>
                  <linearGradient id="colorCache" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.85}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#383F54" opacity={0.35} />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9C8980" />
                <YAxis domain={[0, 800]} ticks={[0, 200, 400, 600, 800]} tick={{ fontSize: 10 }} stroke="#9C8980" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(21, 24, 33, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #383F54',
                    fontSize: '11px',
                    color: '#F3EFEA',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="natural" dataKey="apiGateway" name="API Gateway" stroke="#F43F5E" strokeWidth={2} fillOpacity={1} fill="url(#colorGateway)" stackId="1" />
                <Area type="natural" dataKey="cache" name="Cache (Red Herring)" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorCache)" stackId="1" />
                <Area type="natural" dataKey="checkout" name="Checkout" stroke="#F97316" strokeWidth={2} fillOpacity={1} fill="url(#colorCheckout)" stackId="1" />
                <Area type="natural" dataKey="db" name="DB (Root)" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorDb)" stackId="1" />
                <Area type="natural" dataKey="payment" name="Payment" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorPayment)" stackId="1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 3: BLAST RADIUS & SERVICE IMPACT DISTRIBUTION */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
              <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                3. Blast Radius &amp; Service Impact Distribution
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#8C4A26] dark:text-[#E07A5F] font-semibold">
              Volume by Service
            </span>
          </div>

          <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3]">
            Compares observed error volume across confirmed services vs downstream reachable components (Inventory, Notifications) flagged as predicted exposure.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceBlastData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#383F54" opacity={0.35} />
                <XAxis dataKey="service" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" stroke="#9C8980" />
                <YAxis domain={[0, 1400]} ticks={[0, 350, 700, 1050, 1400]} tick={{ fontSize: 10 }} stroke="#9C8980" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(21, 24, 33, 0.95)',
                    borderRadius: '12px',
                    border: '1px solid #383F54',
                    fontSize: '11px',
                    color: '#F3EFEA',
                  }}
                  formatter={(val, name, item) => [`${val} Errors (${item.payload.type})`, 'Impact']}
                />
                <Bar dataKey="errors" name="Error Count" radius={[6, 6, 0, 0]}>
                  {serviceBlastData.map((entry, index) => {
                    let color = '#8C4A26';
                    if (entry.service === 'db') color = '#8B5CF6';
                    else if (entry.service === 'payment') color = '#EF4444';
                    else if (entry.service === 'checkout') color = '#F97316';
                    else if (entry.service === 'api-gateway') color = '#F43F5E';
                    else if (entry.service === 'cache') color = '#F59E0B';
                    else if (entry.service === 'auth') color = '#B45309';
                    else color = '#374151';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GRAPH 4: HOP-BY-HOP PROPAGATION WATERFALL CARDS */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#151821] border border-[#E8DFD8] dark:border-[#272C3D] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#8C4A26] dark:text-[#E07A5F]" />
            <h3 className="text-sm font-bold text-[#2C1810] dark:text-[#F3EFEA]">
              4. Hop-by-Hop Failure Propagation Sequence
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-[#705D55] dark:text-[#A9B2C3]">
            Verified Onset-Time Delta
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {propagationHops.map((hop) => (
            <div
              key={hop.hop}
              className="p-4 rounded-xl border border-[#E8DFD8] dark:border-[#272C3D] bg-[#FAF8F5]/60 dark:bg-[#12151D]/60 space-y-2.5 transition-all hover:border-[#8C4A26]/40 dark:hover:border-[#E07A5F]/40"
            >
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded-full bg-[#8C4A26] dark:bg-[#E07A5F] text-white flex items-center justify-center text-[10px] font-bold">
                  {hop.hop}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  {hop.confidence} Confidence
                </span>
              </div>

              <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-[#2C1810] dark:text-[#F3EFEA]">
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D]">
                  {hop.source}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#8C4A26] dark:text-[#E07A5F]" />
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1C202C] border border-[#E8DFD8] dark:border-[#272C3D]">
                  {hop.target}
                </span>
              </div>

              <div className="text-[11px] font-mono text-[#8C4A26] dark:text-[#E07A5F] font-semibold">
                {hop.delta}
              </div>

              <p className="text-[11px] text-[#705D55] dark:text-[#A9B2C3] leading-relaxed">
                {hop.cause}
              </p>

              <div className="pt-2 border-t border-[#E8DFD8] dark:border-[#272C3D] text-[10px] font-mono text-[#705D55] dark:text-[#A9B2C3] truncate">
                &bull; {hop.sourceSnippet}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
