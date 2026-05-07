// ====================================================
// RIZQARA EXTRACTION — Content Script (Google Maps)
// ====================================================

(function() {
  'use strict';

  // Guard: prevent double-injection
  if (window.__rizqaraInjected) return;
  window.__rizqaraInjected = true;

  let extracting = false;
  let paused = false;
  let aborted = false;

  // ── Show/hide indicator bar ────────────────────────
  function showBar(show) {
    let bar = document.getElementById('rizqara-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'rizqara-bar';
      document.body.prepend(bar);
    }
    bar.classList.toggle('active', show);
  }

  // ── Listen for popup messages ──────────────────────
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'START_EXTRACTION') {
      if (extracting) { sendResponse({ ok: false, reason: 'already running' }); return true; }
      extracting = true; paused = false; aborted = false;
      showBar(true);
      startExtraction(msg.limit, msg.mode, msg.settings)
        .catch(err => {
          chrome.runtime.sendMessage({ action: 'EXTRACTION_ERROR', message: err.message });
        })
        .finally(() => { showBar(false); extracting = false; });
      sendResponse({ ok: true });

    } else if (msg.action === 'PAUSE_EXTRACTION') {
      paused = true; sendResponse({ ok: true });

    } else if (msg.action === 'RESUME_EXTRACTION') {
      paused = false; sendResponse({ ok: true });

    } else if (msg.action === 'STOP_EXTRACTION') {
      aborted = true; extracting = false; showBar(false);
      sendResponse({ ok: true });
    }
    return true;
  });

  // ── Main Extraction Loop ────────────────────────────
  async function startExtraction(limit, mode, settings) {
    const API = (settings?.apiUrl || 'https://rizqara-extraction-backend.onrender.com').replace(/\/$/, '');
    const extracted = [];
    const seen = new Set();
    let scrollAttempts = 0;
    const maxScrollAttempts = Math.ceil(limit / 3) + 30;
    let currentIndex = 0;
    let lastNewLeadTime = Date.now();
    const IDLE_TIMEOUT_MS = 60 * 1000;
    let noProgressRounds = 0;

    if (mode === 'manual') {
      console.log('[Rizqara] Manual Mode Active - Click a listing to extract.');
      await handleManualMode(limit, settings, API, extracted);
      return;
    }

    if (mode === 'hybrid') {
      console.log('[Rizqara] Hybrid Mode Active - Extracting visible listings.');
      await handleHybridMode(limit, settings, API, extracted, seen);
      return;
    }

    // Default: AUTO MODE
    while (extracted.length < limit && scrollAttempts < maxScrollAttempts && !aborted) {
      if (paused) { await sleep(500); continue; }

      if (Date.now() - lastNewLeadTime > IDLE_TIMEOUT_MS) {
        console.log('[Rizqara] 60s idle — auto-completing.');
        break;
      }

      let listings = getVisibleListings();

      if (currentIndex >= listings.length) {
        scrollListPanel();
        await sleep(getDelay(settings?.speed));
        listings = getVisibleListings();
        
        if (currentIndex >= listings.length) {
          noProgressRounds++;
          if (noProgressRounds >= 8) {
            console.log('[Rizqara] No more new listings — end of results.');
            break;
          }
          scrollAttempts++;
          continue;
        } else {
          noProgressRounds = 0;
        }
      }

      const el = listings[currentIndex];
      currentIndex++;

      let name = getListingName(el);
      name = name.replace(/\s*-\s*Visited link/i, '').trim();
      if (!name || seen.has(name)) continue;
      seen.add(name);

      if (isClosedBusiness(el)) {
        console.debug('[Rizqara] Skipping closed:', name);
        continue;
      }

      const lead = await extractListing(el, settings, API);
      
      if (lead && lead.name && !lead.isClosed) {
        extracted.push(lead);
        lastNewLeadTime = Date.now();
        notifyLead(lead, extracted.length, limit);
      }
    }
    chrome.runtime.sendMessage({ action: 'COMPLETE', count: extracted.length });
  }

  async function handleManualMode(limit, settings, API, extracted) {
    const listener = async (e) => {
      if (aborted) {
        document.removeEventListener('click', listener, true);
        return;
      }
      const link = e.target.closest('a[href*="/maps/place/"]');
      if (link) {
        const lead = await extractListing(link, settings, API);
        if (lead) {
          extracted.push(lead);
          notifyLead(lead, extracted.length, limit);
          if (extracted.length >= limit) {
            aborted = true;
            chrome.runtime.sendMessage({ action: 'COMPLETE', count: extracted.length });
          }
        }
      }
    };
    document.addEventListener('click', listener, true);
    while (!aborted && extracted.length < limit) {
      await sleep(1000);
    }
    document.removeEventListener('click', listener, true);
  }

  async function handleHybridMode(limit, settings, API, extracted, seen) {
    while (extracted.length < limit && !aborted) {
      if (paused) { await sleep(500); continue; }
      
      let listings = getVisibleListings();
      for (const el of listings) {
        if (aborted || extracted.length >= limit) break;
        
        let name = getListingName(el);
        if (!name || seen.has(name)) continue;
        seen.add(name);

        const lead = await extractListing(el, settings, API);
        if (lead) {
          extracted.push(lead);
          notifyLead(lead, extracted.length, limit);
        }
      }

      await sleep(2000); // Wait for user to scroll
    }
    chrome.runtime.sendMessage({ action: 'COMPLETE', count: extracted.length });
  }

  // ── HYBRID ALTERNATIVE PATH: ARIA & DATA-ATTRIBUTE BASED SCRAPING ── //

  function getVisibleListings() {
    // 1. Find all explicit Google Maps place links
    const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
    
    // 2. Filter out duplicate links for the same business (Maps often has 2-3 links per card)
    const unique = [];
    const seenHrefs = new Set();
    
    for (const link of links) {
      const url = link.href.split('?')[0]; // Ignore URL parameters
      const name = link.getAttribute('aria-label')?.trim() || link.textContent?.trim() || '';
      
      // Crucial Fix: Only add the link if it actually has a readable name.
      // This prevents us from grabbing the blank image thumbnail link that Maps places first!
      if (name && !seenHrefs.has(url)) {
        seenHrefs.add(url);
        unique.push(link);
      }
    }
    return unique;
  }

  function getListingName(link) {
    // The anchor tag itself always contains the clean business name in the aria-label
    return link.getAttribute('aria-label')?.trim() || link.textContent?.trim() || '';
  }

  function isClosedBusiness(link) {
    // Check the parent card container for closed text
    const container = link.closest('[role="article"]') || link.parentElement?.parentElement;
    const text = container?.textContent || '';
    return /permanently\s+closed|temporarily\s+closed/i.test(text);
  }

  async function extractListing(link, settings, API) {
    try {
      let name = getListingName(link);
      // Remove Google's internal 'Visited link' text from name
      name = name.replace(/\s*-\s*Visited link/i, '').trim();

      // 1. Simulated click on the exact place link
      link.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(300);
      
      // Use mousedown/mouseup to better trick Google's React event listeners
      link.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      link.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      link.click();
      
      // 2. Wait explicitly for the Detail Panel to open
      let detailOpen = false;
      for (let i = 0; i < 40; i++) { // Increased wait time
        await sleep(250);
        
        // Robust check for detail panel
        const isDataLoaded = document.querySelector('[data-item-id="address"], [data-item-id^="phone:tel:"], a[data-item-id="authority"], [aria-label*="Back to results"], .DUwDvf');
        
        if (isDataLoaded) {
          detailOpen = true;
          // Add a tiny extra delay to let React finish rendering the DOM nodes
          await sleep(500);
          break;
        }
      }

      // 3. Extract Data using robust helper functions (querying from document directly)
      let address = '';
      let phone = '';
      let website = '';
      let rating = '';
      let reviews = '';
      let category = '';

      if (detailOpen) {
        address = getInfoItem(document, 'address');
        phone = getInfoItem(document, 'phone');
        website = getWebsiteUrl(document);

        // Scope rating/reviews to the main container to avoid picking up list items
        const mainPanel = document.querySelector('[role="main"]') || document;
        const ratingEl = mainPanel.querySelector('[aria-label*="stars"]');
        const rMatch = ratingEl?.getAttribute('aria-label')?.match(/([\d.]+)\s*stars/i);
        rating = rMatch ? rMatch[1] : '';

        const revMatch = ratingEl?.getAttribute('aria-label')?.match(/([\d,]+)\s*Reviews/i);
        reviews = revMatch ? revMatch[1].replace(/,/g, '') : '';
        
        const catEl = mainPanel.querySelector('button[jsaction*="pane.rating.category"]');
        category = catEl?.textContent?.trim() || '';
      }

      // 4. Click Back to return to the list
      const backBtn = document.querySelector('button[aria-label*="Back"], button.hh2c6');
      if (backBtn) {
        backBtn.click();
        await sleep(1500); // Give React extra time to restore the list DOM
      }

      const lead = {
        name: name,
        category: category,
        rating: rating,
        reviews: reviews,
        address: address,
        phone: phone,
        website: website,
        email: null, facebook: null, instagram: null, linkedin: null, techStack: null, aiInsight: null,
        isClosed: false
      };

      if (lead.website && (settings?.email || settings?.social || settings?.intelligence)) {
        try {
          const enriched = await fetchEnrichment(API, lead.website, settings);
          if (enriched && typeof enriched === 'object') {
            Object.assign(lead, enriched);
          }
        } catch (e) {
          console.debug('[Rizqara] Enrichment failed:', e.message);
        }
      }

      return lead;

    } catch (e) {
      console.error('[Rizqara] Extraction error:', e);
      return null;
    }
  }

  // ── Detail panel locator ──────────────────────────
  function getDetailPanel() {
    const main = document.querySelector('[role="main"]');
    if (main && main.querySelector('.DUwDvf, .fontHeadlineLarge, h1')) {
      return main;
    }
    const candidates = [
      document.querySelector('.bJzME.tTVLSc'),
      document.querySelector('.w6VYqd'),
      document.querySelector('[role="main"] [class*="m6QErb"]'),
      document.querySelector('.TIHn2 [class*="m6QErb"]'),
      document.querySelector('[aria-label*="Information"] [class*="m6QErb"]'),
      document.querySelector('[role="main"]'),
    ];
    return candidates.find(Boolean) || null;
  }

  function getInfoItem(panel, type) {
    // Google Maps uses data-item-id or aria-label for structured info
    if (type === 'address') {
      const selectors = [
        'button[data-item-id="address"] [class*="rogA2c"]',
        '[data-item-id="address"]',
        'button[aria-label*="ddress"]',
      ];
      for (const sel of selectors) {
        const el = panel?.querySelector(sel);
        const text = el?.textContent?.trim() || el?.getAttribute('aria-label')?.replace(/^Address:\s*/i, '').trim();
        if (text) return text;
      }
    }
    if (type === 'phone') {
      const selectors = [
        '[data-tooltip="Copy phone number"]',
        'button[aria-label*="Phone"]',
        '[data-item-id*="phone"]',
      ];
      for (const sel of selectors) {
        const el = panel?.querySelector(sel);
        const text = el?.textContent?.trim()
          || el?.getAttribute('aria-label')?.replace(/^Phone:\s*/i, '').trim();
        if (text && /[\d\s\-\+\(\)]+/.test(text)) return text;
      }
    }
    return '';
  }

  function getWebsiteUrl(panel) {
    // Primary: Google Maps usually uses data-item-id="authority" for the website
    const authLink = panel?.querySelector('a[data-item-id="authority"]');
    if (authLink) {
      let href = authLink.href || '';
      // If Google wraps it in a redirect, extract the actual URL
      if (href.includes('google.com/url?')) {
        try {
          const urlObj = new URL(href);
          const q = urlObj.searchParams.get('q');
          if (q) return q;
        } catch (e) {}
      }
      return href;
    }

    // Fallback: Look for the first external link
    const candidates = panel?.querySelectorAll('a[href]') || [];
    for (const a of candidates) {
      const href = a.href || '';
      if (
        href.startsWith('http') &&
        !href.includes('google.com') &&
        !href.includes('maps.google') &&
        !href.includes('goo.gl') &&
        !href.includes('javascript:')
      ) {
        return href;
      }
    }
    return '';
  }

  // ── Backend enrichment call ───────────────────────
  async function fetchEnrichment(API, websiteUrl, settings) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const res = await fetch(`${API}/enrich`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': settings.token ? `Bearer ${settings.token}` : ''
        },
        body: JSON.stringify({ url: websiteUrl, settings }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (!res.ok) return {};
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Scroll the listing panel ──────────────────────
  function scrollListPanel() {
    const panelSelectors = [
      '[role="feed"]',
      '.m6QErb[aria-label]',
      '.m6QErb.DxyBCb.kA9KIf',
      '.DxyBCb',
      '[aria-label*="Results for"]',
    ];
    for (const sel of panelSelectors) {
      const el = document.querySelector(sel);
      if (el && el.scrollHeight > el.clientHeight) {
        el.scrollTop += 500;
        return true;
      }
    }
    // Last resort: scroll the page
    window.scrollBy(0, 400);
    return false;
  }

  // ── Notify popup via runtime message ─────────────
  function notifyLead(lead, current, total) {
    chrome.runtime.sendMessage({ action: 'LEAD_FOUND', data: lead, current, total })
      .catch(() => {}); // popup may be closed — ignore
  }

  // ── Utilities ─────────────────────────────────────
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function getDelay(speed) {
    if (speed === 'fast') return 600 + Math.random() * 600;
    if (speed === 'slow') return 3000 + Math.random() * 2000;
    return 1500 + Math.random() * 1500; // medium default
  }

})();
