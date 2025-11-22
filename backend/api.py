from typing import List, Optional
import os
import json
from enum import Enum
from pprint import pprint

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
import requests
import redis
from dotenv import load_dotenv

load_dotenv()

# Redis cache setup
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
BLACKLIST = {'Lidl', 'Aldi', 'McDonald\'s', 'Starbucks', 'Subway', 'KFC', 'Burger King', 'IKEA', 'H&M', 'Zara', 'MediaMarkt', 'Saturn', 'DM', 'Rossmann', 'Edeka', 'Rewe', 'Netto'}
BLACKLIST = {s.lower() for s in BLACKLIST}

class StoreType(str, Enum):
    SUPERMARKET = "supermarket"
    CONVENIENCE = "convenience_store"
    BAKERY = "bakery"
    BUTCHER = "store"
    CLOTHES = "clothing_store"
    ELECTRONICS = "electronics_store"
    BOOKS = "book_store"
    ALCOHOL = "liquor_store"
    BEVERAGES = "liquor_store"
    CHEMIST = "pharmacy"
    DRUGSTORE = "drugstore"
    DEPARTMENT_STORE = "department_store"
    KIOSK = "convenience_store"
    GREENGROCER = "grocery_or_supermarket"
    HARDWARE = "hardware_store"
    FURNITURE = "furniture_store"
    SHOES = "shoe_store"
    SPORTS = "sporting_goods_store"
    GIFT = "home_goods_store"
    FLORIST = "florist"

app = FastAPI()

# Add CORS middleware (adjust allow_origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)

class Classification(BaseModel):
    query: str = Field(description="The original query item")
    store: StoreType = Field(description="The best matching store type")

def classify_query(query: str) -> StoreType:
    query_lower = query.lower()
    prompt = f"""
        You are an expert retail classifier.
        Assign the most appropriate StoreType to the following list of user queries.
        Be precise.

        Queries: {query_lower}
    """
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": Classification
        }
    )
    result = Classification(**json.loads(response.text))
    return result.store


def get_ip_location(ip_address):
    # Using ip-api.com (Free for non-commercial use, limited rate)
    response = requests.get(f'http://ip-api.com/json/{ip_address}')
    
    if response.status_code == 200:
        data = response.json()
        if data['status'] == 'success':
            return {
                "ip": data['query'],
                "city": data['city'],
                "country": data['country'],
                "lat": data['lat'],
                "lon": data['lon'],
                "zip": data['zip']

            }
        else:
            return f"Error: {data['message']}"
    else:
        return "HTTP Request failed"

def get_place_details(place_id, api_key):
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "opening_hours,reviews,rating,user_ratings_total,url",
        "key": api_key
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json().get("result", {})
    except Exception as e:
        print(f"Error fetching place details: {e}")
    return {}

def get_nearby_places(lat, lon, place_type: StoreType, radius=1000):
    place_type_val = place_type.value

    # Check cache
    cache_key = f"google_places:{lat}:{lon}:{place_type_val}:{radius}"
    cached_places = redis_client.get(cache_key)
    if cached_places:
        print('============== CACHE HIT ==============')
        return json.loads(cached_places)

    print('============== CACHE MISS ==============')

    api_key = os.environ.get("GOOGLE_API_KEY")
    google_type = place_type_val
    
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lon}",
        "radius": radius,
        "type": google_type,
        "key": api_key
    }

   
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        places = []
        results = data.get('results', [])
        
        for i, result in enumerate(results):
            name = result.get('name', 'Unknown')
            # Filter out places which are too famous
            # define once near BLACKLIST

            # inside loop
            words = name.lower().split()
            prohibited = [word in BLACKLIST for word in words  ]
            if any(prohibited):
                continue

            location = result.get('geometry', {}).get('location', {})
            lat_val = location.get('lat')
            lon_val = location.get('lng')
            place_id = result.get('place_id')
            
            image_url = None
            if "photos" in result:
                photo_reference = result["photos"][0]["photo_reference"]
                image_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={api_key}"

            # Fetch details for top 3 results to save costs
            # Note: Place Details requests cost extra (especially for reviews/opening_hours)
            details = {}
            if place_id:
                details = get_place_details(place_id, api_key)

            if lat_val and lon_val:
                place = {
                    "name": name,
                    "type": place_type_val,
                    "lat": lat_val,
                    "lon": lon_val,
                    "tags": {"name": name, "vicinity": result.get("vicinity")},
                    "image_url": image_url,
                    "rating": result.get("rating"),
                    "user_ratings_total": result.get("user_ratings_total"),
                    "opening_hours": details.get("opening_hours", {}),
                    "reviews": details.get("reviews", []),
                    "google_maps_url": details.get("url", f"https://www.google.com/maps/search/?api=1&query={name}&query_place_id={place_id}")
                }
                places.append(place)
        
        # Cache the result
        redis_client.setex(cache_key, 3600 * 48, json.dumps(places)) # Cache for 48 hours
        return places
    except Exception as e:
        print(f"Error querying Google Places API: {e}")
        return []

@app.get("/get_places")
def get_places(request: Request, query: str, adresse: Optional[str] = None, ip: Optional[str] = None):
    # TODO: Implement address lookup if 'adresse' is provided
    # client_ip = ip or request.client.host
    # current_location = get_ip_location(client_ip)

    # Hardcoded location (Munich) - preserving original behavior
    # In the future, use current_location['lat'] and current_location['lon']
    lat = '48.14595042226794'
    lon = '11.574998090542195'

    store_type = classify_query(query)
    nearby_places = get_nearby_places(lat, lon, store_type, radius=1500)
    return JSONResponse(content={"places": nearby_places})



# if __name__ == "__main__":
    
#     query = 'hdmi kabel'
#     target_store_type = classify_query(query)
#     current_ip = requests.get('https://ifconfig.me').text
#     current_location = get_ip_location(current_ip)
#     lat = '48.14595042226794'
#     lon = '11.574998090542195'
#     nearby_places = get_nearby_places(lat, lon, target_store_type)

#     pprint(nearby_places)