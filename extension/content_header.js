(function () {
    'use strict';
  
    const HEADER_ID = 'vom-platzl-sticky-header';
    // CHANGED: Light Blue color
    const BLUE_COLOR = '#3b82f6'; 
  
    console.log('🦁 Vom Platzl: Header Loaded.');
  
    function injectStickyHeader() {
      // Prevent duplicate headers
      if (document.getElementById(HEADER_ID)) return;
  
      // Find the Google search container or create header at top of page
      const searchContainer = document.querySelector('#searchform') 
                            || document.querySelector('form[action="/search"]')
                            || document.querySelector('body');
  
      if (!searchContainer) {
        console.log("Vom Platzl Header: No injection target found.");
        return;
      }
  
      // Create the header (now Non-Sticky)
      const header = document.createElement('div');
      header.id = HEADER_ID;
      
      header.style.cssText = `
        position: relative; /* CHANGED: relative allows it to scroll with the page */
        width: 100%;
        background: ${BLUE_COLOR};
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
  
      // Insert header at the top of the body
      // Since it is 'relative', it will naturally push the content down.
      document.body.insertBefore(header, document.body.firstChild);
  
      // REMOVED: The body padding logic. 
      // Because position is 'relative', we do NOT want to add padding to the body,
      // otherwise you will have a gap twice the size of the header.
  
      console.log("🦁 Vom Platzl: Header injected");
    }
  
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectStickyHeader);
    } else {
      injectStickyHeader();
    }
  
    // Observer to re-inject if Google redraws the page
    const observer = new MutationObserver(() => {
      if (!document.getElementById(HEADER_ID)) {
        injectStickyHeader();
      }
    });
  
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: false });
    }
  
  })();