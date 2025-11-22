(function () {
  // --- CONFIGURATION ---
  const HERO_ID = 'vom-platzl-hero-section';

  // Store configuration
  const STORE_IMAGE_URL = ''; // Set your store image URL here
  const STORE_LATITUDE = 48.1351; // Munich coordinates (default)
  const STORE_LONGITUDE = 11.5820;

  // Modern Brand Colors
  const C_PRIMARY = '#2563eb';      // Modern blue
  const C_PRIMARY_LIGHT = '#3b82f6';
  const C_PRIMARY_DARK = '#1e40af';
  const C_ACCENT = '#10b981';       // Fresh green
  const C_BG = '#ffffff';
  const C_BG_SECONDARY = '#f8fafc';
  const C_TEXT = '#0f172a';
  const C_TEXT_SECONDARY = '#64748b';
  const C_BORDER = '#e2e8f0';

  // --- THE HERO SECTION (BRUTE FORCE INJECTION) ---


  BACKEND_URL = 'http://localhost:8000'

  async function getData(query, ip, address) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'fetchData', query, ip, address },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            resolve(null);
          } else if (response && response.success) {
            resolve(response.data);
          } else {
            console.error('API error:', response ? response.error : 'Unknown error');
            resolve(null);
          }
        }
      );
    });
  }


  // Google Maps Embed API with Directions
  function getDirectionsEmbedUrl(userLat, userLng) {
    // Interactive Google Maps embed with route directions
    // This shows an interactive map with the route displayed
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_CONFIG.API_KEY}&origin=${userLat},${userLng}&destination=${STORE_LATITUDE},${STORE_LONGITUDE}&zoom=${GOOGLE_MAPS_CONFIG.ZOOM_LEVEL}`;
  }

  function getStoreEmbedUrl() {
    // Interactive map showing store location when user location is not available
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.API_KEY}&q=${STORE_LATITUDE},${STORE_LONGITUDE}&zoom=14`;
  }

  function injectHeroSection(userLocation = null, data = null) {
    if (document.getElementById(HERO_ID)) return;

    // STRATEGY: Find the main content area, but we'll break out of its constraints
    // #center_col = The main center column in standard Search
    // #search = The container for results
    const mainContent = document.querySelector('#center_col')
      || document.querySelector('#search')
      || document.querySelector('#rso')
      || document.querySelector('div[role="main"]');

    if (!mainContent) {
      console.log("🦁 Vom Platzl: CRITICAL - No injection target found.");
      return;
    } else {
      console.log("main content", mainContent)
    }

    // Create a wrapper that breaks out to full viewport width
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width: 100%;
      grid-column: 2 / span 12;
      position: relative;
      margin-bottom: 20px;
      box-sizing: border-box;
      overflow-x: hidden;
    `;
    // Give the wrapper a stable class so we can adjust its grid placement when expanded
    wrapper.classList.add('vp-wrapper');

    // Create the search result block (styled like Google search results)
    const hero = document.createElement('div');
    hero.id = HERO_ID;

    hero.style.cssText = `
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
      padding: 20px 28px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      z-index: 10;
      display: block;
      border: 1px solid ${C_BORDER};
      border-radius: 12px;
      overflow: hidden;
      overflow-x: hidden;
      background: linear-gradient(135deg, ${C_BG} 0%, ${C_BG_SECONDARY} 100%);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const mapsUrl = `https://www.google.com/maps?q=${STORE_LATITUDE},${STORE_LONGITUDE}`;

    // Generate interactive map embed URL with route
    let embedMapUrl;
    if (userLocation && userLocation.lat && userLocation.lng) {
      embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng);
    } else {
      embedMapUrl = getStoreEmbedUrl();
    }

    let data_html = `<ul style="list-style-type: disc; padding-left: 20px; margin: 0;">`;
    const places = data.places || [];
    const maxStores = Math.min(5, places.length);
    for (let i = 0; i < maxStores; i++) { 
      const place = places[i];
      const element_html = `<li style="margin-bottom: 4px; color: ${C_TEXT};">${place.name || 'Unknown Store'} - ${place.distance || ''}</li>`;
      data_html += element_html;
    }
    data_html += `</ul>`;

    hero.innerHTML = `
      <div style="display: flex; align-items: center; gap: 24px; max-width: 100%; justify-content: space-between; width: 100%;">
        <!-- Left: Image -->
        <div style="
          width: 96px;
          height: 96px;
          background: linear-gradient(135deg, ${C_PRIMARY_LIGHT} 0%, ${C_PRIMARY} 100%);
          border: none;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
        ">
          ${STORE_IMAGE_URL ?
        `<img src="${STORE_IMAGE_URL}" alt="Store" style="width: 100%; height: 100%; object-fit: cover;" />` :
        '🦁'
      }
        </div>
        ${data_html}
        
        <!-- Middle: Text Content -->
        <div style="flex: 1; min-width: 0; max-width: 100%; padding: 0 16px;">
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: ${C_ACCENT};
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          ">
            <span>✨</span>
            <span>In deiner Nähe verfügbar</span>
          </div>
          
          <h3 style="
            margin: 0 0 6px 0;
            padding: 0;
            font-size: 20px;
            font-weight: 600;
            line-height: 1.3;
            color: ${C_TEXT};
          ">
            Vom Platzl - Lokale Produkte entdecken
          </h3>
          
          <div style="
            margin: 0 0 12px 0;
            font-size: 14px;
            line-height: 1.5;
            color: ${C_TEXT_SECONDARY};
          ">
            Finde diese Produkte in Geschäften in deiner Umgebung – schneller und nachhaltiger als Online-Shopping
          </div>
        
          
          <div style="
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          ">
            <a href="${mapsUrl}" target="_blank" style="
              background: ${C_PRIMARY};
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
              transition: all 0.2s ease;
              box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
            " onmouseover="this.style.background='${C_PRIMARY_DARK}'; this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(37, 99, 235, 0.3)'" onmouseout="this.style.background='${C_PRIMARY}'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(37, 99, 235, 0.2)'">
              <span>📍</span>
              <span>Route anzeigen</span>
            </a>
            
            <a href="#" style="
              color: ${C_PRIMARY};
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              padding: 10px 16px;
              border-radius: 8px;
              transition: all 0.2s ease;
            " onmouseover="this.style.backgroundColor='${C_BG_SECONDARY}'; this.style.textDecoration='none'" onmouseout="this.style.backgroundColor='transparent'; this.style.textDecoration='none'">
              Alle Geschäfte anzeigen →
            </a>
          </div>
        </div>
        
        <!-- Right: Interactive Route Map -->
        <div class="vp-map" style="
          width: 320px;
          max-width: 35%;
          height: 180px;
          border: 2px solid ${C_BORDER};
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">
          <iframe class="vp-iframe"
            src="${embedMapUrl}"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="eager"
            referrerpolicy="no-referrer-when-downgrade"
            title="${userLocation && userLocation.lat && userLocation.lng ? 'Route zum Geschäft' : 'Geschäftsstandort'}"
          ></iframe>
        </div>
        <!-- Minimize Button (hidden until expanded) -->
        <button id="vp-minimize-btn" style="display:none; position:absolute; top:16px; right:16px; background:${C_PRIMARY}; color:#fff; border:0; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; z-index:20; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);" onmouseover="this.style.background='${C_PRIMARY_DARK}'; this.style.transform='scale(1.05)'" onmouseout="this.style.background='${C_PRIMARY}'; this.style.transform='scale(1)'">✕ Schließen</button>
      </div>
    `;

    // Wrap the hero in the full-width wrapper
    wrapper.appendChild(hero);

    // Add modern CSS for expanded state and hover effects
    if (!document.getElementById('vom-platzl-vp-styles')) {
      const style = document.createElement('style');
      style.id = 'vom-platzl-vp-styles';
      style.textContent = `
        #${HERO_ID} { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        #${HERO_ID}:hover { 
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          transform: translateY(-2px);
        }
        #${HERO_ID}.vp-expanded { 
          width: 100% !important;
          background: linear-gradient(135deg, ${C_BG} 0%, ${C_BG_SECONDARY} 100%) !important;
          padding: 32px 40px !important;
          cursor: default;
          transform: translateY(0) !important;
        }
        #${HERO_ID}.vp-expanded:hover {
          transform: translateY(0) !important;
        }
        #${HERO_ID} .vp-map { 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #${HERO_ID}.vp-expanded .vp-map { 
          width: 65% !important;
          height: 420px !important;
          max-width: none !important;
        }
        #vp-minimize-btn { 
          transition: all 0.2s ease;
        }
        /* When the wrapper is marked expanded, span more grid columns */
        .vp-wrapper.vp-expanded { 
          grid-column: 2 / span 20 !important;
        }
        
        /* Smooth animations for all interactive elements */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        #${HERO_ID} {
          animation: slideIn 0.4s ease-out;
        }
      `;
      document.head.appendChild(style);
    }

    // EXPAND / MINIMIZE LOGIC
    // Expand when clicking anywhere on the hero (per request: ignore inner buttons)
    hero.addEventListener('click', function (e) {
      // If already expanded and user clicks hero, do nothing (minimize only via button)
      if (!hero.classList.contains('vp-expanded')) {
        hero.classList.add('vp-expanded');
        // also mark the wrapper as expanded so we can change its grid-column
        wrapper.classList.add('vp-expanded');
        const minBtn = hero.querySelector('#vp-minimize-btn');
        if (minBtn) minBtn.style.display = 'block';
      }
    });

    // Minimize button should collapse the hero. Stop propagation so the hero click won't re-expand.
    const minBtn = hero.querySelector('#vp-minimize-btn');
    if (minBtn) {
      minBtn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        hero.classList.remove('vp-expanded');
        // remove expanded marker from wrapper so grid placement reverts
        wrapper.classList.remove('vp-expanded');
        // restore small map sizing (inline fallback)
        const map = hero.querySelector('.vp-map');
        if (map) {
          map.style.width = '';
          map.style.height = '';
        }
        minBtn.style.display = 'none';
      });
    }

    // THE BRUTE FORCE: Insert as the very first child of the target
    // This pushes everything else down.
    const body = document.body
    mainContent.parentElement.prepend(wrapper);
    console.log("🦁 Vom Platzl: Search result block injected into", mainContent);
  }

  // --- RUNNER ---

  function getGoogleSearchQuery() {
    // 1. Primary: URL Query Parameter (Most accurate for current results)
    const urlParams = new URLSearchParams(window.location.search);
    console.log(urlParams)
    if (urlParams.has('q')) {
      return urlParams.get('q');
    }
    return null;
  }

  function getUserLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log("🦁 Geolocation not supported");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("🦁 Geolocation error:", error.message);
          resolve(null);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  async function run() {
    // Check shopping intent placeholder — the hero is shown only when this is true.
    const shoppingIntent = isLikelyShoppingPage(document.body);
    if (shoppingIntent) {
      console.log('vom-platzl: shoppingIntent=true — injecting hero section');

      const query = getGoogleSearchQuery();
      console.log('vom-platzl: query extracted:', query);

      // Pass query and hardcoded IP
      const data = await getData(query, '8.8.8.8', '')
      console.log('vom-platzl: backend data received:', data);

      const userLocation = await getUserLocation();
      injectHeroSection(userLocation, data);
    } else {
      // remove existing hero if present
      const existing = document.getElementById(HERO_ID);
      if (existing) existing.remove();
      console.log('vom-platzl: shoppingIntent=false — not injecting hero');
    }
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


function insertTestBanner() {
  // Prevent duplicates if your script runs multiple times
  if (document.getElementById("local-booster-test-banner")) return;

  const banner = document.createElement("div");
  banner.id = "local-booster-test-banner";

  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
      <span style="font-size: 20px;">✅</span>
      <span>Vom Platzl Extension aktiv – Lokale Produkte werden hervorgehoben</span>
    </div>
  `;

  // Modern banner styling
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "600",
    textAlign: "center",
    zIndex: "999999",
    borderBottom: "none",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    backdropFilter: "blur(10px)"
  });

  document.body.appendChild(banner);

  // Push page content down so banner doesn't cover it
  document.body.style.marginTop = "52px";
}



// -------- Shopping Intent ------------

/**
 * Checks the DOM for elements highly specific to Google Shopping results.
 * This can confirm transactional intent even if the URL doesn't contain tbm=shop.
 * NOTE: Selectors must be found by inspecting the actual Google SERP HTML.
 * * @returns {boolean} True if the page contains visible shopping-specific elements.
 */
function isLikelyShoppingPage(root = document.body) {
    try {
        // 1. Check the URL for explicit shopping indicators
        const url = (location && location.href) ? location.href.toLowerCase() : '';
        if (url.includes('/shopping') || url.includes('tbm=shop')) return true;

        // 2. Look for shopping-specific UI elements (localized text or known containers)
        const sponsoredLabel = findElementContainingText("gesponserte produkte", root) || findElementContainingText("sponsored products", root);
        if (sponsoredLabel) return true;

        const selectors = [
            '.sh-dgr__grid-result',
            '.sh-dlr__list-result',
            'g-inner-card',
            '[data-attrid^="shopping_results"]',
            '[data-attrid*="product"]',
            'a[href*="/shopping"]'
        ];
        for (const sel of selectors) {
            if (root.querySelector && root.querySelector(sel)) return true;
        }

        return false;
    } catch (e) {
        console.warn('shopping_intent: error in isLikelyShoppingPage', e);
        return false;
    }
}

/**
 * Utility function to find the first element on the page containing the specified text.
 * @param {string} text The text string to search for.
 * @param {HTMLElement} root The root element to search within (defaults to document.body).
 * @returns {HTMLElement | null} The matching element or null if not found.
 */
function findElementContainingText(text, root = document.body) {
    // 1. Create a TreeWalker to traverse the DOM efficiently
    const walker = document.createTreeWalker(
        root, 
        NodeFilter.SHOW_TEXT,
        null, 
        false
    );

    let node;
    const lowerCaseText = text.toLowerCase();

    while (node = walker.nextNode()) {
        if (node.textContent && node.textContent.toLowerCase().includes(lowerCaseText)) {
            console.log(node)
            return node;
        }
    }

    return null;
}


