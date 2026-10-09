const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('nobugs_token');
  const headers = {
    ...(options.headers || {}),
  };

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg = response.statusText || 'Request failed';
    if (data?.detail) {
      if (typeof data.detail === 'string') {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof data.detail === 'object') {
        errorMsg = JSON.stringify(data.detail);
      }
    }
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  register: (name, email, password) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => apiRequest('/auth/me'),

  // Logs Ingestion & Sessions
  ingestFile: (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return apiRequest('/logs/ingest', {
      method: 'POST',
      body: formData,
    });
  },
  ingestText: (raw_logs, title) => {
    const formData = new FormData();
    formData.append('raw_logs', raw_logs);
    if (title) formData.append('title', title);
    return apiRequest('/logs/ingest', {
      method: 'POST',
      body: formData,
    });
  },
  ingestSample: () =>
    apiRequest('/logs/ingest-sample', {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  getSampleText: () => apiRequest('/logs/sample'),
  getSessions: () => apiRequest('/logs/sessions'),
  getSession: (sessionId) => apiRequest(`/logs/session/${sessionId}`),

  // Incidents, AI & Causality Graph
  getAiInvestigation: (incidentId) =>
    apiRequest(`/incidents/${incidentId}/ai-investigation`),
  challengeAiTheory: (incidentId, challengeFocus) =>
    apiRequest(`/incidents/${incidentId}/challenge`, {
      method: 'POST',
      body: JSON.stringify({ challenge_focus: challengeFocus }),
    }),
  getSessionGraph: (sessionId) =>
    apiRequest(`/incidents/session/${sessionId}/graph`),
  getSessionEarlyWarnings: (sessionId) =>
    apiRequest(`/incidents/session/${sessionId}/early-warning`),
  getSimilarLedger: (incidentId) =>
    apiRequest(`/incidents/${incidentId}/similar-ledger`),

  // Incident Ledger
  getLedgerEntries: () => apiRequest('/ledger'),
  createLedgerEntry: (entry) =>
    apiRequest('/ledger', {
      method: 'POST',
      body: JSON.stringify(entry),
    }),

  // Fix Verification
  verifyFix: (baselineSessionId, postfixLogs, file) => {
    const formData = new FormData();
    formData.append('baseline_session_id', baselineSessionId);
    if (file) formData.append('file', file);
    if (postfixLogs) formData.append('postfix_logs', postfixLogs);
    return apiRequest('/verification/verify', {
      method: 'POST',
      body: formData,
    });
  },
  getSamplePostfixLogs: () => apiRequest('/verification/sample-postfix'),

  // Health
  health: () => apiRequest('/health'),
};
