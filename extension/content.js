(function () {
  // --- CONFIGURATION ---
  const HERO_ID = 'vom-platzl-hero-section';
  const HEADER_ID = 'vom-platzl-sticky-header';

  // Store configuration
  const STORE_IMAGE_URL = ''; // Set your store image URL here
  const STORE_LATITUDE = 48.1351; // Munich coordinates (default)
  const STORE_LONGITUDE = 11.5820;

  // Modern Brand Colors - Warm & Sleek
  const C_PRIMARY = '#ff9b54';      // Warm orange
  const C_PRIMARY_LIGHT = '#ffb380';
  const C_PRIMARY_DARK = '#ff8433';
  const C_ACCENT = '#ff6b35';       // Vibrant coral
  const C_BG = '#f8edeb';           // Soft pink/beige
  const C_BG_SECONDARY = '#ffffff';
  const C_TEXT = '#2d2d2d';
  const C_TEXT_SECONDARY = '#757575';
  const C_BORDER = '#f4dcd6';

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
    return `https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_CONFIG.API_KEY}&origin=${userLat},${userLng}&destination=${destination}&mode=walking&zoom=15`;
  }

  function getStoreEmbedUrl() {
    // Interactive map showing store location when user location is not available
    return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_CONFIG.API_KEY}&q=${STORE_LATITUDE},${STORE_LONGITUDE}&zoom=15`;
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
      console.log("Vom Platzl: CRITICAL - No injection target found.");
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
      padding: 24px 32px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      z-index: 10;
      display: block;
      border: none;
      border-radius: 16px;
      overflow: hidden;
      overflow-x: hidden;
      background: ${C_BG};
      box-shadow: 0 2px 8px rgba(255, 155, 84, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;

    const mapsUrl = `https://www.google.com/maps?q=${STORE_LATITUDE},${STORE_LONGITUDE}`;

    // Generate interactive map embed URL with route
    let embedMapUrl;
    if (userLocation && userLocation.lat && userLocation.lng && data && data.places && data.places.length > 0) {
      // Sort places by distance to get the nearest one
      let sortedPlaces = [...data.places].sort((a, b) => {
        const distA = getDistanceValue(a.distance);
        const distB = getDistanceValue(b.distance);
        return distA - distB;
      });
      const firstPlace = sortedPlaces[0];
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
          background: white;
          border: 2px solid ${C_BORDER};
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          flex-shrink: 0;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(255, 155, 84, 0.1);
        ">
          ${STORE_IMAGE_URL ?
        `<img src="${STORE_IMAGE_URL}" alt="Store" style="width: 100%; height: 100%; object-fit: cover;" />` :
        `<img src="${chrome.runtime.getURL('logo.png')}" alt="Vom Platzl Logo" style="width: 100%; height: 100%; object-fit: cover; padding: 8px;" />`
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
            padding: 6px 14px;
            border-radius: 24px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
            box-shadow: 0 2px 6px rgba(255, 107, 53, 0.25);
          ">
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
              font-weight: 600;
              cursor: pointer;
              padding: 10px 18px;
              border-radius: 10px;
              transition: all 0.2s ease;
              background: rgba(255, 155, 84, 0.08);
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
            </h4>
            ${data_html}
          </div>
          
          <!-- Right: Interactive Route Map -->
          <div class="vp-map" style="
            width: 100%;
            height: 100%;
            min-height: 400px;
            border: 2px solid ${C_BORDER};
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(255, 155, 84, 0.08);
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
      <button id="vp-minimize-btn" class="vp-close-btn" style="display:none; position:absolute; top:20px; right:20px; background:${C_PRIMARY}; color:#fff; border:0; padding:10px 18px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; z-index:20; transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(255, 155, 84, 0.3);">✕ Schließen</button>
    `;

    // Wrap the hero in the full-width wrapper
    wrapper.appendChild(hero);

    // Add event listeners for buttons (CSP-compliant)
    const primaryBtn = hero.querySelector('.vp-primary-btn');
    if (primaryBtn) {
      primaryBtn.addEventListener('mouseenter', function () {
        this.style.background = C_PRIMARY_DARK;
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 12px rgba(255, 155, 84, 0.35)';
      });
      primaryBtn.addEventListener('mouseleave', function () {
        this.style.background = C_PRIMARY;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 6px rgba(255, 155, 84, 0.25)';
      });
    }

    const closeBtn = hero.querySelector('.vp-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('mouseenter', function () {
        this.style.background = C_PRIMARY_DARK;
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 4px 12px rgba(255, 155, 84, 0.4)';
      });
      closeBtn.addEventListener('mouseleave', function () {
        this.style.background = C_PRIMARY;
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 2px 8px rgba(255, 155, 84, 0.3)';
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
          box-shadow: 0 4px 12px rgba(255, 155, 84, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
        }
        #${HERO_ID}.vp-expanded { 
          width: 100% !important;
          background: ${C_BG};
          padding: 36px 48px !important;
          cursor: default;
          transform: translateY(0) !important;
          box-shadow: 0 4px 16px rgba(255, 155, 84, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
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
    console.log("Vom Platzl: Search result block injected into", mainContent);
    
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
  
  // Helper function to extract numeric distance value for sorting
  function getDistanceValue(distanceString) {
    if (!distanceString) return Infinity;
    const match = distanceString.match(/([\d.]+)\s*(km|m)/);
    if (!match) return Infinity;
    const value = parseFloat(match[1]);
    const unit = match[2];
    return unit === 'km' ? value : value / 1000; // Convert to km for consistent comparison
  }
  
  // Update header with walking time estimate
  function updateHeaderWithWalkingTime(data) {
    const walkingTimeElement = document.getElementById('vp-walking-time');
    if (!walkingTimeElement) return;
    
    const places = data.places || [];
    if (places.length > 0 && places[0].duration) {
      walkingTimeElement.textContent = `${places[0].duration} Fußweg zum nächsten Geschäft`;
    } else if (places.length > 0 && places[0].distance) {
      walkingTimeElement.textContent = `${places[0].distance} zum nächsten Geschäft`;
    } else {
      walkingTimeElement.textContent = '';
    }
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
    
    let places = data.places || [];
    
    // Debug logging to see what data we have
    console.log('Vom Platzl: Places data received:', places);
    places.forEach((place, index) => {
      console.log(`Place ${index}:`, place.name, 'Distance:', place.distance);
    });
    
    // Sort places by distance (nearest first)
    places = places.sort((a, b) => {
      const distA = getDistanceValue(a.distance);
      const distB = getDistanceValue(b.distance);
      return distA - distB;
    });
    
    const maxStores = Math.min(5, places.length);
    
    // Update header with walking time
    updateHeaderWithWalkingTime(data);
    
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
          background: ${openNow ? '#4caf50' : '#f44336'};
          margin-right: 8px;
        "></span>` : '';
      
      minimized_html += `
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          font-size: 14px;
          color: ${C_TEXT};
          transition: all 0.2s ease;
          cursor: pointer;
          border: 1px solid ${C_BORDER};
        " class="vp-place-mini" data-lat="${place.lat}" data-lon="${place.lon}">
          <div style="display: flex; align-items: center;">
            ${openIndicator}
            <span style="font-weight: 500;">${place.name || 'Unbekanntes Geschäft'}</span>
          </div>
          <span style="font-size: 12px; color: ${C_TEXT_SECONDARY}; font-weight: 500;">${place.distance || 'N/A'}</span>
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
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          transition: all 0.2s ease;
          cursor: pointer;
        " class="vp-place-card" data-lat="${place.lat}" data-lon="${place.lon}">
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
                ">${place.tags.vicinity}</div>
              ` : ''}
              <div style="
                font-size: 13px;
                color: ${C_TEXT_SECONDARY};
                font-weight: 500;
              ">${place.distance || 'Entfernung unbekannt'}</div>
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
            padding: 10px 14px;
            background: ${openNow ? '#e8f5e9' : '#ffebee'};
            border-radius: 10px;
            margin-bottom: 12px;
          ">
            <span style="
              display: inline-block;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: ${openNow ? '#4caf50' : '#f44336'};
            "></span>
            <span style="
              font-size: 13px;
              font-weight: 600;
              color: ${openNow ? '#2e7d32' : '#c62828'};
            ">${openNow ? 'Jetzt geöffnet' : getTimeUntilOpening(place.opening_hours)}</span>
          </div>
          ` : ''}
          
          ${place.reviews && place.reviews.length > 0 ? (() => {
            // Find the most positive review (highest rating)
            const bestReview = place.reviews.reduce((best, current) => {
              const currentRating = current.rating || 0;
              const bestRating = best.rating || 0;
              return currentRating > bestRating ? current : best;
            });
            return `
          <div style="
            font-size: 13px;
            color: ${C_TEXT_SECONDARY};
            margin-bottom: 12px;
            padding: 12px 16px;
            background: ${C_BG_SECONDARY};
            border-radius: 10px;
            border-left: 4px solid ${C_PRIMARY};
          ">
            <div style="font-weight: 600; margin-bottom: 8px; color: ${C_TEXT};">
              ${'★'.repeat(bestReview.rating || 0)}${'☆'.repeat(5 - (bestReview.rating || 0))} 
              <span style="margin-left: 8px; color: ${C_TEXT_SECONDARY};">${bestReview.author_name || 'Anonymer Nutzer'}</span>
            </div>
            <div style="
              font-style: italic;
              line-height: 1.4;
              color: ${C_TEXT};
            ">"${bestReview.text || 'Keine Bewertung verfügbar'}"</div>
          </div>`;
          })() : `
          <div style="
            font-size: 13px;
            color: ${C_TEXT_SECONDARY};
            font-style: italic;
            margin-bottom: 12px;
            padding: 8px 12px;
            background: ${C_BG_SECONDARY};
            border-radius: 8px;
          ">Keine Bewertungen verfügbar</div>
          `}
          
          <a href="${place.google_maps_url || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`}" 
             target="_blank"
             rel="noopener noreferrer"
             style="
               display: inline-flex;
               align-items: center;
               gap: 6px;
               color: white;
               text-decoration: none;
               font-size: 14px;
               font-weight: 600;
               padding: 10px 18px;
               background: ${C_PRIMARY};
               border-radius: 10px;
               transition: all 0.2s ease;
               box-shadow: 0 2px 6px rgba(255, 155, 84, 0.25);
             "
             class="vp-maps-link">
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
        this.style.background = 'rgba(255, 155, 84, 0.04)';
        this.style.transform = 'translateX(4px)';
        this.style.borderColor = C_PRIMARY_LIGHT;
      });
      card.addEventListener('mouseleave', function() {
        this.style.background = 'white';
        this.style.transform = 'translateX(0)';
        this.style.borderColor = C_BORDER;
      });
      
      // Add click handler to update map directions
      card.addEventListener('click', function(e) {
        e.stopPropagation();
        const lat = this.getAttribute('data-lat');
        const lon = this.getAttribute('data-lon');
        updateMapDirections(lat, lon);
      });
    });
    
    const placeCards = container.querySelectorAll('.vp-place-card');
    placeCards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 12px rgba(255, 155, 84, 0.15), 0 2px 6px rgba(0, 0, 0, 0.05)';
        this.style.transform = 'translateY(-3px)';
        this.style.borderColor = C_PRIMARY_LIGHT;
      });
      card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
        this.style.transform = 'translateY(0)';
        this.style.borderColor = C_BORDER;
      });
      
      // Add click handler to update map directions (but not on links)
      card.addEventListener('click', function(e) {
        // Don't trigger if clicking on the maps link
        if (e.target.closest('.vp-maps-link')) return;
        e.stopPropagation();
        const lat = this.getAttribute('data-lat');
        const lon = this.getAttribute('data-lon');
        updateMapDirections(lat, lon);
      });
    });
    
    const mapsLinks = container.querySelectorAll('.vp-maps-link');
    mapsLinks.forEach(link => {
      link.addEventListener('mouseenter', function() {
        this.style.background = C_PRIMARY_DARK;
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 4px 10px rgba(255, 155, 84, 0.35)';
      });
      link.addEventListener('mouseleave', function() {
        this.style.background = C_PRIMARY;
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 6px rgba(255, 155, 84, 0.25)';
      });
    });
  }
  
  function updateMapWithLocation(userLocation, data) {
    if (!userLocation || !userLocation.lat || !userLocation.lng) return;
    
    const iframe = document.querySelector('#vom-platzl-hero-section .vp-iframe');
    if (!iframe) return;
    
    // Sort places by distance first to match the displayed list
    let places = data.places || [];
    places = places.sort((a, b) => {
      const distA = getDistanceValue(a.distance);
      const distB = getDistanceValue(b.distance);
      return distA - distB;
    });
    
    // Get first place destination after sorting
    const firstPlace = places.length > 0 ? places[0] : null;
    const destLat = firstPlace ? firstPlace.lat : null;
    const destLng = firstPlace ? firstPlace.lon : null;
    
    // Update iframe with directions from user location to first place
    const embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng, destLat, destLng);
    iframe.src = embedMapUrl;
    console.log("Vom Platzl: Map updated with user location and first place destination (sorted by distance)");
  }
  
  // Function to update map directions to a specific store
  function updateMapDirections(destLat, destLng) {
    const iframe = document.querySelector('#vom-platzl-hero-section .vp-iframe');
    if (!iframe) return;
    
    // Get user location from the data stored during initial load
    getUserLocation().then(userLocation => {
      if (userLocation && userLocation.lat && userLocation.lng) {
        const embedMapUrl = getDirectionsEmbedUrl(userLocation.lat, userLocation.lng, destLat, destLng);
        iframe.src = embedMapUrl;
        console.log("Vom Platzl: Map directions updated to:", destLat, destLng);
      }
    });
  }

  function injectStickyHeader() {
    if (document.getElementById(HEADER_ID)) return;

    const searchContainer = document.querySelector('#searchform') 
                          || document.querySelector('form[action="/search"]')
                          || document.querySelector('body');

    if (!searchContainer) return;

    const header = document.createElement('div');
    header.id = HEADER_ID;
    
    header.style.cssText = `
      position: relative; 
      width: 100%;
      background: #ff9b54;
      color: #ffffff;
      padding: 0 32px;
      height: 60px;
      z-index: 10000; 
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(255, 155, 84, 0.2);
      font-family: arial, sans-serif;
      font-size: 14px;
      box-sizing: border-box; 
    `;

    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
      flex: 1; 
      display: flex;
      align-items: center;
      width: 100%;
    `;
    
    const textElement = document.createElement('span');
    textElement.style.cssText = `
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 0.3px;
      padding: 0 20px;
      width: 100%;
      display: block;
      color: #ffffff;
      position: relative; 
      left: -15px; 
      top: 5px;   
    `;
    textElement.textContent = 'Kauf bei Local Heroes!';
    
    textContainer.appendChild(textElement);

    // Lion logo (positioned on the left)
    const logoElement = document.createElement('img');
    logoElement.src = chrome.runtime.getURL('logo.png'); 
    logoElement.alt = 'Lion Logo';
    logoElement.style.cssText = `
      height: 32px;
      width: auto;
      object-fit: contain;
      margin-right: 16px;
    `;

    // Munich Skyline (positioned on the right)
    const skylineElement = document.createElement('img');
    skylineElement.src = chrome.runtime.getURL('Silhouette_of_Munich.svg-removebg-preview.png');
    skylineElement.alt = 'Munich Skyline';
    skylineElement.style.cssText = `
      height: 50px;
      width: auto;
      margin-left: 16px;
      margin-top: 10px;
      object-fit: contain;
      filter: brightness(0) invert(1);
    `;

    // Assemble header - logo first (left), then text (center), then skyline (right)
    header.appendChild(logoElement);        
    header.appendChild(textContainer);
    header.appendChild(skylineElement);          

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
    
    /* 
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        console.log("IP geolocation request failed");
        return null;
      }
      
      const data = await response.json();
      if (data.latitude && data.longitude) {
        console.log("IP geolocation success:", data.city, data.country_name);
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city,
          country: data.country_name
        };
      }
      
      console.log("IP geolocation: no coordinates in response");
      return null;
    } catch (error) {
      console.log("IP geolocation error:", error.message);
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
        updateHeaderWithWalkingTime(data);
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
    const urlClue = url.includes('/shopping') || url.includes('tbm=shop');
    console.log('shopping_intent: URL clue =', urlClue);
    if (urlClue) return true;

    // 2. Look for shopping-specific UI elements (localized text or known containers)
    const sponsoredLabel = findElementContainingText("gesponserte produkte", root) || findElementContainingText("sponsored products", root);
    console.log('shopping_intent: sponsored label found =', !!sponsoredLabel);
    if (sponsoredLabel) return true;

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


