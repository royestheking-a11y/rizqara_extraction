// ====================================================
// RIZQARA EXTRACTION — Popup Controller (Old Design)
// ====================================================

let extractedLeads = [];
let isExtracting = false;
let isPaused = false;
let currentMode = 'auto';
let scoreFilter = 'all';
let currentTab = 'extract';
let user = null;

// ── DOM Utility ──────────────────────────────────────
const $ = id => document.getElementById(id);
const $$ = selector => document.querySelectorAll(selector);

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupAuth();
  setupTabs();
  setupModes();
  setupFilters();
  setupScoreFilter();
  setupSlider();
  setupButtons();
  checkPageStatus();
  listenToBackground();
  setupSettings();
  
  // Ensure we show the right tab on start
  switchTab('extract');
});

// ── Authentication ─────────────────────────────────────
function initAuth() {
  chrome.storage.local.get(['token'], (res) => {
    if (res.token) {
      fetchUserProfile(res.token);
    } else {
      showAuthOverlay(true);
    }
  });

  $('toRegister').onclick = (e) => {
    e.preventDefault();
    $('loginForm').style.display = 'none';
    $('registerForm').style.display = 'block';
  };
  $('toLogin').onclick = (e) => {
    e.preventDefault();
    $('loginForm').style.display = 'block';
    $('registerForm').style.display = 'none';
  };

  $('toggleLoginPass').onclick = () => {
    const input = $('loginPass');
    input.type = input.type === 'password' ? 'text' : 'password';
  };
  $('toggleRegPass').onclick = () => {
    const input = $('regPass');
    input.type = input.type === 'password' ? 'text' : 'password';
  };

  $('btnLogin').onclick = handleLogin;
  $('btnRegister').onclick = handleRegister;
  $('btnLogout').onclick = handleLogout;
}

async function fetchUserProfile(token) {
  try {
    const res = await fetch('https://rizqara-extraction-backend.onrender.com/api/user/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      user = await res.json();
      updateUserUI();
      showAuthOverlay(false);
    } else {
      handleLogout();
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
  }
}

async function handleLogin() {
  const email = $('loginEmail').value;
  const password = $('loginPass').value;
  if (!email || !password) return showToast('Enter email and password');

  try {
    const res = await fetch('https://rizqara-extraction-backend.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.ok) {
      chrome.storage.local.set({ token: data.token });
      user = data.user;
      updateUserUI();
      showAuthOverlay(false);
      showToast('Welcome back!', 'success');
    } else {
      showToast(data.error || 'Login failed');
    }
  } catch (err) {
    showToast('Connection error');
  }
}

async function handleRegister() {
  const name = $('regName').value;
  const email = $('regEmail').value;
  const password = $('regPass').value;
  if (!name || !email || !password) return showToast('Fill all fields');

  try {
    const res = await fetch('https://rizqara-extraction-backend.onrender.com/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (res.ok) {
      chrome.storage.local.set({ token: data.token });
      user = data.user;
      updateUserUI();
      showAuthOverlay(false);
      showToast('Account created!', 'success');
    } else {
      showToast(data.error || 'Registration failed');
    }
  } catch (err) {
    showToast('Connection error');
  }
}

function handleLogout() {
  chrome.storage.local.remove(['token']);
  user = null;
  showAuthOverlay(true);
}

function showAuthOverlay(show) {
  $('authOverlay').style.display = show ? 'flex' : 'none';
}

function updateUserUI() {
  if (!user) return;
  $('userMini').style.display = 'flex';
  
  const planLabel = user.plan === 'free' ? 'FREE TRIAL' : user.plan.toUpperCase();
  const usageText = user.plan === 'free' 
    ? `${user.total_usage}/20 Lifetime`
    : `${user.usage_today}/${user.daily_limit} Today`;
    
  $('userPlan').textContent = planLabel;
  $('userUsage').textContent = usageText; // I need to make sure this ID exists in HTML

  if ($('btnGetPro')) {
    $('btnGetPro').style.display = user.plan === 'free' ? 'inline-block' : 'none';
  }
}

function setupAuth() {
  if ($('btnGetPro')) {
    $('btnGetPro').onclick = async () => {
      const url = $('dashboardUrl').value || 'https://rizqaraextraction.vercel.app';
      chrome.tabs.create({ url: `${url.replace(/\/$/, '')}/subscriptions` });
    };
  }
}

// ── Tab Switching ─────────────────────────────────────
function setupTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });
}

function switchTab(tabId) {
  currentTab = tabId;
  $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  $$('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId + 'Tab'));
}

// ── Extraction Logic ──────────────────────────────────
function setupModes() {
  $$('.mode-btn').forEach(btn => {
    btn.onclick = () => {
      if (btn.dataset.mode) {
        $$('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
      }
    };
  });
}

function setupFilters() {
  $$('.filter-chip').forEach(chip => {
    chip.onclick = () => {
      chip.classList.toggle('active');
    };
  });
}

function setupScoreFilter() {
  $$('.score-btn').forEach(btn => {
    btn.onclick = () => {
      // Handle both Extract tab and Leads tab score/status filters
      if (btn.dataset.score) {
        $$('#extractTab .score-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        scoreFilter = btn.dataset.score;
      } else if (btn.dataset.leadFilter) {
        $$('#leadsTab .score-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterLeads(btn.dataset.leadFilter);
      }
    };
  });
}

function filterLeads(filterType) {
  showToast(`Filtering: ${filterType.toUpperCase()}`, 'success');
  let filtered = [...extractedLeads];
  
  if (filterType === 'new') {
    filtered = extractedLeads.filter(l => !l.lastContacted); // Example logic
  } else if (filterType === 'interested') {
    filtered = extractedLeads.filter(l => (l.score || 0) >= 70);
  } else if (filterType === 'client') {
    filtered = extractedLeads.filter(l => l.isClient); // Example logic
  }

  renderLeadsList(filtered);
}

function renderLeadsList(leads) {
  const container = $('leadsList');
  if (!leads.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px 20px; color:var(--text-muted)">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin-bottom:12px; opacity:0.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p style="font-size:13px">No leads match this filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = leads.map(l => `
    <div class="lead-item animate-fade">
      <div class="lead-info">
        <span class="lead-name">${l.name}</span>
        <span class="lead-cat">${l.category || 'Business'}</span>
      </div>
      <div class="lead-score">
        <span class="user-plan-tag">${l.score || 0}%</span>
      </div>
    </div>
  `).join('');
}

async function setupSettings() {
  // Extraction Speed
  $$('#settingsTab .mode-btn').forEach(btn => {
    btn.onclick = () => {
      $$('#settingsTab .mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const speed = btn.dataset.speed;
      chrome.storage.local.set({ extractionSpeed: speed });
      showToast(`Speed set to: ${speed.toUpperCase()}`, 'success');
    };
  });

  // Enrichment Toggles
  $$('.toggle-switch').forEach(toggle => {
    toggle.onclick = () => {
      toggle.classList.toggle('active');
      const type = toggle.dataset.enrich;
      const isActive = toggle.classList.contains('active');
      const settings = {};
      settings[`enrich_${type}`] = isActive;
      chrome.storage.local.set(settings);
      showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} ${isActive ? 'Enabled' : 'Disabled'}`, 'success');
    };
  });

  const settings = await chrome.storage.local.get(['apiUrl', 'dashboardUrl']);
  if (settings.apiUrl) $('apiUrl').value = settings.apiUrl;
  if (settings.dashboardUrl) $('dashboardUrl').value = settings.dashboardUrl;

  $('apiUrl').onchange = () => {
    chrome.storage.local.set({ apiUrl: $('apiUrl').value });
    showToast('API URL Saved', 'success');
  };

  $('dashboardUrl').onchange = () => {
    chrome.storage.local.set({ dashboardUrl: $('dashboardUrl').value });
    showToast('Dashboard URL Saved', 'success');
  };
}

function setupSlider() {
  const slider = $('limitSlider');
  const label = $('limitLabel');
  slider.oninput = () => {
    label.textContent = slider.value;
  };
}

function setupButtons() {
  $('btnStart').onclick = startExtraction;
  $('btnPause').onclick = pauseExtraction;
  $('btnStop').onclick = stopExtraction;
  $('btnExcel').onclick = exportToExcel;
  $('btnCSV').onclick = exportToCSV;
}

async function startExtraction() {
  if (!user) return showToast('Please login first');

  // PRE-CHECK LIMITS
  if (user.plan === 'free') {
    if (user.total_usage >= 20) {
      return showToast('Lifetime limit reached! Upgrade to Pro.', 'error');
    }
  } else {
    if (user.usage_today >= user.daily_limit) {
      return showToast('Daily limit reached! Come back tomorrow.', 'error');
    }
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isGMaps = tab?.url?.includes('google.com/maps');
  if (!isGMaps) return showToast('Open Google Maps first');

  // UI State
  isExtracting = true;
  $('btnStart').disabled = true;
  $('btnPause').disabled = false;
  $('btnStop').disabled = false;
  $('progressCard').style.display = 'block';
  $('resultsPreview').style.display = 'none';

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, {
    action: 'START_EXTRACTION',
    mode: currentMode,
    limit: parseInt($('limitSlider').value),
    settings: {
      filters: getFilters(),
      speed: $$('#settingsTab .mode-btn.active')[0]?.dataset.speed || 'normal',
      apiUrl: $('apiUrl').value,
      token: (await chrome.storage.local.get(['token'])).token,
      enrich: {
        email: document.querySelector('.toggle-switch[data-enrich="email"]')?.classList.contains('active'),
        social: document.querySelector('.toggle-switch[data-enrich="social"]')?.classList.contains('active'),
        background: document.querySelector('.toggle-switch[data-enrich="background"]')?.classList.contains('active')
      }
    }
  }, (response) => {
    if (chrome.runtime.lastError) {
      isExtracting = false;
      $('btnStart').disabled = false;
      $('progressCard').style.display = 'none';
      showToast('Error: Please refresh Google Maps and try again');
    }
  });
}

function getFilters() {
  const filters = {};
  $$('.filter-chip').forEach(c => {
    filters[c.dataset.filter] = c.classList.contains('active');
  });
  return filters;
}

function exportToExcel() {
  if (extractedLeads.length === 0) return showToast('No leads to export');
  showToast('Preparing Excel file...', 'success');
  
  const data = extractedLeads.map(l => ({
    'Business Name': l.name,
    'Category': l.category,
    'Phone': l.phone,
    'Website': l.website,
    'Email': l.email,
    'Facebook': l.facebook,
    'Instagram': l.instagram,
    'LinkedIn': l.linkedin,
    'Rating': l.rating,
    'Reviews': l.reviews,
    'Address': l.address,
    'Lead Score': `${l.score || 0}%`
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rizqara Leads');
  XLSX.writeFile(workbook, `rizqara_leads_${new Date().getTime()}.xlsx`);
}

function exportToCSV() {
  if (extractedLeads.length === 0) return showToast('No leads to export');
  showToast('Preparing CSV file...', 'success');

  const headers = ['Business Name', 'Category', 'Phone', 'Website', 'Email', 'Rating', 'Reviews', 'Address'];
  const rows = extractedLeads.map(l => [
    `"${l.name}"`,
    `"${l.category}"`,
    `"${l.phone}"`,
    `"${l.website}"`,
    `"${l.email}"`,
    l.rating,
    l.reviews,
    `"${l.address}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `rizqara_leads_${new Date().getTime()}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function pauseExtraction() {
  isPaused = !isPaused;
  $('btnPause').innerHTML = isPaused ? 
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume` :
    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
  
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: isPaused ? 'PAUSE' : 'RESUME' });
  });
}

function stopExtraction() {
  isExtracting = false;
  $('btnStart').disabled = false;
  $('btnPause').disabled = true;
  $('btnStop').disabled = true;
  
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.sendMessage(tab.id, { action: 'STOP' });
  });

  if (extractedLeads.length) {
    $('resultsPreview').style.display = 'block';
    renderPreview();
  }
}

// ── UI Helpers ────────────────────────────────────────
function checkPageStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const isGMaps = tab?.url?.includes('google.com/maps');
    const dot = $('statusDot');
    const txt = $('statusText');
    if (isGMaps) {
      dot.className = 'status-dot connected';
      txt.textContent = 'Google Maps Detected';
    } else {
      dot.className = 'status-dot';
      txt.textContent = 'Open Google Maps';
    }
  });
}

function listenToBackground() {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'LEAD_FOUND') {
      extractedLeads.push(msg.data);
      updateUI(msg.current, msg.total);
    } else if (msg.action === 'COMPLETE') {
      stopExtraction();
      showToast('🎉 Extraction Complete!', 'success');
    }
  });
}

function updateUI(current, total) {
  $('currentExtract').textContent = current;
  $('targetExtract').textContent = total;
  const pct = (current / total) * 100;
  $('progressBar').style.width = pct + '%';
  
  // Update counts
  $('countHot').textContent = extractedLeads.filter(l => (l.score||0) >= 70).length;
  $('countWarm').textContent = extractedLeads.filter(l => (l.score||0) >= 40 && (l.score||0) < 70).length;
  $('countCold').textContent = extractedLeads.filter(l => (l.score||0) < 40).length;
  $('countSites').textContent = extractedLeads.filter(l => l.website).length;
}

function renderPreview() {
  const body = $('previewBody');
  body.innerHTML = extractedLeads.slice(-5).map(l => `
    <tr>
      <td>${l.name}</td>
      <td><span class="user-plan-tag">${l.score || 0}%</span></td>
      <td>${l.phone || '—'}</td>
    </tr>
  `).join('');
  $('previewCountBadge').textContent = `${extractedLeads.length} leads`;
}

function showToast(msg, type = '') {
  const t = $('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.border = type === 'success' ? '1px solid #00ff88' : '1px solid var(--primary)';
  setTimeout(() => t.style.display = 'none', 3000);
}
