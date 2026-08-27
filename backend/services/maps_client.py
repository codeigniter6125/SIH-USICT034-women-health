"""
maps_client.py — looks up the nearest hospital via Google Maps Places API.
Credentials loaded from environment variables (see /docs/setup_environment_credentials.md).
"""

import os
import requests

PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


def get_nearest_hospital(location: dict, radius_meters: int = 5000) -> dict | None:
    """
    Finds the nearest hospital to a given location using Google Places API.

    Args:
        location: dict with "lat" and "lng" keys, e.g. {"lat": 28.66, "lng": 77.45}
        radius_meters: search radius, defaults to 5km

    Returns:
        dict with name, address, lat, lng, and a Google Maps link — or None if no
        location was provided or no hospital was found. Callers must treat this as
        optional (see PRD §7.4 — location fallback behavior): the escalation SMS
        must never be delayed or blocked waiting on this.
    """
    if not location or "lat" not in location or "lng" not in location:
        return None

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY not set. Check backend/.env.")

    params = {
        "location": f"{location['lat']},{location['lng']}",
        "radius": radius_meters,
        "type": "hospital",
        "key": api_key,
    }

    try:
        response = requests.get(PLACES_NEARBY_URL, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        print("DEBUG GOOGLE RESPONSE:", data)  # Add this line
        results = data.get("results", [])
    except requests.RequestException:
        # Network/API failure — never let this block the escalation SMS.
        return None

    if not results:
        return None

    top = results[0]
    lat = top["geometry"]["location"]["lat"]
    lng = top["geometry"]["location"]["lng"]

    return {
        "name": top.get("name", "Nearby Hospital"),
        "address": top.get("vicinity", ""),
        "lat": lat,
        "lng": lng,
        "maps_link": f"https://www.google.com/maps/search/?api=1&query={lat},{lng}",
    }
