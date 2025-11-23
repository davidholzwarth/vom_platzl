from typing import List, Optional, Dict
import os
import json
from enum import Enum
from math import radians, sin, cos, atan2, sqrt, ceil

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

# Aggressive Blacklist
BLACKLIST = {
    'Lidl', 'Aldi', 'McDonald\'s', 'Starbucks', 'Subway', 'KFC', 'Burger King', 
    'IKEA', 'H&M', 'Zara', 'MediaMarkt', 'Saturn', 'DM', 'Rossmann', 'Edeka', 
    'Rewe', 'Netto', "Decathlon", "Kaufland", "Penny", "Norma", "Obi", "Bauhaus", "Toom"
}
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
    try:
        query_lower = query.lower()
        prompt = f"You are an expert retail classifier. Assign the most appropriate StoreType to: {query_lower}"
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json", "response_schema": Classification}
        )
        result = Classification(**json.loads(response.text))
        return result.store
    except Exception as e:
        print(f"Gemini Error: {e}")
        return StoreType.GENERAL_STORE

def get_distance_metrics(lat1, lon1, lat2, lon2):
    """Returns tuple: (formatted_string, raw_meters_float)"""
    R = 6371
    lat1_rad = radians(lat1)
    lat2_rad = radians(lat2)
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(d_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    distance_km = R * c
    distance_meters = distance_km * 1000
    
    formatted_str = f"{ceil(distance_meters)} m" if distance_meters < 1000 else f"{ceil(distance_km * 10) / 10:.1f} km"
    return formatted_str, distance_meters

def get_place_details(place_id, api_key):
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
    except Exception:
        pass
    return {}

def map_price_level(level_str):
    if level_str == "PRICE_LEVEL_INEXPENSIVE": return "€"
    if level_str == "PRICE_LEVEL_MODERATE": return "€€"
    if level_str == "PRICE_LEVEL_EXPENSIVE": return "€€€"
    if level_str == "PRICE_LEVEL_VERY_EXPENSIVE": return "€€€€"
    return ""

# --- HELPER 1: STRICT CATEGORY SEARCH ---
def search_google_nearby(lat, lon, category, radius, api_key):
    url = f"https://places.googleapis.com/v1/places:searchNearby?key={api_key}"
    body = {
        "includedTypes": [category],
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lon},
                "radius": radius
            }
        },
        "rankPreference": "DISTANCE",
        "maxResultCount": 20
    }
    headers = {"Content-Type": "application/json", "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel"}
    try:
        res = requests.post(url, headers=headers, json=body)
        if res.status_code == 200: return res.json().get('places', [])
    except Exception: pass
    return []

# --- HELPER 2: FUZZY TEXT SEARCH (Finds "Ghost Stores") ---
def search_google_text(lat, lon, query_text, radius, api_key):
    url = "https://places.googleapis.com/v1/places:searchText"
    search_term = query_text.replace("_", " ")
    
    body = {
        "textQuery": search_term,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lon},
                "radius": radius
            }
        },
        "maxResultCount": 20
    }
    headers = {"Content-Type": "application/json", "X-Goog-Api-Key": api_key, "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.types,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel"}
    try:
        res = requests.post(url, headers=headers, json=body)
        if res.status_code == 200: return res.json().get('places', [])
    except Exception: pass
    return []

# --- MAIN LOGIC CONTROLLER ---
# --- MAIN LOGIC CONTROLLER ---
def get_nearby_places(lat_str, lon_str, place_type: StoreType, radius=1500):
    place_type_val = place_type.value
    try:
        lat = float(lat_str)
        lon = float(lon_str)
    except ValueError:
        return []

    # Cache Key
    cache_key = f"google_places_hybrid_v3:{lat_str}:{lon_str}:{place_type_val}:{radius}"
    
    cached_places = redis_client.get(cache_key)
    if cached_places:
        print('============== CACHE HIT ==============')
        return json.loads(cached_places)

    print('============== CACHE MISS (HYBRID SEARCH) ==============')
    api_key = os.environ.get("GOOGLE_API_KEY")
    
    # 1. Run both searches
    raw_nearby = search_google_nearby(lat, lon, place_type_val, radius, api_key)
    raw_text = search_google_text(lat, lon, place_type_val, radius, api_key)

    # --- 🔍 DEBUGGING: PRINT RAW LISTS WITH DISTANCE ---
    print(f"\n--- 🟢 METHOD A: STRICT SEARCH (nearby) Found {len(raw_nearby)} ---")
    for p in raw_nearby:
        name = p.get('displayName', {}).get('text', 'Unknown')
        pid = p.get('id')
        # Calculate distance just for printing
        loc = p.get('location', {})
        d_str = "N/A"
        if loc.get('latitude') and loc.get('longitude'):
            d_str, _ = get_distance_metrics(lat, lon, loc['latitude'], loc['longitude'])
        print(f"   [A] {d_str} - {name} ({pid})")

    print(f"\n--- 🔵 METHOD B: FUZZY SEARCH (text) Found {len(raw_text)} ---")
    for p in raw_text:
        name = p.get('displayName', {}).get('text', 'Unknown')
        pid = p.get('id')
        # Calculate distance just for printing
        loc = p.get('location', {})
        d_str = "N/A"
        if loc.get('latitude') and loc.get('longitude'):
            d_str, _ = get_distance_metrics(lat, lon, loc['latitude'], loc['longitude'])
        print(f"   [B] {d_str} - {name} ({pid})")
    print("-" * 60 + "\n")
    # -------------------------------------
    
    # 2. Merge and Deduplicate
    merged_results = {}
    for p in raw_nearby:
        if p.get('id'): merged_results[p['id']] = p
            
    for p in raw_text:
        if p.get('id'): merged_results[p['id']] = p
            
    final_places_list = []
    
    # 3. Process Unique List
    for place_id, result in merged_results.items():
        name = result.get('displayName', {}).get('text', 'Unknown')
        
        # FILTER: Blacklist
        words = name.lower().split()
        if any(word in BLACKLIST for word in words): continue

        # FETCH DETAILS
        details = get_place_details(place_id, api_key)

        # FILTER: Quality
        reviews_count = details.get("user_ratings_total", 0)
        if reviews_count < 5 or reviews_count > 2500: continue

        # EXTRACT: Top Review
        top_review = None
        raw_reviews = details.get("reviews", [])
        for r in raw_reviews:
            if r.get("rating", 0) >= 4 and len(r.get("text", "")) > 20:
                text = r.get("text", "")
                top_review = (text[:400] + '...') if len(text) > 400 else text
                break

        # EXTRACT: Price & Type
        price_symbol = map_price_level(result.get('priceLevel', ''))
        
        raw_types = result.get('types', [])
        display_type = "Store"
        for t in raw_types:
            if t not in ['point_of_interest', 'establishment', place_type_val]:
                display_type = t.replace('_', ' ').title()
                break

        # CALCULATE: Distance
        location = result.get('location', {})
        lat_val = location.get('latitude')
        lon_val = location.get('longitude')

        if lat_val and lon_val:
            dist_str, dist_raw = get_distance_metrics(lat, lon, lat_val, lon_val)
            
            # Strict Radius Check (1.5x margin)
            if dist_raw > (radius * 1.5): continue

            place = {
                "name": name,
                "type": place_type_val,
                "display_type": display_type,
                "lat": lat_val,
                "lon": lon_val,
                "tags": {"vicinity": result.get("formattedAddress", "")},
                "rating": result.get("rating"), 
                "user_ratings_total": result.get("userRatingCount"), 
                "price_level": price_symbol,
                "top_review": top_review,
                "opening_hours": details.get("opening_hours", {}),
                "distance": dist_str,
                "distance_raw": dist_raw,
                "google_maps_url": details.get("url", "")
            }
            final_places_list.append(place)
    
    # 4. Final Sort
    final_places_list.sort(key=lambda x: x['distance_raw'])
    
    redis_client.setex(cache_key, 3600 * 48, json.dumps(final_places_list))
    return final_places_list

@app.get("/get_places")
def get_places(request: Request, query: str, lat: str = '48.1486', lon: str = '11.5686'):
    store_type = classify_query(query)
    nearby_places = get_nearby_places(lat, lon, store_type)
    return JSONResponse(content={"places": nearby_places})