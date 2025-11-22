



BACKEND_URL = 'http://localhost:8000'

async function getData(query, ip, address) {
    const url = new URL(`${BACKEND_URL}/get_places`);
    url.searchParams.append('query', query);
    if (ip) url.searchParams.append('ip', ip);
    if (address) url.searchParams.append('adresse', address);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

getData("usb sticks und hdmi kabel", "8.8.8.8", "").then(data => {
    console.log(data);
});