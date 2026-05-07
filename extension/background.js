// ====================================================
// RIZQARA EXTRACTION — Background Service Worker
// ====================================================

// Only set defaults if they don't exist yet (preserve user settings)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Rizqara Extraction installed ✅');
  chrome.storage.local.get(['settings', 'savedLeads'], (res) => {
    if (!res.settings) {
      chrome.storage.local.set({
        settings: { apiUrl: 'http://127.0.0.1:3005', speed: 'medium', email: true, social: true, antiblock: true }
      });
    }
    if (!res.savedLeads) {
      chrome.storage.local.set({ savedLeads: [], extractionQueue: [] });
    }
  });
});

// ── Forward messages: content script → popup ──────────
// BUG FIX: background.js cannot forward via chrome.runtime.sendMessage to popup
// (popup is not a background target). Instead, use chrome.tabs to send to popup
// or just let content script send directly. Background stores for persistence only.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'LEAD_FOUND') {
    // Persist lead to queue for background mode
    chrome.storage.local.get(['extractionQueue'], (res) => {
      const queue = res.extractionQueue || [];
      queue.push(msg.data);
      // Cap queue at 1000 to avoid storage overflow
      if (queue.length > 1000) queue.splice(0, queue.length - 1000);
      chrome.storage.local.set({ extractionQueue: queue });
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
