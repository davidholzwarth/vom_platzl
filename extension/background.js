chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchData') {
    const { query, lat, lon } = request;
    const BACKEND_URL = 'http://localhost:8000';
    const url = new URL(`${BACKEND_URL}/get_places`);
    url.searchParams.append('query', query);
    
    // Add lat/lon if provided
    if (lat !== undefined && lat !== null) {
      url.searchParams.append('lat', lat.toString());
    }
    if (lon !== undefined && lon !== null) {
      url.searchParams.append('lon', lon.toString());
    }

    fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error(`Response status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));

    return true; // Will respond asynchronously
  }
});
