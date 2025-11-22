(function () {
  // --- CONFIGURATION ---
  const HERO_ID = 'vom-platzl-hero-section';

  // Store configuration
  const STORE_IMAGE_URL = ''; // Set your store image URL here
  const STORE_LATITUDE = 48.1351; // Munich coordinates (default)
  const STORE_LONGITUDE = 11.5820;

  // Brand Colors
  const C_GOLD = '#F2D027';
  const C_BLACK = '#202124';
  const C_BG_LIGHT = '#FFFDF5';

  // --- THE HERO SECTION (BRUTE FORCE INJECTION) ---

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

  function injectHeroSection(userLocation = null) {
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
      position: relative;
      margin-bottom: 20px;
      box-sizing: border-box;
      overflow-x: hidden;
    `;

    // Create the search result block (styled like Google search results)
    const hero = document.createElement('div');
    hero.id = HERO_ID;

    hero.style.cssText = `
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      margin: 0 auto;
      padding: 16px 24px;
      background: #ffffff;
      font-family: arial, sans-serif;
      position: relative;
      z-index: 10;
      display: block;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      overflow-x: hidden;
    `;

    const mapsUrl = `https://www.google.com/maps?q=${STORE_LATITUDE},${STORE_LONGITUDE}`;

    // Generate interactive map embed URL with route
    let embedMapUrl;
    if (userLocation && userLocation.lat && userLocation.lng) {
      embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng);
    } else {
      embedMapUrl = getStoreEmbedUrl();
    }

    hero.innerHTML = `
      <div style="display: flex; align-items: center; gap: 20px; max-width: 100%; justify-content: space-between; width: 100%;">
        <!-- Left: Image -->
        <div style="
          width: 80px;
          height: 80px;
          background: ${C_BG_LIGHT};
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          flex-shrink: 0;
          overflow: hidden;
        ">
          ${STORE_IMAGE_URL ?
        `<img src="${STORE_IMAGE_URL}" alt="Store" style="width: 100%; height: 100%; object-fit: cover;" />` :
        '🦁'
      }
        </div>
        
        <!-- Middle: Text Content -->
        <div style="flex: 1; min-width: 0; max-width: 100%; padding: 0 12px;">
          <h3 style="
            margin: 0 0 3px 0;
            padding: 0;
            font-size: 16px;
            font-weight: normal;
            line-height: 1.2;
          ">
          </h3>
          
          <div style="
            margin: 0 0 3px 0;
            font-size: 12px;
            line-height: 1.2;
            color: #006621;
          ">
            vom-platzl.de › local-scout
          </div>
        
          
          <div style="
            display: flex;
            gap: 8px;
            align-items: center;
            flex-wrap: wrap;
          ">
            <a href="${mapsUrl}" target="_blank" style="
              background: ${C_BLACK};
              color: ${C_GOLD};
              text-decoration: none;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: bold;
              font-size: 11px;
              cursor: pointer;
              display: inline-block;
              white-space: nowrap;
              transition: background 0.2s;
            " onmouseover="this.style.background='#303030'" onmouseout="this.style.background='${C_BLACK}'">
              📍 Open in Maps
            </a>
            
            <a href="#" style="
              color: #1a0dab;
              text-decoration: none;
              font-size: 12px;
              cursor: pointer;
            " onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
              View Local Map →
            </a>
            <span style="color: #70757a;">·</span>
            <a href="#" style="
              color: #1a0dab;
              text-decoration: none;
              font-size: 12px;
              cursor: pointer;
            " onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">
              Browse Stores
            </a>
          </div>
        </div>
        
        <!-- Right: Interactive Route Map -->
        <div style="
          width: 280px;
          max-width: 30%;
          height: 140px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          flex-shrink: 0;
        ">
          <iframe 
            src="${embedMapUrl}"
            width="100%"
            height="100%"
            style="border:0;"
            allowfullscreen=""
            loading="eager"
            referrerpolicy="no-referrer-when-downgrade"
            title="${userLocation && userLocation.lat && userLocation.lng ? 'Route to Store' : 'Store Location'}"
          ></iframe>
        </div>
      </div>
    `;

    // Wrap the hero in the full-width wrapper
    wrapper.appendChild(hero);

    // THE BRUTE FORCE: Insert as the very first child of the target
    // This pushes everything else down.
    const body = document.body
    mainContent.prepend(wrapper);
    console.log("🦁 Vom Platzl: Search result block injected into", mainContent);
  }

  // --- RUNNER ---

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
      const userLocation = await getUserLocation();
      injectHeroSection(userLocation);
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

  banner.textContent = "Test Banner – Your Shopping Enhancement is Active";

  // Basic styling so it looks like a real banner
  Object.assign(banner.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    padding: "12px 16px",
    background: "#ffcc00",
    color: "#000",
    fontSize: "16px",
    fontWeight: "bold",
    textAlign: "center",
    zIndex: "999999",        // Ensure it's above everything
    borderBottom: "2px solid #000",
    fontFamily: "Arial, sans-serif"
  });

  document.body.appendChild(banner);

  // Push page content down so banner doesn't cover it
  document.body.style.marginTop = "50px";
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


