from typing import List, Tuple

import requests
from fastapi import HTTPException

from config import OSRM_BASE_URL


def osrm_route(
    start: Tuple[float, float], end: Tuple[float, float]
) -> Tuple[List[List[float]], float, float]:
    url = (
        f"{OSRM_BASE_URL}/route/v1/foot/"
        f"{start[0]},{start[1]};{end[0]},{end[1]}"
        "?overview=full&geometries=geojson"
    )
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    payload = response.json()
    routes = payload.get("routes", [])
    if not routes:
        raise HTTPException(status_code=404, detail="No OSRM route found")
    route = routes[0]
    return route["geometry"]["coordinates"], route["distance"], route["duration"]
