/* ==========================================================================
   NoBugs Standalone Application Logic (Pure Vanilla JavaScript)
   Zero Dependencies • Interactive Demo Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 0. Standalone Authentication Logic (Login Page Gateway)
  const authScreen = document.getElementById('standalone-auth-screen');
  const loginForm = document.getElementById('standalone-login-form');
  const fillDemoBtn = document.getElementById('auth-fill-demo-btn');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const signoutBtn = document.getElementById('standalone-signout-btn');
  const userLabel = document.getElementById('oncall-user-label');

  const isLoggedIn = localStorage.getItem('nobugs_standalone_session') === 'active';
  if (isLoggedIn && authScreen) {
    authScreen.classList.add('hidden');
    if (userLabel) userLabel.textContent = '3 AM Engineer (oncall)';
  }

  if (fillDemoBtn && emailInput && passwordInput) {
    fillDemoBtn.addEventListener('click', () => {
      emailInput.value = 'oncall@nobugs.io';
      passwordInput.value = 'oncall3am';
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      localStorage.setItem('nobugs_standalone_session', 'active');
      if (authScreen) authScreen.classList.add('hidden');
      if (userLabel) userLabel.textContent = '3 AM Engineer (oncall)';
      switchTab('import');
    });
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', () => {
      localStorage.removeItem('nobugs_standalone_session');
      if (authScreen) authScreen.classList.remove('hidden');
      if (userLabel) userLabel.textContent = '3 AM Guard Active';
    });
  }

  // 1. Theme Management (Light / Dark Mode)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const currentTheme = localStorage.getItem('nobugs_standalone_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const active = document.documentElement.getAttribute('data-theme');
      const next = active === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('nobugs_standalone_theme', next);
    });
  }

  // 2. Tab Navigation
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  function switchTab(tabId) {
    navItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === `tab-${tabId}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // 3. Demo Ingestion Simulation (10,000 Log Lines)
  const loadDemoBtns = document.querySelectorAll('.btn-load-demo');
  const dashboardStats = document.getElementById('dashboard-stats');
  const incidentListContainer = document.getElementById('incident-list-container');
  const navBadge = document.getElementById('incident-nav-badge');

  const demoIncidents = [
    {
      id: 1,
      rank: 1,
      priority: 'Critical',
      score: 94.5,
      service: 'payment',
      template: 'payment] Payment circuit breaker tripped to OPEN state for provider stripe-direct: error threshold <*>% exceeded',
      count: 425,
      trend: 'Accelerating (+18/min)',
      onset: '03:04:12'
    },
    {
      id: 2,
      rank: 2,
      priority: 'Critical',
      score: 91.2,
      service: 'db',
      template: 'db] Connection pool acquisition timeout after <*> for host postgres-primary-<*>.internal',
      count: 475,
      trend: 'Accelerating (+14/min)',
      onset: '03:03:00'
    },
    {
      id: 3,
      rank: 3,
      priority: 'Critical',
      score: 88.0,
      service: 'api-gateway',
      template: 'api-gateway] Rate of 5xx errors exceeded alert threshold (<*>.<*>% > <*>.<*>%) on cluster edge-us-east',
      count: 398,
      trend: 'Accelerating (+12/min)',
      onset: '03:05:40'
    },
    {
      id: 4,
      rank: 4,
      priority: 'Critical',
      score: 84.7,
      service: 'checkout',
      template: 'checkout] Order checkout processing aborted: downstream payment timeout after <*>',
      count: 396,
      trend: 'Ongoing',
      onset: '03:05:10'
    },
    {
      id: 5,
      rank: 5,
      priority: 'High',
      score: 72.1,
      service: 'checkout',
      template: 'checkout] Checkout service received HTTP <*> Service Unavailable from upstream payment-svc for cart_crt_<*>',
      count: 400,
      trend: 'Ongoing',
      onset: '03:05:15'
    },
    {
      id: 6,
      rank: 6,
      priority: 'Mild',
      score: 41.3,
      service: 'cache',
      template: 'cache] Cache miss spike on key user_session:<*>, falling back to primary replica',
      count: 215,
      trend: 'Decaying',
      onset: '03:02:40'
    }
  ];
 
  let activeIncidents = [...demoIncidents];

  function loadDemoData() {
    activeIncidents = [...demoIncidents];
    if (navBadge) {
      navBadge.textContent = '21';
      navBadge.style.display = 'inline-block';
    }

    // Reset 4 stat cards to baseline 10,000 incident cascade
    const statLogs = document.getElementById('stat-total-logs');
    const statSpeed = document.getElementById('stat-speed-sub');
    const statPatterns = document.getElementById('stat-total-patterns');
    const statServices = document.getElementById('stat-total-services');
    const statServicesSub = document.getElementById('stat-services-sub');
    const statSecrets = document.getElementById('stat-scrubbed-secrets');
    const subTitle = document.getElementById('dashboard-session-subtitle');

    if (statLogs) statLogs.textContent = '10,000';
    if (statSpeed) statSpeed.textContent = 'Processed in 0.27s';
    if (statPatterns) statPatterns.textContent = '21';
    if (statServices) statServices.textContent = '7';
    if (statServicesSub) statServicesSub.textContent = 'db, payment, checkout, api-gateway...';
    if (statSecrets) statSecrets.textContent = '3,887';
    if (subTitle) {
      subTitle.textContent = 'Clustered and ranked templates extracted via Drain3 mining & dynamic impact scoring.';
    }

    renderIncidentList(demoIncidents);
    switchTab('dashboard');
  }

  loadDemoBtns.forEach(btn => {
    btn.addEventListener('click', loadDemoData);
  });

  // Client-side Privacy Shield + Drain3 Template Mining Engine
  function processCustomLogContent(rawText, sourceTitle) {
    if (!rawText || !rawText.trim()) {
      alert('The provided log content is empty. Please provide valid log lines.');
      return;
    }

    const rawLines = rawText.split('\n').filter(l => l.trim().length > 0);
    if (rawLines.length === 0) {
      alert('No valid log lines found to process.');
      return;
    }

    const startTime = performance.now();

    // 1. Privacy Shield Secret Redaction Regexes
    let scrubbedCount = 0;
    const reJwt = /bearer\s+[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/gi;
    const reCard = /\b(?:\d{4}[-\s]?){3}\d{4}\b/g;
    const reApiKey = /(api[_-]?key|token|secret|password|passwd|auth)[=:\s]+["']?([A-Za-z0-9_\-\.]{8,})["']?/gi;

    // 2. Structured Parse & Mining
    const templateMap = new Map();
    const detectedServices = new Set();
    const knownServices = ['payment', 'db', 'postgres', 'checkout', 'api-gateway', 'gateway', 'cache', 'redis', 'auth', 'nginx', 'ingress', 'worker', 'search', 'billing', 'cart', 'order'];

    rawLines.forEach((line) => {
      // Redaction count
      const jwtMatches = line.match(reJwt);
      if (jwtMatches) scrubbedCount += jwtMatches.length;
      const cardMatches = line.match(reCard);
      if (cardMatches) scrubbedCount += cardMatches.length;
      const keyMatches = line.match(reApiKey);
      if (keyMatches) scrubbedCount += keyMatches.length;

      // Cleaned line for mining
      let cleanLine = line
        .replace(reJwt, '[REDACTED_JWT]')
        .replace(reCard, '[REDACTED_CARD]')
        .replace(reApiKey, '$1=[REDACTED_SECRET]');

      // Detect Log Level
      let priority = 'Mild';
      if (/\b(CRITICAL|FATAL|SEVERE)\b/i.test(cleanLine)) {
        priority = 'Critical';
      } else if (/\b(ERROR|FAIL|FAILURE)\b/i.test(cleanLine)) {
        priority = 'Critical';
      } else if (/\b(WARN|WARNING)\b/i.test(cleanLine)) {
        priority = 'High';
      } else {
        priority = 'Mild';
      }

      // Detect Service
      let service = 'app';
      const svcBracketMatch = cleanLine.match(/\[([a-zA-Z0-9_\-]+)\]/);
      if (svcBracketMatch && !/^(info|warn|warning|error|fatal|debug|trace)$/i.test(svcBracketMatch[1])) {
        service = svcBracketMatch[1].toLowerCase();
      } else {
        const lower = cleanLine.toLowerCase();
        for (const ks of knownServices) {
          if (lower.includes(ks)) {
            service = ks;
            break;
          }
        }
      }
      detectedServices.add(service);

      // Extract Onset / Timestamp
      let onset = '03:00:00';
      const timeMatch = cleanLine.match(/(\d{2}:\d{2}:\d{2})/);
      if (timeMatch) onset = timeMatch[1];

      // Strip timestamps, dates, brackets, log levels from message to extract core template
      let msg = cleanLine
        .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?/g, '')
        .replace(/[A-Za-z]{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}/g, '')
        .replace(/\b(CRITICAL|FATAL|ERROR|SEVERE|WARNING|WARN|INFO|DEBUG|TRACE)\b/gi, '')
        .replace(/^[ \t\-\:\[\]\|]+/, '')
        .trim();

      // Drain3 Wildcard Generalization (replace dynamic variables with <*>)
      let template = msg
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<*>') // UUID
        .replace(/0x[0-9a-fA-F]+|[0-9a-fA-F]{16,}/g, '<*>') // Hex hashes
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, '<*>') // IP:port
        .replace(/\b(order|cart|user|tx|req|cust|session)_[A-Za-z0-9_\-]+/gi, '$1_<*>') // Identifiers
        .replace(/\b\d+(?:\.\d+)?(?:ms|s|m|%|kb|mb|gb|b)?\b/gi, '<*>') // Numbers & metrics
        .replace(/"[^"]+"/g, '"<*>"') // Quoted values
        .replace(/<+[\* ]*>+/g, '<*>') // Collapse multiple wildcards
        .replace(/\s+/g, ' ')
        .trim();

      if (!template || template === '<*>' || template.length < 5) {
        template = `${service}] ${cleanLine.slice(0, 80)}`;
      } else if (!template.toLowerCase().includes(service)) {
        template = `${service}] ${template}`;
      }

      if (!templateMap.has(template)) {
        templateMap.set(template, {
          template,
          service,
          priority,
          count: 0,
          onset,
          samples: []
        });
      }

      const cluster = templateMap.get(template);
      cluster.count += 1;
      if (cluster.samples.length < 3) {
        cluster.samples.push(line);
      }
      if (priority === 'Critical') cluster.priority = 'Critical';
      else if (priority === 'High' && cluster.priority !== 'Critical') cluster.priority = 'High';
    });

    const elapsedSec = ((performance.now() - startTime) / 1000 + 0.04).toFixed(2);

    // Compute Impact Scores & Rank
    const sortedClusters = Array.from(templateMap.values())
      .map((c, idx) => {
        const severityWeight = c.priority === 'Critical' ? 45 : c.priority === 'High' ? 28 : 14;
        const countWeight = Math.min(50, Math.log2(c.count + 1) * 9);
        const score = Number((severityWeight + countWeight).toFixed(1));
        const trend = c.count > 10 ? 'Accelerating (+' + Math.min(35, Math.ceil(c.count / 8)) + '/min)' : 'Ongoing';
        return {
          id: idx + 1,
          rank: idx + 1,
          priority: c.priority,
          score,
          service: c.service,
          template: c.template,
          count: c.count,
          trend,
          onset: c.onset,
          samples: c.samples
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

    activeIncidents = sortedClusters;

    // Update 4 Dashboard Stat Cards
    const statLogs = document.getElementById('stat-total-logs');
    const statSpeed = document.getElementById('stat-speed-sub');
    const statPatterns = document.getElementById('stat-total-patterns');
    const statServices = document.getElementById('stat-total-services');
    const statServicesSub = document.getElementById('stat-services-sub');
    const statSecrets = document.getElementById('stat-scrubbed-secrets');
    const subTitle = document.getElementById('dashboard-session-subtitle');

    if (statLogs) statLogs.textContent = rawLines.length.toLocaleString();
    if (statSpeed) statSpeed.textContent = `Processed in ${elapsedSec}s`;
    if (statPatterns) statPatterns.textContent = sortedClusters.length.toLocaleString();
    if (statServices) statServices.textContent = detectedServices.size.toString();
    if (statServicesSub) {
      const svcList = Array.from(detectedServices).slice(0, 4).join(', ');
      statServicesSub.textContent = svcList + (detectedServices.size > 4 ? '...' : '');
    }
    if (statSecrets) statSecrets.textContent = scrubbedCount.toLocaleString();
    if (subTitle) {
      subTitle.textContent = `Showing active results for: ${sourceTitle} (${rawLines.length.toLocaleString()} lines, ${sortedClusters.length} patterns)`;
    }

    if (navBadge) {
      navBadge.textContent = sortedClusters.length.toString();
      navBadge.style.display = 'inline-block';
    }

    renderIncidentList(sortedClusters);
    switchTab('dashboard');
  }

  // Render Incident List
  function renderIncidentList(items) {
    if (!incidentListContainer) return;
    incidentListContainer.innerHTML = '';

    items.forEach(inc => {
      const row = document.createElement('div');
      row.className = 'incident-row';
      row.addEventListener('click', () => openIncidentModal(inc));

      const formattedTemplate = inc.template.replace(/<\*>/g, '<span class="wildcard">&lt;*&gt;</span>');

      row.innerHTML = `
        <div class="incident-info">
          <span class="incident-rank">#${inc.rank}</span>
          <span class="badge badge-${inc.priority.toLowerCase()}">${inc.priority}</span>
          <div style="flex:1; min-width:0;">
            <div class="incident-template">${formattedTemplate}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.25rem;">
              Service: <strong>${inc.service}</strong> &bull; Onset: ${inc.onset} &bull; Score: ${inc.score} pts
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-family:var(--font-mono); font-weight:700; font-size:0.85rem;">${inc.count.toLocaleString()}</div>
          <div style="font-size:0.68rem; color:${inc.trend.includes('Accelerating') ? '#DC2626' : '#10B981'}; font-weight:600;">${inc.trend}</div>
        </div>
      `;

      incidentListContainer.appendChild(row);
    });
  }

  // 4. Modal Dialog (Claude AI Investigation)
  const modalBackdrop = document.getElementById('incident-modal');
  const closeModalBtn = document.getElementById('modal-close-btn');
  const challengeBtn = document.getElementById('modal-challenge-btn');

  function openIncidentModal(inc) {
    if (!modalBackdrop) return;
    document.getElementById('modal-incident-title').textContent = inc.template;
    const prioBadge = document.getElementById('modal-incident-priority');
    if (prioBadge) {
      prioBadge.textContent = `${inc.priority} Incident (${inc.score} pts)`;
      prioBadge.className = `badge badge-${inc.priority.toLowerCase()}`;
    }
    const onsetEl = document.getElementById('modal-incident-onset');
    if (onsetEl) onsetEl.textContent = `Onset: ${inc.onset || '03:00:00'}`;
    const descEl = document.getElementById('modal-incident-desc');
    if (descEl) {
      descEl.innerHTML = `Automated Drain3 tree analysis clustered <strong>${inc.count.toLocaleString()} occurrences</strong> in service <code>${inc.service}</code>. Velocity trend: <strong>${inc.trend}</strong>. Calculated composite impact: <strong>${inc.score} pts</strong>.`;
    }
    modalBackdrop.classList.add('open');
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modalBackdrop.classList.remove('open');
    });
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('open');
      }
    });
  }

  if (challengeBtn) {
    challengeBtn.addEventListener('click', () => {
      const origText = challengeBtn.textContent;
      challengeBtn.textContent = 'Re-evaluating with Claude...';
      challengeBtn.disabled = true;

      setTimeout(() => {
        alert('Claude AI re-evaluated contrary evidence: Confirmed PostgreSQL connection pool starvation as 92% root cause over Redis cache spike.');
        challengeBtn.textContent = origText;
        challengeBtn.disabled = false;
      }, 700);
    });
  }

  // 5. Time Machine Replay Logic
  const timeSlider = document.getElementById('tm-slider');
  const timeDisplay = document.getElementById('tm-time-display');
  const playBtn = document.getElementById('tm-play-btn');
  const restartBtn = document.getElementById('tm-restart-btn');
  const speedBtn = document.getElementById('tm-speed-btn');

  let isPlaying = false;
  let playInterval = null;
  let playSpeed = 1;

  function formatTime(sec) {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `03:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function updateHealthGrid(sec) {
    const dbStatus = document.getElementById('status-db');
    const paymentStatus = document.getElementById('status-payment');
    const checkoutStatus = document.getElementById('status-checkout');
    const gatewayStatus = document.getElementById('status-gateway');

    if (dbStatus) dbStatus.textContent = sec < 180 ? 'Healthy' : sec < 240 ? 'Degraded' : 'CRITICAL';
    if (paymentStatus) paymentStatus.textContent = sec < 250 ? 'Healthy' : sec < 310 ? 'Degraded' : 'CRITICAL';
    if (checkoutStatus) checkoutStatus.textContent = sec < 300 ? 'Healthy' : sec < 360 ? 'Degraded' : 'CRITICAL';
    if (gatewayStatus) gatewayStatus.textContent = sec < 350 ? 'Healthy' : 'CRITICAL';
  }

  if (timeSlider) {
    timeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (timeDisplay) timeDisplay.textContent = formatTime(val);
      updateHealthGrid(val);
    });
  }

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      playBtn.textContent = isPlaying ? 'Pause' : 'Play';

      if (isPlaying) {
        playInterval = setInterval(() => {
          let cur = parseInt(timeSlider.value, 10);
          if (cur >= 600) {
            isPlaying = false;
            playBtn.textContent = 'Play';
            clearInterval(playInterval);
            return;
          }
          cur += 5 * playSpeed;
          timeSlider.value = cur;
          timeDisplay.textContent = formatTime(cur);
          updateHealthGrid(cur);
        }, 150);
      } else {
        clearInterval(playInterval);
      }
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      timeSlider.value = 0;
      timeDisplay.textContent = '03:00:00';
      updateHealthGrid(0);
    });
  }

  if (speedBtn) {
    speedBtn.addEventListener('click', () => {
      playSpeed = playSpeed === 1 ? 2 : playSpeed === 2 ? 5 : 1;
      speedBtn.textContent = `${playSpeed}x Speed`;
    });
  }

  // 6. Fix Verification Demo
  const verifyBtn = document.getElementById('btn-verify-demo');
  const verifyResult = document.getElementById('verify-results');

  if (verifyBtn && verifyResult) {
    verifyBtn.addEventListener('click', () => {
      verifyBtn.textContent = 'Evaluating Post-Fix Window...';
      verifyBtn.disabled = true;

      setTimeout(() => {
        verifyResult.style.display = 'block';
        verifyBtn.textContent = 'Load & Verify Post-Fix Logs (1-Click)';
        verifyBtn.disabled = false;
      }, 500);
    });
  }

  // 7. Interactive Drag & Drop File Processing for Standalone Build
  const dropZone = document.getElementById('standalone-drop-zone');
  const fileInput = document.getElementById('file-upload-input');
  const fileStatus = document.getElementById('standalone-file-status');
  const processBtn = document.getElementById('standalone-process-btn');
  const dropZoneIcon = document.getElementById('drop-zone-icon');
  const dropZoneText = document.getElementById('drop-zone-text');
  let loadedFile = null;

  function handleStandaloneFile(file) {
    loadedFile = file;
    if (fileStatus) fileStatus.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB) attached`;
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.style.opacity = '1';
      processBtn.textContent = `Ingest ${file.name.slice(0, 20)}`;
    }

    // Automatically read and process file content dynamically
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      processCustomLogContent(content, file.name);
    };
    reader.readAsText(file);
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach((evt) => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'copy';
        dropZone.style.borderColor = 'var(--brand-primary)';
        dropZone.style.backgroundColor = 'var(--brand-subtle)';
        if (dropZoneIcon) dropZoneIcon.style.transform = 'scale(1.2)';
        if (dropZoneText) dropZoneText.textContent = 'Drop log file to ingest immediately';
      });
    });

    ['dragleave', 'drop'].forEach((evt) => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.style.borderColor = 'var(--border-strong)';
        dropZone.style.backgroundColor = 'var(--bg-card-subtle)';
        if (dropZoneIcon) dropZoneIcon.style.transform = 'scale(1)';
        if (dropZoneText) dropZoneText.textContent = 'Click to upload or drag log files here';
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleStandaloneFile(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleStandaloneFile(e.target.files[0]);
      }
      e.target.value = '';
    });
  }

  if (processBtn) {
    processBtn.addEventListener('click', () => {
      if (!loadedFile) return;
      processBtn.textContent = 'Mining templates...';
      processBtn.disabled = true;
      const reader = new FileReader();
      reader.onload = function(e) {
        processCustomLogContent(e.target.result, loadedFile.name);
        processBtn.textContent = 'Ingest Dropped File';
        processBtn.disabled = false;
      };
      reader.readAsText(loadedFile);
    });
  }

  // Paste Counter and Clustering
  const pasteInput = document.getElementById('paste-logs-input');
  const pasteCounter = document.getElementById('paste-line-counter');
  const pasteBtn = document.getElementById('paste-cluster-btn');

  if (pasteInput && pasteCounter) {
    pasteInput.addEventListener('input', () => {
      const lines = pasteInput.value.split('\n').filter((l) => l.trim().length > 0).length;
      pasteCounter.textContent = `${lines} lines entered`;
    });
  }

  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      if (!pasteInput.value || !pasteInput.value.trim()) {
        alert('Please paste some raw log text before clustering.');
        return;
      }
      processCustomLogContent(pasteInput.value, 'Pasted Log Buffer');
    });
  }

  // Live Search Filter for Incident Table
  const searchInput = document.getElementById('incident-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        renderIncidentList(activeIncidents);
        return;
      }
      const filtered = activeIncidents.filter((inc) =>
        inc.template.toLowerCase().includes(q) ||
        inc.service.toLowerCase().includes(q) ||
        inc.priority.toLowerCase().includes(q)
      );
      renderIncidentList(filtered);
    });
  }

  // Initialize with baseline data
  renderIncidentList(demoIncidents);
});

