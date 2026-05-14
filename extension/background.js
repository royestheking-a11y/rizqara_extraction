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
    // 1. Persist lead locally in browser storage
    chrome.storage.local.get(['extractionQueue', 'token'], (res) => {
      const queue = res.extractionQueue || [];
      queue.push(msg.data);
      chrome.storage.local.set({ extractionQueue: queue });

      // 2. Save lead to backend AND atomically increment usage
      if (res.token) {
        console.log('[Rizqara] Saving lead to database...');
        fetch('https://rizqara-extraction-backend.onrender.com/api/leads', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${res.token}`
          },
          body: JSON.stringify(msg.data)
        })
        .then(r => {
          if (r.status === 403) {
            // Limit reached — stop all extraction
            return r.json().then(data => {
              console.error('[Rizqara] LIMIT REACHED:', data.message);
              // Signal all content scripts to stop via storage change
              chrome.storage.local.set({ stopExtractionSignal: Date.now() });
              return { limitReached: true, ...data };
            });
          }
          return r.json();
        })
        .then(data => {
          if (data && !data.limitReached && data.usage) {
            // Forward the REAL database counts to the popup
            console.log(`[Rizqara] ✅ Lead saved. DB counts: ${data.usage.total}/${data.usage.plan === 'free' ? 20 : data.usage.limit}`);
            
            // Store the latest server-confirmed counts
            chrome.storage.local.set({ 
              serverUsage: {
                total: data.usage.total,
                today: data.usage.today,
                limit: data.usage.limit,
                plan: data.usage.plan
              }
            });
          }
        })
        .catch(err => console.error('[Rizqara] Failed to save lead:', err));
      }
    });
  }

  if (msg.action === 'COMPLETE') {
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
      console.log(`[Rizqara] Saved ${newLeads.length} new leads to local storage`);
    });
  }

  sendResponse({ ok: true });
  return true;
});
