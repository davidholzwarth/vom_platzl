import os
import json
import requests
import warnings
from ..config import BLACKLIST, GOOGLE_API_KEY
from ..utils.geo import get_distance
from ..enums.StoreTypes import StoreType
from ..modles.Place import Review, Place
from typing import List, Dict


def process_places(places_raw, user_lat, user_lon) -> List[Place]:
    """
    Processes and filters raw place results from the Google Places API.

    Args:
        places_raw (list): Raw results from Google.
        user_lat (float): Latitude for distance calculation.
        user_lon (float): Longitude for distance calculation.

    Returns:
        list: Formatted and filtered place data.
    """
    results = []

    for place in places_raw:
        name = place.get("displayName", {}).get("text", "Unknown")

        words = name.lower().split()
        # Simplified blacklist check
        if any(word in BLACKLIST for word in words):
            continue

        rating = place.get("rating")
        user_rating_count = place.get("userRatingCount")

        # Filter by rating count
        if user_rating_count is not None and (
            user_rating_count < 5 or user_rating_count > 2000
        ):
            continue

        location = place.get("location", {})
        lat_val = location.get("latitude")
        lon_val = location.get("longitude")

        distance_str = "N/A"
        if lat_val and lon_val:
            try:
                distance_str = get_distance(
                    float(user_lat), float(user_lon), lat_val, lon_val
                )
            except (ValueError, TypeError):
                pass

        opening_hours = place.get("regularOpeningHours", {})

        raw_reviews = place.get("reviews", [])
        processed_reviews = []
        for review in raw_reviews:
            text_obj = review.get("text", {})
            review_text = (
                text_obj.get("text", "")
                if isinstance(text_obj, dict)
                else str(text_obj)
            )

            try:
                processed_review = Review(
                    author_name=review.get("authorAttribution", {}).get(
                        "displayName", "Anonymous"
                    ),
                    text=review_text,
                    rating=review.get("rating"),
                    relative_time_description=review.get(
                        "relativePublishTimeDescription"
                    ),
                    profile_photo_url=review.get("authorAttribution", {}).get(
                        "photoUri"
                    ),
                )
                processed_reviews.append(processed_review)
            except Exception as e:
                print(f"Error processing review: {e}")

        try:
            place_obj = Place(
                name=name,
                type=place.get("types", ["store"])[0]
                if place.get("types")
                else "store",
                lat=lat_val,
                lon=lon_val,
                tags={"name": name, "vicinity": place.get("formattedAddress", "N/A")},
                image_url=None,
                rating=rating,
                user_ratings_total=user_rating_count,
                opening_hours=opening_hours,
                reviews=processed_reviews,
                google_maps_url=place.get(
                    "googleMapsUri", f"https://maps.google.com/?q={lat_val},{lon_val}"
                ),
                website=place.get("websiteUri"),
                distance=distance_str,
            )
            results.append(place_obj)
        except Exception as e:
            print(f"Error processing place: {e}")

    return results


def search_google_text(lat, lon, query_text, radius=1500) -> List[Place]:
    """
    Performs a text-based search for places using Google's V1 API.

    Args:
        lat (float): Latitude for location bias.
        lon (float): Longitude for location bias.
        query_text (str): Search term.
        radius (int): Search radius in meters.

    Returns:
        list: Processed places.
    """
    url = "https://places.googleapis.com/v1/places:searchText"
    search_term = query_text.replace("_", " ")

    field_mask = "places.id,places.displayName,places.location,places.types,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.regularOpeningHours,places.reviews,places.websiteUri,places.googleMapsUri"

    body = {
        "textQuery": search_term,
        "locationBias": {
            "circle": {"center": {"latitude": lat, "longitude": lon}, "radius": radius}
        },
        "maxResultCount": 20,
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": field_mask,
    }

    try:
        res = requests.post(url, headers=headers, json=body)
        if res.status_code == 200:
            places_data: List[Dict] = res.json().get("places", [])
            return process_places(places_data, lat, lon)
        else:
            print(f"Error searching Google: {res.status_code} {res.text}")
    except Exception as e:
        print(f"Exception searching Google: {e}")
    return []


# ==================================
# Deprecated
# ==================================


def get_nearby_places(lat_str, lon_str, place_type: StoreType, radius=1500):
    """
    Searches for nearby places of a specific type.

    DEPRECATED: Use search_google_text instead for better results.
    """
    warnings.warn(
        ""
        "The get_nearby_places function is deprecated and will be removed in a future version. Use search_google_text instead for better results.",
        category=DeprecationWarning,
        stacklevel=2,
    )

    place_type_val = place_type.value
    try:
        lat = float(lat_str)
        lon = float(lon_str)
    except ValueError:
        return []

    url = f"https://places.googleapis.com/v1/places:searchNearby?key={GOOGLE_API_KEY}"
    field_mask = "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.regularOpeningHours,places.reviews,places.websiteUri,places.googleMapsUri"

    request_body = {
        "includedTypes": [place_type_val],
        "locationRestriction": {
            "circle": {"center": {"latitude": lat, "longitude": lon}, "radius": radius}
        },
        "maxResultCount": 20,
    }

    headers = {"Content-Type": "application/json", "X-Goog-FieldMask": field_mask}

    try:
        response = requests.post(url, headers=headers, json=request_body)
        response.raise_for_status()
        data = response.json()
        places_data = data.get("places", [])

        processed_places: List[Place] = process_places(places_data, lat, lon)

        return processed_places
    except Exception as e:
        print(f"Error querying Google Places API: {e}")
        return []
