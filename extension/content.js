
function run() {
  (async () => {
    const url = chrome.runtime.getURL("shopping_intent.js");

    const module = await import(url);

    const isShoppingPage = module.isLikelyShoppingPage(document.body);

    if (isShoppingPage) {
      console.log(`Status: Confirmed Shopping Page. Visual Check: ${isShoppingPage}`);
      insertTestBanner();
    } else {
      console.log("Status: Not a Shopping Page. Aborting logic.");
    }
  })();
}

// --- Execution Wrapper ---

(function () {
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

