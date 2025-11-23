import os
import requests
from dotenv import load_dotenv
from pprint import pprint

# Load your API key
load_dotenv()
API_KEY = os.environ.get("GOOGLE_API_KEY")

def inspect_store(store_name, location_bias="Munich"):
    print(f"\n🔎 INSPECTING: '{store_name}' in {location_bias}...")
    
    url = "https://places.googleapis.com/v1/places:searchText"
    
    headers = {
        "Content-Type": "application/json",
        # We specifically request the 'types' and 'displayName'
        "X-Goog-FieldMask": "places.displayName,places.types,places.primaryType,places.id,places.formattedAddress"
    }
    
    body = {
        "textQuery": f"{store_name} in {location_bias}",
        "maxResultCount": 1
    }
    
    response = requests.post(url, headers=headers, json=body, params={"key": API_KEY})
    
    if response.status_code == 200:
        data = response.json()
        places = data.get("places", [])
        
        if not places:
            print("❌ Store not found on Google Maps.")
            return

        store = places[0]
        print(f"✅ Found: {store.get('displayName', {}).get('text')}")
        print(f"📍 Address: {store.get('formattedAddress')}")
        print(f"🆔 Place ID: {store.get('id')}")
        print("-" * 40)
        print("🏷️  ALL GOOGLE TAGS (types):")
        pprint(store.get("types", []))
        print("-" * 40)
        print(f"🏆 PRIMARY TYPE: {store.get('primaryType')}")
        print("-" * 40)
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    # REPLACE THIS with the store you are missing
    store_to_check = "Alfons Albrecht GmbH & Co. KG "
    inspect_store(store_to_check)