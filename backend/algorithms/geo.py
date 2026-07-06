import math
from typing import List, Tuple

from config import TILE_SIZE


def haversine_m(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lat1, lon1 = math.radians(a[1]), math.radians(a[0])
    lat2, lon2 = math.radians(b[1]), math.radians(b[0])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    sin_dlat = math.sin(dlat / 2)
    sin_dlon = math.sin(dlon / 2)
    h = sin_dlat * sin_dlat + math.cos(lat1) * math.cos(lat2) * sin_dlon * sin_dlon
    return 2 * 6371000 * math.asin(min(1.0, math.sqrt(h)))


def latlng_to_pixel(lat: float, lng: float, zoom: int) -> Tuple[float, float]:
    siny = math.sin(math.radians(lat))
    siny = min(max(siny, -0.9999), 0.9999)
    scale = TILE_SIZE * (2**zoom)
    x = (lng + 180.0) / 360.0 * scale
    y = (0.5 - math.log((1 + siny) / (1 - siny)) / (4 * math.pi)) * scale
    return x, y


def sample_line(
    coords: List[List[float]],
    spacing_m: int,
    max_samples: int,
) -> List[Tuple[float, float]]:
    if not coords:
        return []
    samples = [tuple(coords[0])]
    accumulated = 0.0
    last = coords[0]
    for point in coords[1:]:
        segment = haversine_m(tuple(last), tuple(point))
        if segment <= 0:
            last = point
            continue
        accumulated += segment
        if accumulated >= spacing_m:
            samples.append(tuple(point))
            accumulated = 0.0
            if len(samples) >= max_samples:
                break
        last = point
    if len(samples) < max_samples and tuple(coords[-1]) not in samples:
        samples.append(tuple(coords[-1]))
    return samples[:max_samples]
