"""
maps_client.py — looks up the nearest hospital via Google Maps Places API.
Credentials loaded from environment variables (see /docs/setup_environment_credentials.md).
"""

import os
import requests

PLACES_NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


def get_nearest_hospital(location: dict, radius_meters: int = 20000) -> dict | None:
    """
    Finds the nearest hospital to a given location using Google Places API.
    """
    if not location or "lat" not in location or "lng" not in location:
        print("[maps_client] No location provided — skipping hospital lookup.")
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
        body = response.json()
        results = body.get("results", [])
        status = body.get("status")
        print(f"[maps_client] Places API status={status}, results={len(results)}, "
              f"location={location}, radius={radius_meters}m")
        if status != "OK" and status != "ZERO_RESULTS":
            print(f"[maps_client] Places API returned non-OK status: {body}")
    except requests.RequestException as e:
        print(f"[maps_client] Request failed: {e}")
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