(function () {
    'use strict';
  
    const HEADER_ID = 'vom-platzl-sticky-header';
    const ORANGE_COLOR = '#ff9b54'; 
  
    console.log('🦁 Vom Platzl: Header Loaded.');
  
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
        background: ${ORANGE_COLOR};
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
  
      // --- RIGHT SIDE IMAGES ---
  
      // 1. Third Image (Left-most of the right group) -> ALWAYS VISIBLE
      const thirdImageElement = document.createElement('img');
      thirdImageElement.src = chrome.runtime.getURL('new_img_2.png'); 
      thirdImageElement.alt = 'Third Decorative Image';
      thirdImageElement.style.cssText = `
        height: 60px;
        width: auto;
        margin-left: 20px; 
        object-fit: contain;
        display: block; /* Takes up space */
        visibility: visible; /* Always visible */
        margin-top: 19px;
        margin-right: -25px;
      `;
  
      // 2. Additional Image (Middle) -> Unlocks at 1 EXPANSION
      const additionalImageElement = document.createElement('img');
      additionalImageElement.src = chrome.runtime.getURL('new_img.png');
      additionalImageElement.alt = 'Decorative Image';
      additionalImageElement.style.cssText = `
        height: 30px; 
        width: auto;
        margin-left: 30px;
        object-fit: contain;
        display: block; /* Takes up space */
        visibility: hidden; /* Hidden but reserves space */
        margin-top: 42px;
        margin-right: 200px;
      `;
  
      // 3. Munich Skyline (Far Right) -> Unlocks at 2 EXPANSIONS
      const imageElement = document.createElement('img');
      imageElement.src = chrome.runtime.getURL('Silhouette_of_Munich.svg-removebg-preview.png');
      imageElement.alt = 'Munich Skyline';
      imageElement.style.cssText = `
        height: 50px;
        width: auto;
        margin-left: 16px;
        margin-top: 10px;
        object-fit: contain;
        filter: brightness(0) invert(1); 
        display: block; /* Takes up space */
        visibility: hidden; /* Hidden but reserves space */
      `;
  
      // --- VISIBILITY LOGIC ---
      function updateVisibility(count) {
          // Image 1 is always visible, no logic needed.
          
          // Image 2: Visible after 1 click
          if (count >= 1) {
              additionalImageElement.style.visibility = 'visible';
          } else {
              additionalImageElement.style.visibility = 'hidden';
          }

          // Image 3: Visible after 2 clicks
          if (count >= 2) {
              imageElement.style.visibility = 'visible';
          } else {
              imageElement.style.visibility = 'hidden';
          }
      }
  
      // Load initial state
      chrome.storage.local.get(['vp_hero_expand_count'], function(result) {
          updateVisibility(result.vp_hero_expand_count || 0);
      });
  
      // Listen for changes
      chrome.storage.onChanged.addListener(function(changes, namespace) {
          if (namespace === 'local' && changes.vp_hero_expand_count) {
              updateVisibility(changes.vp_hero_expand_count.newValue);
          }
      });
  
      // Assemble header
      header.appendChild(textContainer);        
      header.appendChild(thirdImageElement);     
      header.appendChild(additionalImageElement); 
      header.appendChild(imageElement);          
  
      document.body.insertBefore(header, document.body.firstChild);
      console.log("🦁 Vom Platzl: Header injected");
    }
  
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectStickyHeader);
    } else {
      injectStickyHeader();
    }
  
    const observer = new MutationObserver(() => {
      if (!document.getElementById(HEADER_ID)) {
        injectStickyHeader();
      }
    });
  
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: false });
    }
  
})();