// Content script: detects Google Shopping pages, fetches rules from backend and injects a banner
(function () {
  // Test-friendly content script for Vom Platzl
  // - TEST_MODE: if true, use embedded rules so you can test without backend
  // - Exposes `window.vomPlatzl.setTestRules(arr)` and `window.vomPlatzl.run()` for quick manual tests

  const BACKEND = 'http://localhost:3000';
  const BANNER_ID = 'vom-platzl-banner';

  // Toggle test mode here. When true, the extension won't call the backend and will use `testRules`.
  const TEST_MODE = true;
  let testRules = ['ps5', 'playstation', 'nintendo'];

  console.log('vom-platzl content script loaded — TEST_MODE =', TEST_MODE);

  function isShoppingPage() {
    const url = location.href;
    // common shopping URL patterns (Google Shop tab / shopping results)
    return url.includes('/shopping') || url.includes('tbm=shop') || url.includes('/shopping?') || url.includes('/search') && url.includes('tbm=shop');
  }

  async function fetchRules() {
    if (TEST_MODE) {
      console.log('vom-platzl: using TEST rules', testRules);
      return testRules;
    }
    try {
      const res = await fetch(`${BACKEND}/rules`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.warn('vom-platzl: Failed to fetch rules', e);
      return [];
    }
  }

  function collectProductTexts() {
    const texts = new Set();

    // Try to find product cards that commonly appear in Google Shopping
    const cardSelectors = [
      '.sh-dgr__grid-result',
      '.sh-dlr__list-result',
      'g-inner-card',
      'div[data-attrid^="shopping_results"]',
      'div[data-attrid*="product"]',
      'div[jscontroller]'
    ];

    const cards = Array.from(document.querySelectorAll(cardSelectors.join(','))).filter(Boolean);

    // If we found cards, extract likely title nodes from each card
    if (cards.length > 0) {
      cards.forEach(card => {
        // prefer headings inside the card
        const titleCandidates = card.querySelectorAll('h3, h4, [role="heading"], .shntl, .sh-ct__title, span');
        for (const el of titleCandidates) {
          const t = el.innerText && el.innerText.trim();
          if (t && t.length > 2 && t.length < 200) texts.add(t);
        }
      });
    }

    // Fallback: scan main search area for headings/texts
    if (texts.size === 0) {
      const main = document.querySelector('main, #search, #rso');
      const scope = main || document.body;
      const fallbackNodes = scope.querySelectorAll('h3, h4, a > div > span, a > div, span');
      fallbackNodes.forEach(el => {
        if (el.childElementCount === 0) {
          const t = el.innerText && el.innerText.trim();
          if (t && t.length > 2 && t.length < 200) texts.add(t);
        }
      });
    }

    return Array.from(texts);
  }

  function matchRules(productTexts, rules) {
    const matches = [];
    const lowered = rules.map(r => (r || '').toLowerCase());
    productTexts.forEach(pt => {
      const lpt = (pt || '').toLowerCase();
      lowered.forEach(rule => {
        if (rule && lpt.includes(rule)) {
          matches.push({rule, text: pt});
        }
      });
    });
    return matches;
  }

  function injectBanner(matches) {
    if (!matches || matches.length === 0) return;
    if (document.getElementById(BANNER_ID)) return; // already injected

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.zIndex = '999999';
    banner.style.background = 'linear-gradient(90deg,#ffd54a,#ff7043)';
    banner.style.color = '#111';
    banner.style.padding = '12px 16px';
    banner.style.display = 'flex';
    banner.style.alignItems = 'center';
    banner.style.justifyContent = 'space-between';
    banner.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
    banner.style.fontFamily = 'Arial, sans-serif';

    const left = document.createElement('div');
    left.innerText = `Vom Platzl: ${matches.length} matching product(s) found`;
    left.style.fontWeight = '600';

    const right = document.createElement('div');
    right.style.display = 'flex';
    right.style.gap = '8px';

    const details = document.createElement('button');
    details.innerText = 'Details';
    details.style.border = 'none';
    details.style.background = 'rgba(0,0,0,0.08)';
    details.style.padding = '6px 10px';
    details.style.borderRadius = '6px';
    details.style.cursor = 'pointer';

    const close = document.createElement('button');
    close.innerText = 'Close';
    close.style.border = 'none';
    close.style.background = 'rgba(0,0,0,0.08)';
    close.style.padding = '6px 10px';
    close.style.borderRadius = '6px';
    close.style.cursor = 'pointer';

    details.addEventListener('click', () => {
      alert(matches.map(m => `rule: "${m.rule}", product: "${m.text}"`).join('\n'));
    });
    close.addEventListener('click', () => {
      banner.remove();
      // remove added padding
      document.documentElement.style.paddingTop = '';
    });

    right.appendChild(details);
    right.appendChild(close);

    banner.appendChild(left);
    banner.appendChild(right);

    document.body.appendChild(banner);

    // push body down so content isn't hidden
    document.documentElement.style.paddingTop = '56px';
  }

  // Debounce helper to avoid excessive work during dynamic page updates
  function debounce(fn, wait) {
    let t = null;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  async function run() {
    if (!isShoppingPage()) {
      // For testing, allow manual runs on non-shopping pages too
      if (!TEST_MODE) return;
    }

    const rules = await fetchRules();
    if (!rules || rules.length === 0) return;

    // Per-card matching: find product cards and insert inline banner for matching cards
    const cardSelectors = ['data-product-title'];
    const cards = Array.from(document.querySelectorAll(cardSelectors.join(','))).filter(Boolean);

    if (cards.length === 0) {
      // fallback to global text scan
      const productTexts = collectProductTexts();
      const matches = matchRules(productTexts, rules);
      if (matches.length > 0) {
        console.log('vom-platzl: matches found (global)', matches);
        injectBanner(matches);
      } else {
        const existing = document.getElementById(BANNER_ID);
        if (existing) {
          existing.remove();
          document.documentElement.style.paddingTop = '';
        }
        console.log('vom-platzl: no matches (checked', productTexts.length, 'texts)');
      }
      return;
    }

    // iterate cards and check title against rules
    const loweredRules = rules.map(r => (r || '').toLowerCase());
    let anyCardMatch = false;
    cards.forEach(card => {
      const title = extractTitleFromCard(card);
      if (!title) return;
      const ltitle = title.toLowerCase();
      const matched = loweredRules.filter(rule => rule && ltitle.includes(rule));
      // remove any previous per-card banners first
      const prev = card.querySelector('.vom-platzl-card-banner');
      if (prev) prev.remove();
      if (matched.length > 0) {
        anyCardMatch = true;
        insertBannerIntoCard(card, matched, title);
      }
    });

    // If at least one card matched, also keep the global top banner for visibility
    if (anyCardMatch) {
      console.log('vom-platzl: inserted per-card banners');
      // assemble global match summary (unique rules matched)
      const allMatchedRules = Array.from(new Set([].concat(...cards.map(c => {
        const t = extractTitleFromCard(c); if (!t) return []; const l = t.toLowerCase(); return loweredRules.filter(rule => rule && l.includes(rule));
      }))));
      if (allMatchedRules.length > 0) injectBanner(allMatchedRules.map(r => ({rule: r, text: ''})));
    } else {
      // remove global banner if none matched
      const existing = document.getElementById(BANNER_ID);
      if (existing) {
        existing.remove();
        document.documentElement.style.paddingTop = '';
      }
      console.log('vom-platzl: no per-card matches');
    }
  }

  // Watch for dynamic changes in search results and re-run matching (debounced)
  const debouncedRun = debounce(run, 350);
  const observer = new MutationObserver(mutations => {
    // If new nodes are added, re-run the matcher
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        debouncedRun();
        return;
      }
    }
  });

  // Start observing a sensible root element (search results area) or body as fallback
  function startObserver() {
    const root = document.querySelector('main, #search, #rso, body');
    if (root) {
      try {
        observer.observe(root, {childList: true, subtree: true});
        console.log('vom-platzl: observing DOM changes for dynamic results');
      } catch (e) {
        console.warn('vom-platzl: failed to observe DOM,', e);
      }
    }
  }

  // start observing immediately
  startObserver();

  // Basic click-to-show-product-name functionality
  function extractTitleFromCard(card) {
    if (!card) return null;
    const titleSelectors = ['h3', 'h4', '[role="heading"]', '.shntl', '.sh-ct__title', 'span'];
    for (const sel of titleSelectors) {
      const el = card.querySelector(sel);
      if (el && el.innerText && el.innerText.trim().length > 0) return el.innerText.trim();
    }
    // fallback: textContent of the card trimmed
    const txt = card.textContent && card.textContent.trim();
    if (txt && txt.length > 0) return txt.split('\n')[0].trim();
    return null;
  }

  function showToast(text) {
    if (!text) return;
    try {
      const id = 'vom-platzl-toast';
      let t = document.getElementById(id);
      if (t) t.remove();
      t = document.createElement('div');
      t.id = id;
      t.style.position = 'fixed';
      t.style.bottom = '18px';
      t.style.right = '18px';
      t.style.zIndex = '1000000';
      t.style.padding = '10px 14px';
      t.style.background = 'rgba(0,0,0,0.8)';
      t.style.color = 'white';
      t.style.borderRadius = '8px';
      t.style.fontFamily = 'Arial, sans-serif';
      t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      t.innerText = text;
      document.body.appendChild(t);
      setTimeout(() => {
        t && t.remove();
      }, 3500);
    } catch (e) {
      console.log('vom-platzl toast:', text);
    }
  }

  document.addEventListener('click', function (ev) {
    try {
      const cardSelectors = ['.sh-dgr__grid-result', '.sh-dlr__list-result', 'g-inner-card', 'div[data-attrid^="shopping_results"]', 'div[data-attrid*="product"]', 'div[jscontroller]'];
      let el = ev.target;
      // climb up the DOM to find a matching card
      while (el && el !== document.body) {
        if (el.matches) {
          for (const sel of cardSelectors) {
            if (el.matches(sel)) {
              const title = extractTitleFromCard(el) || extractTitleFromCard(ev.target.closest('a'));
              if (title) {
                // insert the product name into the card's HTML
                insertLabelIntoCard(el, title);
                showToast(title);
                // expose last clicked product
                try { window.vomPlatzl = window.vomPlatzl || {}; window.vomPlatzl.lastClicked = title; } catch(e){}
                return;
              }
            }
          }
        }
        el = el.parentElement;
      }
    } catch (e) {
      console.warn('vom-platzl click handler error', e);
    }
  }, true);

  // Insert a small label/badge into the clicked product card's HTML
  function insertLabelIntoCard(card, text) {
    if (!card || !text) return;
    try {
      // remove previous labels
      const prev = card.querySelector('.vom-platzl-inline-label');
      if (prev) prev.remove();

      // ensure card can contain absolutely positioned badge
      const prevPos = card.style.position;
      if (!prevPos || prevPos === '' || prevPos === 'static') {
        card.dataset.vomPlatzlPrevPos = 'static';
        card.style.position = 'relative';
      }

      const badge = document.createElement('div');
      badge.className = 'vom-platzl-inline-label';
      badge.innerText = text;
      badge.style.position = 'absolute';
      badge.style.top = '8px';
      badge.style.right = '8px';
      badge.style.zIndex = '999999';
      badge.style.background = 'rgba(255,215,74,0.95)';
      badge.style.color = '#111';
      badge.style.padding = '6px 8px';
      badge.style.borderRadius = '6px';
      badge.style.fontSize = '12px';
      badge.style.fontWeight = '600';
      badge.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
      badge.style.maxWidth = '60%';
      badge.style.overflow = 'hidden';
      badge.style.textOverflow = 'ellipsis';
      badge.style.whiteSpace = 'nowrap';

      card.appendChild(badge);

      // remove badge after timeout
      setTimeout(() => {
        try { badge.remove(); } catch (e) {}
      }, 5000);
    } catch (e) {
      console.warn('vom-platzl: failed to insert label into card', e);
    }
  }

  // Evaluate an XPath expression and return an array of matched nodes
  function evaluateXPath(xpath) {
    try {
      const result = [];
      const xpathResult = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      for (let i = 0; i < xpathResult.snapshotLength; i++) {
        result.push(xpathResult.snapshotItem(i));
      }
      return result;
    } catch (e) {
      console.warn('vom-platzl: invalid xpath', xpath, e);
      return [];
    }
  }

  // Highlight all nodes returned by an XPath query (make orange for testing)
  function highlightXPath(xpath, options = {}) {
    const color = options.color || 'orange';
    const className = 'vom-platzl-xpath-highlight';
    // remove previous highlights if any
    document.querySelectorAll(`.${className}`).forEach(n => {
      try { n.classList.remove(className); n.style.outline = ''; n.style.background = ''; } catch (e) {}
    });

    const nodes = evaluateXPath(xpath);
    if (!nodes || nodes.length === 0) {
      console.log('vom-platzl: highlightXPath found no nodes for', xpath);
      return nodes;
    }

    nodes.forEach(node => {
      try {
        if (node.nodeType === Node.ELEMENT_NODE) {
          node.classList.add(className);
          // apply inline styling to make the element clearly visible
          node.style.background = color;
          node.style.outline = '2px solid #b35f00';
        }
      } catch (e) {
        console.warn('vom-platzl: failed to style node', e);
      }
    });
    console.log('vom-platzl: highlightXPath styled', nodes.length, 'nodes for', xpath);
    return nodes;
  }

  // expose a small dev API so you can change rules and trigger runs from the console
  try {
    window.vomPlatzl = window.vomPlatzl || {};
    window.vomPlatzl.setTestRules = function (arr) {
      if (!Array.isArray(arr)) return console.warn('vom-platzl: setTestRules expects an array');
      testRules = arr.map(String);
      console.log('vom-platzl: testRules updated', testRules);
    };
    window.vomPlatzl.run = run;
    // expose xpath highlighter
    window.vomPlatzl.highlightXPath = function (xpath, opts) { return highlightXPath(xpath, opts); };
    // run a default highlight for the requested xpath (make elements orange) for quick testing
    try { highlightXPath('/html/body/div[3]/div[2]/div[4]'); } catch (e) {}
  } catch (e) {
    // ignore in strict environments
  }

  // Run on initial load and also on navigation events (single-page nav)
  run();
  // observe URL changes (history API) to re-run
  let lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      run();
    }
  }, 1000);
})();
