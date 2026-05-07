// ====================================================
// RIZQARA EXTRACTION — Background Service Worker
// ====================================================

// Only set defaults if they don't exist yet (preserve user settings)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Rizqara Extraction installed ✅');
  chrome.storage.local.get(['settings', 'savedLeads'], (res) => {
    if (!res.settings) {
      chrome.storage.local.set({
        settings: { apiUrl: 'https://rizqara-extraction-backend.onrender.com', speed: 'medium', email: true, social: true, antiblock: true }
      });
    }
    if (!res.savedLeads) {
      chrome.storage.local.set({ savedLeads: [], extractionQueue: [] });
    }
    // Clear queue on install/update to prevent stale data
    chrome.storage.local.set({ extractionQueue: [] });
  });
});

// ── Forward messages: content script → popup ──────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'LEAD_FOUND') {
    // 1. Persist lead locally
    chrome.storage.local.get(['extractionQueue', 'token'], (res) => {
      const queue = res.extractionQueue || [];
      queue.push(msg.data);
      chrome.storage.local.set({ extractionQueue: queue });

      // 2. Report usage to backend immediately
      if (res.token) {
        console.log('[Rizqara] Reporting 1 lead to backend...');
        fetch('https://rizqara-extraction-backend.onrender.com/api/user/usage', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${res.token}`
          },
          body: JSON.stringify({ count: 1 })
        })
        .then(r => r.json())
        .then(data => console.log('[Rizqara] Usage updated:', data))
        .catch(err => console.error('[Rizqara] Usage report failed:', err));
      }
    });
  }

  if (msg.action === 'EXTRACTION_COMPLETE') {
    // Save the entire queue as savedLeads batch
    chrome.storage.local.get(['extractionQueue', 'savedLeads'], (res) => {
      const queue = res.extractionQueue || [];
      const existing = res.savedLeads || [];
      // Merge, deduplicate by name
      const names = new Set(existing.map(l => l.name));
      const newLeads = queue.filter(l => l.name && !names.has(l.name));
      chrome.storage.local.set({
        savedLeads: [...existing, ...newLeads],
        extractionQueue: []
      });
    });
  }

  sendResponse({ ok: true });
  return true;
});
