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
BLACKLIST = {'Lidl', 'Aldi', 'McDonald\'s', 'Starbucks', 'Subway', 'KFC', 'Burger King', 'IKEA', 'H&M', 'Zara', 'MediaMarkt', 'Saturn', 'DM', 'Rossmann', 'Edeka', 'Rewe', 'Netto', "Decathlon"}
BLACKLIST = {s.lower() for s in BLACKLIST}

class StoreType(str, Enum):
    CAR_DEALER = "car_dealer"
    GAS_STATION = "gas_station"

    ART_GALLERY = "art_gallery"

    LIBRARY = "library"

    WINE_BAR = "wine_bar"

    DRUGSTORE = "drugstore"
    PHARMACY = "pharmacy"

    FLORIST = "florist"
    STORAGE = "storage"
    TAILOR = "tailor"
    TOUR_AGENCY = "tour_agency"
    TOURIST_INFORMATION_CENTER = "tourist_information_center"
    TRAVEL_AGENCY = "travel_agency"

    BICYCLE_STORE = "bicycle_store"
    BOOK_STORE = "book_store"
    CLOTHING_STORE = "clothing_store"
    CONVENIENCE_STORE = "convenience_store"
    DEPARTMENT_STORE = "department_store"
    ELECTRONICS_STORE = "electronics_store"
    FURNITURE_STORE = "furniture_store"
    GREENGROCER = "grocery_or_supermarket"
    HARDWARE_STORE = "hardware_store"
    HOME_GOODS_STORE = "home_goods_store"
    JEWELRY_STORE = "jewelry_store"
    LIQUOR_STORE = "liquor_store"
    PET_STORE = "pet_store"
    SHOE_STORE = "shoe_store"
    SHOPPING_MALL = "shopping_mall"
    SPORTING_GOODS_STORE = "sporting_goods_store"
    GENERAL_STORE = "store"
    SUPERMARKET = "supermarket"

app = FastAPI()

# Add CORS middleware (adjust allow_origins in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.environ.get("GOOGLE_API_KEY")
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

def get_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula.
    Returns formatted distance string (e.g., "150 m" or "2.3 km")
    """
    from math import radians, sin, cos, atan2, sqrt, ceil
    
    # Mean Earth Radius in Kilometers
    R = 6371
    
    # Convert degrees to radians
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    
    # Difference in latitude and longitude
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    
    # Apply Haversine formula
    a = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lon / 2) ** 2
    
    # Calculate central angle
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    # Calculate final distance in kilometers
    distance_km = R * c
    
    # Convert to meters for formatting
    distance_meters = distance_km * 1000
    
    # Format distance string
    if distance_meters < 1000:
        # Show meters rounded up
        return f"{ceil(distance_meters)} m"
    else:
        # Show kilometers rounded up to 1 decimal place
        km_rounded_up = ceil(distance_km * 10) / 10
        return f"{km_rounded_up:.1f} km"

def get_place_details(place_id, api_key):
    # Note: Using the legacy endpoint for Place Details as v1 details are more complex
    # and the fields used here are simple.
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "opening_hours,reviews,rating,user_ratings_total,url",
        "key": api_key,
        "language": "de",
    }
    try:
        response = requests.get(url, params=params)
        if response.status_code == 200:
            return response.json().get("result", {})
    except Exception as e:
        print(f"Error fetching place details: {e}")
    return {}

def get_nearby_places(lat_str, lon_str, place_type: StoreType, radius=1500):
    place_type_val = place_type.value
    
    # Convert lat/lon strings to floats for the request body
    try:
        lat = float(lat_str)
        lon = float(lon_str)
    except ValueError:
        print("Invalid latitude or longitude format.")
        return []

    # Check cache
    cache_key = f"google_places:{lat_str}:{lon_str}:{place_type_val}:{radius}"
    cached_places = redis_client.get(cache_key)
    # if cached_places:
    #     print('============== CACHE HIT ==============')
    #     return json.loads(cached_places)

    print('============== CACHE MISS ==============')

    api_key = os.environ.get("GOOGLE_API_KEY")
    
    # === NEW GOOGLE PLACES API V1 ENDPOINT ===
    url = f"https://places.googleapis.com/v1/places:searchNearby?key={api_key}"
    
    # Request Body (POST payload)
    request_body = {
        "includedTypes": [place_type_val],
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": lat,
                    "longitude": lon
                },
                "radius": radius  # In meters
            }
        },
        "maxResultCount": 20
    }
    
    # Mandatory Field Mask Header
    headers = {
        "Content-Type": "application/json",
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.id,places.rating,places.userRatingCount" 
    }
   
    try:
        # Use POST for the new Nearby Search API
        response = requests.post(url, headers=headers, json=request_body)
        response.raise_for_status()
        data = response.json()
        
        places = []
        # Results are now under the 'places' key
        results = data.get('places', [])
        
        for result in results:
            name = result.get('displayName', {}).get('text', 'Unknown')
            place_id = result.get('id') # Place ID is now 'id' in v1
            
            # Filter out places which are too famous
            words = name.lower().split()
            prohibited = [word in BLACKLIST for word in words  ]
            if any(prohibited):
                continue

            # Fetch details
            details = {}
            if place_id:
                details = get_place_details(place_id, api_key)

            reviews_count = details.get("user_ratings_total", 0)
            if reviews_count < 5 or reviews_count > 2000:
                continue

            location = result.get('location', {})
            lat_val = location.get('latitude')
            lon_val = location.get('longitude')
            
            # Image logic removed as requested, leaving image_url as None
            image_url = None 
        

            if lat_val and lon_val:
                # Calculate distance from search location to this place
                distance_str = get_distance(float(lat), float(lon), lat_val, lon_val)
                
                place = {
                    "name": name,
                    "type": place_type_val,
                    "lat": lat_val,
                    "lon": lon_val,
                    "tags": {"name": name, "vicinity": result.get("formattedAddress", "N/A")},
                    "image_url": image_url,
                    "rating": result.get("rating"), 
                    "user_ratings_total": result.get("userRatingCount"), 
                    "opening_hours": details.get("opening_hours", {}),
                    "reviews": details.get("reviews", []),
                    "google_maps_url": details.get("url", f"https://maps.google.com/?q={lat_val},{lon_val}&query_place_id={place_id}")
                }
                places.append(place)
        
        # Cache the result
        redis_client.setex(cache_key, 3600 * 48, json.dumps(places)) # Cache for 48 hours
        return places
    except requests.exceptions.HTTPError as errh:
        print(f"HTTP Error querying Google Places API: {errh}")
        return []
    except Exception as e:
        print(f"Error querying Google Places API: {e}")
        return []

@app.get("/get_places")
def get_places(request: Request, query: str, lat: str = '48.14595042226794', lon: str = '11.574998090542195'):
    # TODO: Implement address lookup if 'adresse' is provided
    # client_ip = ip or request.client.host
    # current_location = get_ip_location(client_ip)

    # Hardcoded location (Munich) - preserving original behavior
    # In the future, use current_location['lat'] and current_location['lon']
    lat = '48.148687132768494'
    lon = '11.568617102780685'

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