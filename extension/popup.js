// ====================================================
// RIZQARA EXTRACTION — Popup Controller
// ====================================================

let extractedLeads = [];
let isExtracting = false;
let isPaused = false;
let currentMode = 'auto';
let scoreFilter = 'all';
let crmFilter = 'all';
let savedLeads = [];
let settings = {};

// ── DOM Refs (safe — called after DOMContentLoaded) ──
const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadSavedLeads();
  checkPageStatus();
  setupTabs();
  setupModes();
  setupFilters();
  setupScoreFilter();
  setupSlider();
  setupButtons();
  setupCrmFilter();
  setupModal();
  setupLeadsSearch();
  setupSettingsPage();
  listenToBackground();
});

// ── Page Status Check ──────────────────────────────────
async function checkPageStatus() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';
    const isGMaps = url.includes('google.com/maps') || url.includes('maps.google.com');
    if (isGMaps) {
      $('statusDot').className = 'status-dot connected';
      $('statusText').textContent = 'Google Maps Detected';
    } else {
      $('statusDot').className = 'status-dot error';
      $('statusText').textContent = 'Open Google Maps';
    }
  } catch {
    $('statusDot').className = 'status-dot error';
    $('statusText').textContent = 'Extension Error';
  }
}

// ── Tabs ──────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      $(`content-${tab}`).classList.add('active');
      if (tab === 'leads') renderLeadsList();
    });
  });
}

// ── Mode Selector ──────────────────────────────────────
function setupModes() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMode = btn.dataset.mode;
    });
  });
}

// ── Filter Chips ───────────────────────────────────────
function setupFilters() {
  document.querySelectorAll('.filter-chip input').forEach(chk => {
    chk.addEventListener('change', () => {
      if (extractedLeads.length) applyFiltersAndRender();
    });
  });
}

// ── Score Filter ───────────────────────────────────────
function setupScoreFilter() {
  document.querySelectorAll('.score-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.score-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scoreFilter = btn.dataset.score;
      if (extractedLeads.length) applyFiltersAndRender();
    });
  });
}

// ── Slider ─────────────────────────────────────────────
function setupSlider() {
  const slider = $('limitSlider');
  const display = $('limitDisplay');
  const updateSlider = () => {
    display.textContent = slider.value;
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.setProperty('--pct', pct + '%');
  };
  slider.addEventListener('input', updateSlider);
  updateSlider(); // init on load
}

// ── Main Buttons ───────────────────────────────────────
function setupButtons() {
  $('btnStart').addEventListener('click', startExtraction);
  $('btnPause').addEventListener('click', pauseExtraction);
  $('btnStop').addEventListener('click', stopExtraction);
  $('btnExcel').addEventListener('click', exportExcel);
  $('btnCSV').addEventListener('click', exportCSV);
}

async function startExtraction() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';
    if (!url.includes('google.com/maps') && !url.includes('maps.google.com')) {
      showToast('⚠️ Please open Google Maps first', 'error');
      return;
    }

    // Reset state
    isExtracting = true;
    isPaused = false;
    extractedLeads = [];
    $('btnStart').disabled = true;
    $('btnPause').disabled = false;
    $('btnStop').disabled = false;
    $('progressSection').style.display = 'block';
    $('resultsSection').style.display = 'none';
    updateProgressStats();

    const limit = parseInt($('limitSlider').value);
    const filters = getActiveFilters();
    const currentSettings = getSettings();

    const payload = { action: 'START_EXTRACTION', mode: currentMode, limit, filters, settings: currentSettings };

    // Try sending to existing content script first
    chrome.tabs.sendMessage(tab.id, payload, (response) => {
      if (chrome.runtime.lastError || !response) {
        // Content script not injected yet — inject it, then send
        chrome.scripting.executeScript(
          { target: { tabId: tab.id }, files: ['content.js'] },
          () => {
            if (chrome.runtime.lastError) {
              showToast('❌ Cannot inject script on this page', 'error');
              resetExtractionUI();
              return;
            }
            // Small delay for script to initialize
            setTimeout(() => {
              chrome.tabs.sendMessage(tab.id, payload);
            }, 300);
          }
        );
      }
    });

  } catch (err) {
    showToast(`❌ ${err.message}`, 'error');
    resetExtractionUI();
  }
}

function resetExtractionUI() {
  isExtracting = false;
  $('btnStart').disabled = false;
  $('btnPause').disabled = true;
  $('btnStop').disabled = true;
}

function pauseExtraction() {
  isPaused = !isPaused;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    chrome.tabs.sendMessage(tab.id, {
      action: isPaused ? 'PAUSE_EXTRACTION' : 'RESUME_EXTRACTION'
    }).catch(() => {});
  });

  const btn = $('btnPause');
  if (isPaused) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Resume`;
    showToast('⏸ Extraction paused', '');
  } else {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause`;
    showToast('▶ Extraction resumed', '');
  }
}

function stopExtraction() {
  isExtracting = false;
  isPaused = false;
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) chrome.tabs.sendMessage(tab.id, { action: 'STOP_EXTRACTION' }).catch(() => {});
  });
  resetExtractionUI();
  if (extractedLeads.length) {
    $('resultsSection').style.display = 'block';
    applyFiltersAndRender();
  }
  showToast(`⛔ Stopped. ${extractedLeads.length} leads collected.`, 'success');
}

// ── Background Message Listener ────────────────────────
// BUG FIX: content script sends directly to runtime (popup listens here)
function listenToBackground() {
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'LEAD_FOUND') {
      const lead = scoreLead(msg.data);
      extractedLeads.push(lead);
      updateProgressUI(msg.current, msg.total || $('limitSlider').value);
      // Also persist to savedLeads in real-time
      savedLeads.push(lead);
      chrome.storage.local.set({ savedLeads });

    } else if (msg.action === 'EXTRACTION_COMPLETE') {
      isExtracting = false;
      resetExtractionUI();
      $('resultsSection').style.display = 'block';
      applyFiltersAndRender();
      showToast(`🎉 Done! ${extractedLeads.length} leads extracted.`, 'success');

    } else if (msg.action === 'EXTRACTION_ERROR') {
      showToast(`❌ ${msg.message}`, 'error');
      resetExtractionUI();
    }
    sendResponse({ ok: true });
    return true;
  });
}

// ── Lead Scoring ───────────────────────────────────────
function scoreLead(raw) {
  const score = computeScore(raw);
  const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
  return {
    ...raw,
    score,
    tier,
    crmStatus: raw.crmStatus || 'new',
    notes: raw.notes || '',
    savedAt: Date.now()
  };
}

function computeScore(lead) {
  let s = 0;
  if (lead.website) s += 25;
  if (lead.email)   s += 25;
  if (lead.phone)   s += 15;
  if (lead.facebook || lead.instagram || lead.linkedin) s += 15;
  const rating = parseFloat(lead.rating) || 0;
  if (rating >= 4.5)      s += 20;
  else if (rating >= 4.0) s += 12;
  else if (rating >= 3.5) s += 6;
  return Math.min(100, s);
}

// ── Progress UI ────────────────────────────────────────
function updateProgressUI(current, total) {
  const t = parseInt(total) || 0;
  const pct = t ? Math.round((current / t) * 100) : 0;
  $('progressBar').style.width = Math.min(100, pct) + '%';
  $('progressCount').textContent = `${current} / ${t || '?'}`;
  updateProgressStats();
}

function updateProgressStats() {
  const hot      = extractedLeads.filter(l => l.tier === 'hot').length;
  const warm     = extractedLeads.filter(l => l.tier === 'warm').length;
  const cold     = extractedLeads.filter(l => l.tier === 'cold').length;
  const withSite = extractedLeads.filter(l => l.website).length;
  $('hotCount').textContent     = hot;
  $('warmCount').textContent    = warm;
  $('coldCount').textContent    = cold;
  $('websiteCount').textContent = withSite;
}

// ── Filters & Render ───────────────────────────────────
function getActiveFilters() {
  return {
    website:    $('chk-website').checked,
    phone:      $('chk-phone').checked,
    email:      $('chk-email').checked,
    social:     $('chk-social').checked,
    highRating: $('chk-rating').checked,
    noWebsite:  $('chk-nowebsite').checked
  };
}

function applyFiltersAndRender() {
  const filters = getActiveFilters();
  let filtered = [...extractedLeads];

  if (filters.website)    filtered = filtered.filter(l => l.website);
  if (filters.phone)      filtered = filtered.filter(l => l.phone);
  if (filters.email)      filtered = filtered.filter(l => l.email);
  if (filters.social)     filtered = filtered.filter(l => l.facebook || l.instagram || l.linkedin);
  if (filters.highRating) filtered = filtered.filter(l => parseFloat(l.rating) >= 4.0);
  if (filters.noWebsite)  filtered = filtered.filter(l => !l.website);
  if (scoreFilter !== 'all') filtered = filtered.filter(l => l.tier === scoreFilter);

  $('totalBadge').textContent = `${filtered.length} leads`;
  renderPreviewTable(filtered.slice(0, 8));
}

function renderPreviewTable(leads) {
  const body = $('previewBody');
  if (!leads.length) {
    body.innerHTML = `<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:16px">No leads match filters</td></tr>`;
    return;
  }
  body.innerHTML = leads.map(l => `
    <tr>
      <td title="${escHtml(l.name)}">${escHtml(l.name || '—')}</td>
      <td><span class="score-tag ${l.tier}">${l.tier === 'hot' ? '🔥 Hot' : l.tier === 'warm' ? '⚡ Warm' : '❄ Cold'}</span></td>
      <td>${escHtml(l.phone || '—')}</td>
    </tr>`).join('');
}

// Escape HTML to prevent XSS from scraped content
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Export ──────────────────────────────────────────────
// Always reads from storage so data persists after popup reopen
function exportExcel() {
  chrome.storage.local.get(['savedLeads'], res => {
    const leads = res.savedLeads || [];
    // Fallback to in-memory if storage empty (same session)
    const data = leads.length ? leads : extractedLeads;
    if (!data.length) { showToast('No leads to export', 'error'); return; }
    if (typeof XLSX === 'undefined') { showToast('XLSX library not loaded', 'error'); return; }
    doExcelExport(data);
  });
}

function doExcelExport(data) {
  try {
    const rows = data.map(l => ({
      'Business Name': l.name || '',
      'Category':      l.category || '',
      'Rating':        l.rating || '',
      'Reviews':       l.reviews || '',
      'Address':       l.address || '',
      'Phone':         l.phone || '',
      'Website':       l.website || '',
      'Email':         l.email || '',
      'Facebook':      l.facebook || '',
      'Instagram':     l.instagram || '',
      'LinkedIn':      l.linkedin || '',
      'Lead Score':    l.score || 0,
      'Lead Tier':     (l.tier || '').toUpperCase(),
      'Tech Stack':    l.techStack || '',
      'AI Insight':    l.aiInsight || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0]).map(k => ({ wch: Math.max(k.length + 2, 18) }));
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rizqara Leads');
    // FIX: Use write() + blob instead of writeFile() — avoids CSP issues in extensions
    const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rizqara-leads-${new Date().toISOString().slice(0,10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(`Exported ${rows.length} leads to Excel!`, 'success');
  } catch(e) {
    showToast(`Export failed: ${e.message}`, 'error');
    console.error('Excel export error:', e);
  }
}

function exportCSV() {
  chrome.storage.local.get(['savedLeads'], res => {
    const leads = res.savedLeads || [];
    const data = leads.length ? leads : extractedLeads;
    if (!data.length) { showToast('No leads to export', 'error'); return; }
    doCSVExport(data);
  });
}

function doCSVExport(data) {
  const headers = [
    'Business Name','Category','Rating','Reviews','Address',
    'Phone','Website','Email','Facebook','Instagram','LinkedIn',
    'Lead Score','Lead Tier','Tech Stack','AI Insight'
  ];
  const csvVal = v => `"${(v || '').toString().replace(/"/g, '""')}"`;
  const rows = data.map(l =>
    [l.name,l.category,l.rating,l.reviews,l.address,l.phone,
     l.website,l.email,l.facebook,l.instagram,l.linkedin,
     l.score,l.tier,l.techStack,l.aiInsight].map(csvVal).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `rizqara-leads-${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast(`Exported ${data.length} leads to CSV!`, 'success');
}

// ── CRM / Leads Tab ────────────────────────────────────
function setupCrmFilter() {
  document.querySelectorAll('.crm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.crm-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      crmFilter = btn.dataset.crm;
      renderLeadsList();
    });
  });
  $('btnClearLeads').addEventListener('click', () => {
    if (confirm('Clear all saved leads?')) {
      savedLeads = [];
      chrome.storage.local.set({ savedLeads: [] });
      renderLeadsList();
      showToast('Leads cleared', 'success');
    }
  });
}

function setupLeadsSearch() {
  $('leadsSearch').addEventListener('input', e => renderLeadsList(e.target.value));
}

function renderLeadsList(search = '') {
  // Reload from storage to get freshest data
  chrome.storage.local.get(['savedLeads'], res => {
    savedLeads = res.savedLeads || [];
    let list = [...savedLeads];
    if (crmFilter !== 'all') list = list.filter(l => l.crmStatus === crmFilter);
    if (search) list = list.filter(l => (l.name || '').toLowerCase().includes(search.toLowerCase()));

    const container = $('leadsList');
    if (!list.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>No leads found.<br>Start an extraction to collect leads.</p></div>`;
      return;
    }
    container.innerHTML = list.map((l) => {
      const idx = savedLeads.indexOf(l);
      return `
      <div class="lead-card" onclick="openLeadModal(${idx})">
        <div class="lead-card-header">
          <span class="lead-card-name">${escHtml(l.name || 'Unknown')}</span>
          <span class="score-tag ${l.tier}">${l.tier === 'hot' ? '🔥' : l.tier === 'warm' ? '⚡' : '❄'} ${l.tier || 'cold'}</span>
        </div>
        <div class="lead-card-meta">
          <span>${escHtml(l.phone || 'No phone')}</span>
          <span>${l.website ? '🌐 Website' : 'No website'}</span>
          <span class="crm-badge ${l.crmStatus || 'new'}">${l.crmStatus || 'new'}</span>
        </div>
      </div>`;
    }).join('');
  });
}

// ── Modal ──────────────────────────────────────────────
function setupModal() {
  $('modalClose').addEventListener('click', () => { $('leadModal').style.display = 'none'; });
  $('leadModal').addEventListener('click', e => {
    if (e.target === $('leadModal')) $('leadModal').style.display = 'none';
  });
  $('btnSaveLead').addEventListener('click', saveLeadFromModal);
}

let currentModalIdx = -1;

window.openLeadModal = function(idx) {
  currentModalIdx = idx;
  const l = savedLeads[idx];
  if (!l) return;
  $('modalName').textContent = l.name || 'Unknown Business';
  $('modalCrmStatus').value = l.crmStatus || 'new';
  $('modalNotes').value = l.notes || '';

  const rows = [
    detailRow('📍 Address', l.address),
    detailRow('📞 Phone', l.phone),
    detailRow('🌐 Website', l.website ? `<a href="${escHtml(l.website)}" target="_blank">${escHtml(l.website)}</a>` : null),
    detailRow('📧 Email', l.email ? `<a href="mailto:${escHtml(l.email)}">${escHtml(l.email)}</a>` : null),
    detailRow('⭐ Rating', l.rating ? `${l.rating} ${l.reviews ? `(${l.reviews} reviews)` : ''}` : null),
    detailRow('📘 Facebook', l.facebook ? `<a href="${escHtml(l.facebook)}" target="_blank">${escHtml(l.facebook)}</a>` : null),
    detailRow('📸 Instagram', l.instagram ? `<a href="${escHtml(l.instagram)}" target="_blank">${escHtml(l.instagram)}</a>` : null),
    detailRow('💼 LinkedIn', l.linkedin ? `<a href="${escHtml(l.linkedin)}" target="_blank">${escHtml(l.linkedin)}</a>` : null),
    detailRow('🔧 Tech Stack', l.techStack),
    detailRow('📊 Lead Score', l.score != null ? `${l.score}/100 (${l.tier})` : null),
    l.aiInsight ? `<div class="modal-ai-box"><div class="modal-ai-label">🤖 AI Insight</div><div class="modal-ai-text">${escHtml(l.aiInsight)}</div></div>` : ''
  ].join('');

  $('modalBody').innerHTML = rows;
  $('leadModal').style.display = 'flex';
};

function detailRow(label, value) {
  if (!value) return '';
  return `<div class="modal-detail-row"><span class="modal-detail-label">${label}</span><span class="modal-detail-value">${value}</span></div>`;
}

function saveLeadFromModal() {
  if (currentModalIdx < 0 || !savedLeads[currentModalIdx]) return;
  savedLeads[currentModalIdx].crmStatus = $('modalCrmStatus').value;
  savedLeads[currentModalIdx].notes = $('modalNotes').value;
  chrome.storage.local.set({ savedLeads }, () => {
    $('leadModal').style.display = 'none';
    renderLeadsList();
    showToast('✅ Lead saved!', 'success');
  });
}

// ── Settings ───────────────────────────────────────────
function setupSettingsPage() {
  $('tog-ai').addEventListener('change', () => {
    $('aiKeyWrap').style.display = $('tog-ai').checked ? 'block' : 'none';
  });
  $('btnSaveSettings').addEventListener('click', saveSettings);
}

function loadSettings() {
  chrome.storage.local.get(['settings'], res => {
    settings = res.settings || {
      apiUrl: 'http://localhost:3000',
      speed: 'medium',
      email: true,
      social: true,
      antiblock: true
    };
    $('apiUrl').value                = settings.apiUrl || 'http://localhost:3000';
    $('tog-email').checked           = settings.email !== false;
    $('tog-social').checked          = settings.social !== false;
    $('tog-intelligence').checked    = !!settings.intelligence;
    $('tog-antiblock').checked       = settings.antiblock !== false;
    $('tog-background').checked      = !!settings.background;
    $('tog-ai').checked              = !!settings.ai;
    $('aiKeyWrap').style.display     = settings.ai ? 'block' : 'none';
    if (settings.openaiKey) $('openaiKey').value = settings.openaiKey;
    const speedEl = document.querySelector(`input[name="speed"][value="${settings.speed || 'medium'}"]`);
    if (speedEl) speedEl.checked = true;
  });
}

function getSettings() {
  return {
    apiUrl:       $('apiUrl').value || 'http://localhost:3000',
    speed:        document.querySelector('input[name="speed"]:checked')?.value || 'medium',
    email:        $('tog-email').checked,
    social:       $('tog-social').checked,
    intelligence: $('tog-intelligence').checked,
    antiblock:    $('tog-antiblock').checked,
    background:   $('tog-background').checked,
    ai:           $('tog-ai').checked,
    openaiKey:    $('openaiKey').value
  };
}

function saveSettings() {
  settings = getSettings();
  chrome.storage.local.set({ settings }, () => showToast('⚙️ Settings saved!', 'success'));
}

function loadSavedLeads() {
  chrome.storage.local.get(['savedLeads'], res => {
    savedLeads = res.savedLeads || [];
  });
}

// ── Toast ──────────────────────────────────────────────
function showToast(msg, type = '') {
  const toast = $('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`.trim();
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3000);
}
