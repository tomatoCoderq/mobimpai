from __future__ import annotations

import io
import math
import os
import time
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from PIL import Image
from ultralytics import YOLO
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / "backend" / ".env")
MODEL_PATH = Path(os.getenv("MODEL_PATH", str(ROOT_DIR / "best.pt"))).resolve()
TILE_SERVER_URL = os.getenv(
    "TILE_SERVER_URL", "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
)
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")
TILE_SIZE = 256
IMAGE_SIZE = 640
IMAGE_CACHE: Dict[Tuple[float, float, int], Image.Image] = {}
SCORE_CACHE: Dict[Tuple[float, float, int], float] = {}

CLASS_WEIGHTS = {0: 0.3, 1: 0.15, 2: 1.0, 3: 0.1}

app = FastAPI(title="MobImpAI API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = YOLO(str(MODEL_PATH))


class PassabilityRequest(BaseModel):
    coord: Tuple[float, float] = Field(..., description="[lng, lat]")
    zoom: int = 18


class RouteRequest(BaseModel):
    start: Tuple[float, float] = Field(..., description="[lng, lat]")
    end: Tuple[float, float] = Field(..., description="[lng, lat]")
    zoom: int = 18
    grid_size: int = Field(9, ge=5, le=21, description="Odd grid size (5..21)")
    sample_distance: int = Field(40, ge=10, le=200, description="Meters between samples")
    max_samples: int = Field(18, ge=3, le=60, description="Max samples")


class RouteResponse(BaseModel):
    geojson: Dict
    nodes: List[Dict]
    stats: Dict


@dataclass(frozen=True)
class Node:
    x: int
    y: int


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


def compute_passability(objects: Iterable[Dict]) -> float:
    objects = list(objects)
    if not objects:
        return 1.0
    for obj in objects:
        if obj["class_id"] == 2:
            return 0.0
    blocked = sum(
        CLASS_WEIGHTS.get(o["class_id"], 0.2)
        * o["confidence"]
        * (1 + o["mask_area"] * 5)
        for o in objects
    )
    if len(objects) > 1:
        for i in range(len(objects)):
            for j in range(i + 1, len(objects)):
                dx = objects[i]["cx"] - objects[j]["cx"]
                dy = objects[i]["cy"] - objects[j]["cy"]
                if math.hypot(dx, dy) < 0.3:
                    blocked *= 1.05
    return round(max(0.0, 1.0 - blocked), 3)


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


@lru_cache(maxsize=512)
def fetch_tile(x: int, y: int, z: int) -> Image.Image:
    url = TILE_SERVER_URL.format(z=z, x=x, y=y)
    response = requests.get(
        url,
        timeout=20,
        headers={"User-Agent": "MobImpAI/0.1"},
    )
    response.raise_for_status()
    return Image.open(io.BytesIO(response.content)).convert("RGB")


def fetch_osm_image(lng: float, lat: float, zoom: int) -> Image.Image:
    cache_key = (round(lng, 6), round(lat, 6), zoom)
    cached = IMAGE_CACHE.get(cache_key)
    if cached is not None:
        return cached.copy()

    center_x, center_y = latlng_to_pixel(lat, lng, zoom)
    half = IMAGE_SIZE / 2
    left = center_x - half
    top = center_y - half
    right = center_x + half
    bottom = center_y + half

    tile_min_x = int(math.floor(left / TILE_SIZE))
    tile_max_x = int(math.floor((right - 1) / TILE_SIZE))
    tile_min_y = int(math.floor(top / TILE_SIZE))
    tile_max_y = int(math.floor((bottom - 1) / TILE_SIZE))

    max_tile = 2**zoom
    canvas = Image.new("RGB", (IMAGE_SIZE, IMAGE_SIZE), (15, 15, 15))

    for tile_x in range(tile_min_x, tile_max_x + 1):
        wrapped_x = tile_x % max_tile
        for tile_y in range(tile_min_y, tile_max_y + 1):
            if tile_y < 0 or tile_y >= max_tile:
                continue
            try:
                tile = fetch_tile(wrapped_x, tile_y, zoom)
            except requests.RequestException:
                tile = Image.new("RGB", (TILE_SIZE, TILE_SIZE), (30, 30, 30))
            paste_x = int(tile_x * TILE_SIZE - left)
            paste_y = int(tile_y * TILE_SIZE - top)
            canvas.paste(tile, (paste_x, paste_y))

    if canvas.size != (IMAGE_SIZE, IMAGE_SIZE):
        canvas = canvas.resize((IMAGE_SIZE, IMAGE_SIZE), Image.BILINEAR)
    IMAGE_CACHE[cache_key] = canvas
    return canvas.copy()


def score_tile(lng: float, lat: float, zoom: int) -> float:
    cache_key = (round(lng, 6), round(lat, 6), zoom)
    cached = SCORE_CACHE.get(cache_key)
    if cached is not None:
        return cached
    image = fetch_osm_image(lng, lat, zoom)
    results = model(image)
    r = results[0]

    objects = []
    for i, box in enumerate(r.boxes):
        mask_area = 0.0
        if r.masks is not None and i < len(r.masks.data):
            mask_area = float(r.masks.data[i].sum()) / (640 * 640)
        objects.append(
            {
                "class_id": int(box.cls),
                "confidence": float(box.conf),
                "cx": float(box.xywh[0][0]) / 640,
                "cy": float(box.xywh[0][1]) / 640,
                "mask_area": mask_area,
            }
        )
    score = compute_passability(objects)
    SCORE_CACHE[cache_key] = score
    return score


def osrm_route(start: Tuple[float, float], end: Tuple[float, float]) -> Tuple[List[List[float]], float, float]:
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


def build_grid(start: Tuple[float, float], end: Tuple[float, float], size: int) -> Tuple[List[float], List[float]]:
    min_lng = min(start[0], end[0])
    max_lng = max(start[0], end[0])
    min_lat = min(start[1], end[1])
    max_lat = max(start[1], end[1])
    pad_lng = (max_lng - min_lng) * 0.15 or 0.001
    pad_lat = (max_lat - min_lat) * 0.15 or 0.001
    min_lng -= pad_lng
    max_lng += pad_lng
    min_lat -= pad_lat
    max_lat += pad_lat

    lngs = [min_lng + i * (max_lng - min_lng) / (size - 1) for i in range(size)]
    lats = [min_lat + i * (max_lat - min_lat) / (size - 1) for i in range(size)]
    return lngs, lats


def neighbors(node: Node, size: int) -> Iterable[Node]:
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx = node.x + dx
            ny = node.y + dy
            if 0 <= nx < size and 0 <= ny < size:
                yield Node(nx, ny)


def heuristic(a: Node, b: Node) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def nearest_index(value: float, values: List[float]) -> int:
    return min(range(len(values)), key=lambda i: abs(values[i] - value))


def astar(
    start: Node,
    goal: Node,
    size: int,
    passability: Dict[Node, float],
) -> List[Node]:
    open_set = {start}
    came_from: Dict[Node, Optional[Node]] = {start: None}
    g_score: Dict[Node, float] = {start: 0.0}
    f_score: Dict[Node, float] = {start: heuristic(start, goal)}

    while open_set:
        current = min(open_set, key=lambda n: f_score.get(n, float("inf")))
        if current == goal:
            path = []
            while current is not None:
                path.append(current)
                current = came_from[current]
            return list(reversed(path))

        open_set.remove(current)
        for neighbor in neighbors(current, size):
            score = passability.get(neighbor, 0.0)
            if score <= 0.05:
                continue
            step_cost = 1.0 / max(score, 0.05)
            tentative_g = g_score[current] + step_cost
            if tentative_g < g_score.get(neighbor, float("inf")):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                open_set.add(neighbor)

    return []


@app.post("/passability")
async def passability(payload: PassabilityRequest) -> Dict[str, float]:
    score = score_tile(payload.coord[0], payload.coord[1], payload.zoom)
    return {"passability": score}


@app.post("/route", response_model=RouteResponse)
async def route(payload: RouteRequest) -> RouteResponse:
    start_time = time.perf_counter()
    print(
        f"/route start start={payload.start} end={payload.end} "
        f"zoom={payload.zoom} grid={payload.grid_size}",
        flush=True,
    )
    coordinates, distance_m, duration_s = osrm_route(payload.start, payload.end)
    samples = sample_line(coordinates, payload.sample_distance, payload.max_samples)
    scored_samples = []
    response_nodes = []
    for lng, lat in samples:
        score = score_tile(lng, lat, payload.zoom)
        scored_samples.append(score)
        response_nodes.append({"lng": lng, "lat": lat, "passability": score})

    if not scored_samples:
        avg_passability = 1.0
    else:
        avg_passability = round(sum(scored_samples) / len(scored_samples), 3)
    geojson = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coordinates},
        "properties": {"gridSize": payload.grid_size, "zoom": payload.zoom},
    }

    stats = {
        "avg_passability": avg_passability,
        "distance_m": round(distance_m, 1),
        "duration_s": round(duration_s, 1),
        "samples": len(samples),
        "scored_samples": len(scored_samples),
    }

    total_time = time.perf_counter() - start_time
    print(
        f"/route done samples={stats['samples']} avg={stats['avg_passability']} "
        f"total={total_time:.2f}s",
        flush=True,
    )

    return RouteResponse(geojson=geojson, nodes=response_nodes, stats=stats)
