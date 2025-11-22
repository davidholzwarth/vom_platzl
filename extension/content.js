(function () {
  // --- CONFIGURATION ---
  const HERO_ID = 'vom-platzl-hero-section';
  const HEADER_ID = 'vom-platzl-sticky-header';

  // Store configuration
  const STORE_IMAGE_URL = ''; // Set your store image URL here
  const STORE_LATITUDE = 48.1351; // Munich coordinates (default)
  const STORE_LONGITUDE = 11.5820;

  // Modern Brand Colors
  const C_PRIMARY = '#2563eb';      // Modern blue
  const C_PRIMARY_LIGHT = '#3b82f6';
  const C_PRIMARY_DARK = '#1e40af';
  const C_ACCENT = '#10b981';       // Fresh green
  const C_BG = '#40c6f7';
  const C_BG_SECONDARY = '#f8fafc';
  const C_TEXT = '#0f172a';
  const C_TEXT_SECONDARY = '#64748b';
  const C_BORDER = '#e2e8f0';

  // --- THE HERO SECTION (BRUTE FORCE INJECTION) ---


  BACKEND_URL = 'http://localhost:8000'

  async function getData(query, lat, lon) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { action: 'fetchData', query, lat, lon },
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
  function getDirectionsEmbedUrl(userLat, userLng, destLat, destLng) {
    // Interactive Google Maps embed with route directions
    // This shows an interactive map with the route displayed
    const destination = destLat && destLng ? `${destLat},${destLng}` : `${STORE_LATITUDE},${STORE_LONGITUDE}`;
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_CONFIG.API_KEY}&origin=${userLat},${userLng}&destination=${destination}&mode=walking&zoom=${GOOGLE_MAPS_CONFIG.ZOOM_LEVEL}`;
  }

  function getStoreEmbedUrl() {
    // Interactive map showing store location when user location is not available
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.API_KEY}&q=${STORE_LATITUDE},${STORE_LONGITUDE}&zoom=14`;
  }

  function injectHeroSection(userLocation = null, data = null) {
    const existingHero = document.getElementById(HERO_ID);
    
    // If hero already exists and we have data, just update it
    if (existingHero && data) {
      updateHeroWithData(data);
      return;
    }
    
    // If hero already exists, don't inject again
    if (existingHero) return;

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
      background: ${C_BG};
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const mapsUrl = `https://www.google.com/maps?q=${STORE_LATITUDE},${STORE_LONGITUDE}`;

    // Generate interactive map embed URL with route
    let embedMapUrl;
    if (userLocation && userLocation.lat && userLocation.lng) {
      // Get first place destination if data is available
      const firstPlace = data && data.places && data.places.length > 0 ? data.places[0] : null;
      const destLat = firstPlace ? firstPlace.lat : null;
      const destLng = firstPlace ? firstPlace.lon : null;
      embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng, destLat, destLng);
    } else {
      embedMapUrl = getStoreEmbedUrl();
    }

    // Initial loading state
    let data_html = `<div id="vp-places-container" style="color: ${C_TEXT_SECONDARY}; font-style: italic;">Lädt Geschäfte...</div>`;

    hero.innerHTML = `
      <div style="display: flex; align-items: center; gap: 24px; max-width: 100%; justify-content: space-between; width: 100%;">
        <!-- Left: Image -->
        <div style="
          width: 96px;
          height: 96px;
          background: ${C_BG};
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
            Finde diese Produkte in Geschäften in deiner Umgebung.
          </div>
        
          
          <div style="
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
          ">

            
            <a href="#" class="vp-secondary-btn" style="
              color: ${C_PRIMARY};
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              padding: 10px 16px;
              border-radius: 8px;
              transition: all 0.2s ease;
            ">
              Alle Geschäfte anzeigen →
            </a>
          </div>
        </div>
        
      </div>
      
      <!-- Expanded Content (hidden until expanded) -->
      <div class="vp-expanded-section" style="display: none; margin-top: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: stretch;">
          <!-- Left: Places List -->
          <div class="vp-places-list">
            <h4 style="
              margin: 0 0 16px 0;
              font-size: 18px;
              font-weight: 600;
              color: ${C_TEXT};
            ">
              Verfügbare Geschäfte
            </h4>
            ${data_html}
          </div>
          
          <!-- Right: Interactive Route Map -->
          <div class="vp-map" style="
            width: 100%;
            height: 100%;
            min-height: 400px;
            border: 2px solid ${C_BORDER};
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 20px;
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
        </div>
      </div>
      
      <!-- Minimize Button (hidden until expanded) -->
      <button id="vp-minimize-btn" class="vp-close-btn" style="display:none; position:absolute; top:16px; right:16px; background:${C_PRIMARY}; color:#fff; border:0; padding:8px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; z-index:20; transition: all 0.2s ease; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">✕ Schließen</button>
    `;

    // Wrap the hero in the full-width wrapper
    wrapper.appendChild(hero);

    // Add event listeners for buttons (CSP-compliant)
    const primaryBtn = hero.querySelector('.vp-primary-btn');
    if (primaryBtn) {
      primaryBtn.addEventListener('mouseenter', function () {
        this.style.background = C_PRIMARY_DARK;
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
      });
      primaryBtn.addEventListener('mouseleave', function () {
        this.style.background = C_PRIMARY;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
      });
    }

    const closeBtn = hero.querySelector('.vp-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('mouseenter', function () {
        this.style.background = C_PRIMARY_DARK;
        this.style.transform = 'scale(1.05)';
      });
      closeBtn.addEventListener('mouseleave', function () {
        this.style.background = C_PRIMARY;
        this.style.transform = 'scale(1)';
      });
    }

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
          background: ${C_BG};
          padding: 32px 40px !important;
          cursor: default;
          transform: translateY(0) !important;
        }
        #${HERO_ID}.vp-expanded:hover {
          transform: translateY(0) !important;
        }
        
        /* Expanded section is hidden by default */
        #${HERO_ID} .vp-expanded-section { 
          display: none !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Show expanded section when expanded */
        #${HERO_ID}.vp-expanded .vp-expanded-section { 
          display: block !important;
        }
        /* Hide the secondary button when expanded */
        #${HERO_ID}.vp-expanded .vp-secondary-btn { 
          display: none !important;
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
        
        // Toggle places list views
        const minimized = hero.querySelector('.vp-places-minimized');
        const expanded = hero.querySelector('.vp-places-expanded');
        if (minimized) minimized.style.display = 'none';
        if (expanded) expanded.style.display = 'flex';
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
        
        // Toggle places list views back
        const minimized = hero.querySelector('.vp-places-minimized');
        const expanded = hero.querySelector('.vp-places-expanded');
        if (minimized) minimized.style.display = 'flex';
        if (expanded) expanded.style.display = 'none';
      });
    }

    // THE BRUTE FORCE: Insert as the very first child of the target
    // This pushes everything else down.
    const body = document.body
    mainContent.parentElement.prepend(wrapper);
    console.log("🦁 Vom Platzl: Search result block injected into", mainContent);
    
    // If we already have data, update immediately
    if (data) {
      updateHeroWithData(data);
    }
  }
  
  // Helper function to get today's opening hours text
  function getTodayOpeningHours(opening_hours) {
    if (!opening_hours || !opening_hours.weekday_text) return 'Keine Öffnungszeiten verfügbar';
    
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayIndex = today === 0 ? 6 : today - 1; // Convert to weekday_text index (Monday = 0)
    
    return opening_hours.weekday_text[dayIndex] || 'Keine Öffnungszeiten verfügbar';
  }

  // Helper function to check if currently open
  function isOpenNow(opening_hours) {
    return opening_hours && opening_hours.open_now === true;
  }

  // Helper function to get time until next opening
  function getTimeUntilOpening(opening_hours) {
    if (!opening_hours || !opening_hours.periods) {
      return 'Geschlossen';
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 100 + now.getMinutes(); // e.g., 1430 for 14:30

    // Try to find next opening in the same day or upcoming days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const checkDay = (currentDay + dayOffset) % 7;
      
      const periodsForDay = opening_hours.periods.filter(p => p.open.day === checkDay);
      
      for (const period of periodsForDay) {
        const openTime = parseInt(period.open.time);
        
        // If it's today and opening time is in the future
        if (dayOffset === 0 && openTime > currentTime) {
          const openHour = Math.floor(openTime / 100);
          const openMinute = openTime % 100;
          
          const openDate = new Date(now);
          openDate.setHours(openHour, openMinute, 0, 0);
          
          const diffMs = openDate - now;
          const diffMinutes = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMinutes / 60);
          const remainingMinutes = diffMinutes % 60;
          
          if (diffHours > 0) {
            return `Öffnet in ${diffHours}h ${remainingMinutes}min`;
          } else {
            return `Öffnet in ${diffMinutes}min`;
          }
        }
        
        // If it's a future day
        if (dayOffset > 0) {
          const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
          const openHour = Math.floor(openTime / 100);
          const openMinute = openTime % 100;
          const timeStr = `${String(openHour).padStart(2, '0')}:${String(openMinute).padStart(2, '0')}`;
          
          if (dayOffset === 1) {
            return `Öffnet morgen um ${timeStr}`;
          } else {
            return `Öffnet ${dayNames[checkDay]} um ${timeStr}`;
          }
        }
      }
    }
    
    return 'Geschlossen';
  }

  function updateHeroWithData(data) {
    const container = document.getElementById('vp-places-container');
    if (!container) return;
    
    const places = data.places || [];
    const maxStores = Math.min(5, places.length);
    
    if (maxStores === 0) {
      container.innerHTML = `<div style="color: ${C_TEXT_SECONDARY}; text-align: center; padding: 20px;">Keine Geschäfte gefunden</div>`;
      return;
    }
    
    // Check if hero is currently expanded
    const hero = document.getElementById(HERO_ID);
    const isExpanded = hero && hero.classList.contains('vp-expanded');
    
    // Create minimized version (simple list with names)
    let minimized_html = `<div class="vp-places-minimized" style="display: ${isExpanded ? 'none' : 'flex'}; flex-direction: column; gap: 8px;">`;
    
    for (let i = 0; i < maxStores; i++) {
      const place = places[i];
      const openNow = isOpenNow(place.opening_hours);
      const openIndicator = place.opening_hours ? 
        `<span style="
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${openNow ? C_ACCENT : '#ef4444'};
          margin-right: 8px;
        "></span>` : '';
      
      minimized_html += `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          font-size: 14px;
          color: ${C_TEXT};
          transition: all 0.2s ease;
        " class="vp-place-mini">
          <div style="display: flex; align-items: center;">
            ${openIndicator}
            <span style="font-weight: 500;">${place.name || 'Unbekanntes Geschäft'}</span>
          </div>
          ${place.distance ? `<span style="font-size: 12px; color: ${C_TEXT_SECONDARY}; font-weight: 500;">${place.distance}</span>` : ''}
        </div>
      `;
    }
    minimized_html += `</div>`;
    
    // Create expanded version (detailed cards)
    let expanded_html = `<div class="vp-places-expanded" style="display: ${isExpanded ? 'flex' : 'none'}; flex-direction: column; gap: 16px;">`;
    
    for (let i = 0; i < maxStores; i++) {
      const place = places[i];
      const openNow = isOpenNow(place.opening_hours);
      const todayHours = getTodayOpeningHours(place.opening_hours);
      const rating = place.rating ? `⭐ ${place.rating}` : '';
      const ratingCount = place.user_ratings_total ? ` (${place.user_ratings_total})` : '';
      
      expanded_html += `
        <div style="
          background: white;
          border: 1px solid ${C_BORDER};
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          transition: all 0.2s ease;
        " class="vp-place-card">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div style="flex: 1;">
              <h5 style="
                margin: 0 0 4px 0;
                font-size: 16px;
                font-weight: 600;
                color: ${C_TEXT};
              ">${place.name || 'Unbekanntes Geschäft'}</h5>
              ${place.tags && place.tags.vicinity ? `
                <div style="
                  font-size: 13px;
                  color: ${C_TEXT_SECONDARY};
                  margin-bottom: 4px;
                ">📍 ${place.tags.vicinity}</div>
              ` : ''}
              ${place.distance ? `
                <div style="
                  font-size: 13px;
                  color: ${C_TEXT_SECONDARY};
                  font-weight: 500;
                ">${place.distance}</div>
              ` : ''}
              ${rating ? `
                <div style="
                  font-size: 13px;
                  color: ${C_TEXT_SECONDARY};
                ">${rating}${ratingCount}</div>
              ` : ''}
            </div>
          </div>
          
          ${place.opening_hours.weekday_text ? `
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: ${openNow ? '#ecfdf5' : '#fef2f2'};
            border-radius: 8px;
            margin-bottom: 12px;
          ">
            <span style="
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${openNow ? C_ACCENT : '#ef4444'};
            "></span>
            <span style="
              font-size: 13px;
              font-weight: 500;
              color: ${openNow ? '#059669' : '#dc2626'};
            ">${openNow ? 'Jetzt geöffnet' : getTimeUntilOpening(place.opening_hours)}</span>
          </div>
          
          <div style="
            font-size: 13px;
            color: ${C_TEXT_SECONDARY};
            margin-bottom: 12px;
          ">
            <div style="font-weight: 600; margin-bottom: 6px; color: ${C_TEXT};">🕒 Öffnungszeiten</div>
            ${place.opening_hours.weekday_text ? place.opening_hours.weekday_text.map(day => 
              `<div style="padding: 2px 0; padding-left: 16px;">${day}</div>`
            ).join('') : ''}
          </div>
          ` : `
          <div style="
            font-size: 13px;
            color: ${C_TEXT_SECONDARY};
            font-style: italic;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: ${C_BG_SECONDARY};
            border-radius: 8px;
          ">Öffnungszeiten nicht verfügbar</div>
          `}
          
          <a href="${place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}" 
             target="_blank"
             rel="noopener noreferrer"
             style="
               display: inline-flex;
               align-items: center;
               gap: 6px;
               color: ${C_PRIMARY};
               text-decoration: none;
               font-size: 14px;
               font-weight: 500;
               padding: 8px 16px;
               background: ${C_BG_SECONDARY};
               border-radius: 8px;
               transition: all 0.2s ease;
             "
             class="vp-maps-link">
            <span>📍</span>
            <span>In Google Maps öffnen</span>
          </a>
        </div>
      `;
    }
    expanded_html += `</div>`;
    
    container.innerHTML = minimized_html + expanded_html;
    
    // Add hover effects with event listeners
    const miniCards = container.querySelectorAll('.vp-place-mini');
    miniCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.background = C_BG_SECONDARY;
        this.style.transform = 'translateX(4px)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.transform = 'translateX(0)';
      });
    });
    
    const placeCards = container.querySelectorAll('.vp-place-card');
    placeCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        this.style.transform = 'translateY(-2px)';
      });
      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
        this.style.transform = 'translateY(0)';
      });
    });
    
    const mapsLinks = container.querySelectorAll('.vp-maps-link');
    mapsLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
        this.style.background = C_PRIMARY;
        this.style.color = 'white';
      });
      link.addEventListener('mouseleave', function() {
        this.style.background = C_BG_SECONDARY;
        this.style.color = C_PRIMARY;
      });
    });
  }
  
  function updateMapWithLocation(userLocation, data) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return;
    
    const iframe = document.querySelector('#vom-platzl-hero-section .vp-iframe');
    if (!iframe) return;
    
    // Get first place destination if data is available
    const firstPlace = data && data.places && data.places.length > 0 ? data.places[0] : null;
    const destLat = firstPlace ? firstPlace.lat : null;
    const destLng = firstPlace ? firstPlace.lon : null;
    
    // Update iframe with directions from user location to first place
    const embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng, destLat, destLng);
    iframe.src = embedMapUrl;
    console.log("🦁 Vom Platzl: Map updated with user location and first place destination");
  }

  function injectStickyHeader() {
    // Prevent duplicate headers
    if (document.getElementById(HEADER_ID)) return;

    // Find the Google search container or create header at top of page
    const searchContainer = document.querySelector('#searchform')
      || document.querySelector('form[action="/search"]')
      || document.querySelector('body');

    if (!searchContainer) {
      console.log("🦁 Vom Platzl Header: No injection target found.");
      return;
    }

    // Create the header (now Non-Sticky)
    const header = document.createElement('div');
    header.id = HEADER_ID;

    header.style.cssText = `
        position: relative; /* CHANGED: relative allows it to scroll with the page */
        width: 100%;
        background: ${C_BG};
        color: #333333; /* CHANGED: Dark text for contrast on light background */
        padding: 16px 32px;
        /* z-index removed as it is less critical for relative, but kept just in case */
        z-index: 10000; 
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        font-family: arial, sans-serif;
        font-size: 14px;
        box-sizing: border-box; /* Added to ensure padding doesn't overflow width */
      `;

    // Create text container
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
        flex: 1;
        display: flex;
        align-items: center;
        width: 100%;
      `;

    // Create text element
    const textElement = document.createElement('span');
    textElement.style.cssText = `
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 0.3px;
        padding: 0 20px;
        width: 100%;
        display: block;
      `;
    textElement.textContent = 'Auf Lager bei einem Local Hero!';

    textContainer.appendChild(textElement);

    // Create button with lion emoji
    const button = document.createElement('button');

    // CHANGED: Button colors adjusted for Light Background (Darker borders/bg)
    button.style.cssText = `
        background: rgba(0, 0, 0, 0.05); /* Dark transparent bg */
        border: 1px solid rgba(0, 0, 0, 0.1); /* Dark transparent border */
        color: #333333; /* Dark emoji/text */
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 18px;
        cursor: pointer;
        transition: background 0.2s;
        margin-right: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        height: 36px;
      `;
    button.textContent = '🦁';
    button.setAttribute('aria-label', 'Vom Platzl');

    // Button hover effect (adjusted for light theme)
    button.addEventListener('mouseenter', () => {
      button.style.background = 'rgba(0, 0, 0, 0.1)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.background = 'rgba(0, 0, 0, 0.05)';
    });

    // Assemble header - button first (left), then text (right)
    header.appendChild(button);
    header.appendChild(textContainer);

    document.body.insertBefore(header, document.body.firstChild);

    console.log("🦁 Vom Platzl: Header injected");
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

  async function getUserLocation() {
    // Hardcoded location for testing
    return {
      lat: 48.149940170589154,
      lng: 11.568801449924484,
      city: 'Munich',
      country: 'Germany'
    };
    
    /* IP-based geolocation (disabled)
    try {
      // Use ipapi.co for IP-based geolocation (free, no API key needed)
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        console.log("🦁 IP geolocation request failed");
        return null;
      }
      
      const data = await response.json();
      if (data.latitude && data.longitude) {
        console.log("🦁 IP geolocation success:", data.city, data.country_name);
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          country: data.country_name
        };
      }
      
      console.log("🦁 IP geolocation: no coordinates in response");
      return null;
    } catch (error) {
      console.log("🦁 IP geolocation error:", error.message);
      return null;
    }
    */
  }

  async function run() {
    // Check shopping intent placeholder — the hero is shown only when this is true.
    const shoppingIntent = isLikelyShoppingPage(document.body);
    if (shoppingIntent) {
      console.log('vom-platzl: shoppingIntent=true — injecting hero section');

      injectStickyHeader();

      const query = getGoogleSearchQuery();
      
      // Inject hero section immediately (with loading state, no location yet)
      injectHeroSection(null, null);
      
      // Load user location first, then fetch data with location
      let userLocation = null;
      
      getUserLocation().then(location => {
        console.log('vom-platzl: user location received:', location);
        userLocation = location;
        
        // Load data with user location coordinates
        const lat = location ? location.lat : null;
        const lng = location ? location.lng : null;
        
        return getData(query, lat, lng);
      }).then(data => {
        console.log('vom-platzl: backend data received:', data);
        // Update map with user location and data (for first place destination)
        updateMapWithLocation(userLocation, data);
        injectHeroSection(userLocation, data);
      }).catch(error => {
        console.error('vom-platzl: error loading data or location:', error);
        const container = document.getElementById('vp-places-container');
        if (container) {
          container.innerHTML = `<div style="color: ${C_TEXT_SECONDARY};">Fehler beim Laden der Geschäfte</div>`;
        }
      });
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


