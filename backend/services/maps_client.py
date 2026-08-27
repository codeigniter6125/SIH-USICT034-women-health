"""
maps_client.py — looks up the nearest hospital via Google Maps Places API.
Credentials loaded from environment variables.
"""

import os

from dotenv import load_dotenv
import requests

load_dotenv()

PLACES_NEARBY_URL = (
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
 )


def get_nearest_hospital(
    location: dict | None,
    radius_meters: int = 5000,
) -> dict | None:
    """Find the nearest hospital using Google Places Nearby Search."""

    if not location or "lat" not in location or "lng" not in location:
        return None

    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        print("MAPS CONFIG ERROR: GOOGLE_MAPS_API_KEY is not set")
        return None

    params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": radius_meters,
        "type": "hospital",
        "key": api_key,
    }

    try:
        response = requests.get(
            PLACES_NEARBY_URL,
            params=params,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as exc:
        print(f"MAPS HTTP ERROR: {exc}")
        return None

    status = data.get("status")
    if status != "OK":
        print(
            "MAPS API ERROR:",
            status,
            data.get("error_message", "No error message returned"),
        )
        return None

    results = data.get("results", [])
    if not results:
        print("MAPS RESULT: No hospitals found in the requested radius")
        return None

    top = results[0]
    geometry = top.get("geometry", {})
    coordinates = geometry.get("location", {})
    lat = coordinates.get("lat")
    lng = coordinates.get("lng")

    if lat is None or lng is None:
        print("MAPS RESULT ERROR: Hospital result has no coordinates")
        return None

    return {
        "name": top.get("name", "Nearby Hospital"),
        "address": top.get("vicinity", top.get("formatted_address", "")),
        "lat": lat,
        "lng": lng,
        "maps_link": f"https://maps.google.com/?q={lat},{lng}",
    }
