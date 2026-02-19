from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware

from .classifier import classify_query
from .services.google_places import search_google_text, get_nearby_places
from typing import List, Dict
from .modles.Place import Place

app = FastAPI()


# TODO: Acutall cors handeling with reverse proxy (railway, vercel)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/get_places")
def get_places(
    request: Request,
    query: str,
    lat: str = "48.14595042226794",
    lon: str = "11.574998090542195",
):
    """
    Main endpoint to retrieve places based on a natural language query and location.

    It first attempts a direct text search using Google Places API. If no results
    are found, it falls back to classifying the query into a store category
    and searching nearby for that category.

    Args:
        query (str): User's search query.
        lat (str): Latitude of the user (defaults to Munich city center).
        lon (str): Longitude of the user (defaults to Munich city center).

    Returns:
        JSONResponse: A list of processed and filtered places.
    """
    try:
        lat_f = float(lat)
        lon_f = float(lon)
    except (ValueError, TypeError):
        lat_f = 48.14595042226794
        lon_f = 11.574998090542195

    print(f"Searching for: {query} at {lat_f}, {lon_f}")

    # Try Text Search first
    places: List[Place] = search_google_text(lat_f, lon_f, query, radius=1500)

    # Fallback to category search if text search returns nothing
    if not places:
        print("Text search yielded no results, trying category classification...")
        store_type = classify_query(query)
        places = get_nearby_places(lat, lon, store_type, radius=1500)

    return JSONResponse(content={"places": [p.model_dump() for p in places]})



@app.get("/health")
def health_check():
    """
    Health check endpoint.

    Returns:
        JSONResponse: 
    """
    return JSONResponse(content={"status": "API is healthy and running!"})