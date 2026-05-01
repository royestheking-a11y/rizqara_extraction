// ====================================================
// RIZQARA EXTRACTION — Website Enricher Service
// ====================================================

const axios = require('axios');
const cheerio = require('cheerio');

// BUG FIX: Use global flag 'g' consistently; avoid 'gi' which can cause state bugs with exec()
const EMAIL_REGEX    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const FACEBOOK_REGEX = /(?:facebook\.com|fb\.com)\/(?!sharer\b|share\b|login\b|home\b|pages\/category)[a-zA-Z0-9.\-_/]+/gi;
const INSTAGRAM_REGEX = /instagram\.com\/[a-zA-Z0-9._]+/gi;
const LINKEDIN_REGEX  = /linkedin\.com\/(?:company|in)\/[a-zA-Z0-9\-_%]+/gi;

// Tech stack fingerprints (lowercase keys for matching against lowercased HTML)
const TECH_FINGERPRINTS = {
  'WordPress':   ['wp-content', 'wp-includes', 'wordpress'],
  'Shopify':     ['cdn.shopify.com', 'shopify.com'],
  'Wix':         ['wixstatic.com', 'wix.com'],
  'Squarespace': ['squarespace.com', 'sqspcdn.com'],
  'Webflow':     ['webflow.io', 'webflow.com'],
  'Next.js':     ['_next/static', '__next_data__'],
  'React':       ['react.development.js', 'react.production.min.js', 'data-reactroot'],
  'Bootstrap':   ['bootstrap.css', 'bootstrap.min.css', 'bootstrap.bundle'],
};

async function enrichWebsite(rawUrl, settings = {}) {
  const url = normalizeUrl(rawUrl);
  if (!url) return {};

  const result = {
    email:       null,
    facebook:    null,
    instagram:   null,
    linkedin:    null,
    techStack:   null,
    hasSSL:      url.startsWith('https'),
    sslIssue:    !url.startsWith('https'),
    mobileIssue: false,
    hasMeta:     false,
    titleTag:    null,
  };

  try {
    const html = await fetchPage(url);
    if (!html || typeof html !== 'string') return result;

    const $ = cheerio.load(html);
    const htmlLower = html.toLowerCase();

    // Use both visible text and full HTML for extraction
    // BUG FIX: Was `$.text() + html` — $.text() is a jQuery method, not Cheerio root;
    // correct is $('body').text()
    const visibleText = $('body').text();
    const searchCorpus = visibleText + ' ' + html;

    // ── Email Extraction ──────────────────────────────
    if (settings.email !== false) {
      result.email = extractBestEmail(searchCorpus);

      // Try common sub-pages if homepage has no email
      if (!result.email) {
        const subPages = ['/contact', '/about', '/contact-us', '/about-us', '/terms'];
        for (const path of subPages) {
          const subUrl = new URL(path, url).href;
          const subHtml = await fetchPage(subUrl);
          if (subHtml) {
            result.email = extractBestEmail(subHtml);
            if (result.email) break;
          }
        }
      }
      // Try mailto: links which are most reliable
      if (!result.email) {
        $('a[href^="mailto:"]').each((_, el) => {
          if (result.email) return;
          const href = $(el).attr('href') || '';
          const addr = href.replace('mailto:', '').split('?')[0].trim();
          if (addr && !isGenericEmail(addr)) result.email = addr;
        });
      }
    }

    // ── Social Media ──────────────────────────────────
    if (settings.social !== false) {
      // BUG FIX: regex exec with 'g' flag retains state — use match() instead
      const fbMatches = searchCorpus.match(FACEBOOK_REGEX) || [];
      const igMatches = searchCorpus.match(INSTAGRAM_REGEX) || [];
      const liMatches = searchCorpus.match(LINKEDIN_REGEX) || [];

      // Filter out generic/shared pages
      result.facebook  = fbMatches.find(m => !m.includes('sharer') && !m.includes('share')) 
                          ? `https://www.${fbMatches[0]}` : null;
      result.instagram = igMatches[0] ? `https://www.${igMatches[0]}` : null;
      result.linkedin  = liMatches[0] ? `https://www.${liMatches[0]}` : null;

      // Also check <a href> links for social (more reliable than regex on raw HTML)
      $('a[href]').each((_, el) => {
        const href = ($(el).attr('href') || '').toLowerCase();
        if (!result.facebook  && href.includes('facebook.com/')  && !href.includes('sharer')) result.facebook  = $(el).attr('href');
        if (!result.instagram && href.includes('instagram.com/')) result.instagram = $(el).attr('href');
        if (!result.linkedin  && href.includes('linkedin.com/'))  result.linkedin  = $(el).attr('href');
      });
    }

    // ── Tech Stack Detection ──────────────────────────
    if (settings.intelligence) {
      const detected = [];
      for (const [tech, patterns] of Object.entries(TECH_FINGERPRINTS)) {
        if (patterns.some(p => htmlLower.includes(p))) detected.push(tech);
      }
      result.techStack = detected.length ? detected.join(', ') : 'Standard HTML';

      // SEO / Technical checks
      result.hasMeta     = !!$('meta[name="description"]').attr('content');
      result.hasViewport = !!$('meta[name="viewport"]').attr('content');
      result.mobileIssue = !result.hasViewport;
      result.titleTag    = $('title').first().text().trim() || null;
    }

  } catch (err) {
    console.error(`[Enricher] Failed for ${url}:`, err.message);
  }

  return result;
}

// ── Email helpers ──────────────────────────────────────
function extractBestEmail(text) {
  // Reset regex state by creating a new instance
  const matches = text.match(EMAIL_REGEX) || [];
  const valid = matches.filter(e => !isGenericEmail(e));
  // Prefer emails with business-like domains (not gmail/yahoo/hotmail)
  const businessEmail = valid.find(e =>
    !e.toLowerCase().includes('gmail') &&
    !e.toLowerCase().includes('yahoo') &&
    !e.toLowerCase().includes('hotmail') &&
    !e.toLowerCase().includes('outlook')
  );
  return businessEmail || valid[0] || null;
}

function isGenericEmail(email) {
  const em = email.toLowerCase();
  const bad = ['example', 'test@', 'noreply', 'no-reply', 'donotreply',
               'info@example', 'user@', '@sentry', '@schema', 'email@email',
               'your@', 'name@', 'someone@'];
  return bad.some(p => em.includes(p));
}

// ── URL helper ─────────────────────────────────────────
function normalizeUrl(url) {
  if (!url) return null;
  url = url.trim();
  if (!url.startsWith('http')) url = 'https://' + url;
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch { return null; }
}

// ── HTTP fetcher ───────────────────────────────────────
async function fetchPage(url) {
  try {
    const res = await axios.get(url, {
      timeout: 9000,
      maxRedirects: 4,
      maxContentLength: 5 * 1024 * 1024, // 5MB cap
      responseType: 'text',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      }
    });
    // Only return if it's actually HTML
    const ct = res.headers['content-type'] || '';
    if (!ct.includes('html') && !ct.includes('text')) return null;
    return res.data;
  } catch (e) {
    // Silently ignore — site may be down or block bots
    return null;
  }
}

module.exports = { enrichWebsite };
