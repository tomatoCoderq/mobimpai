import time
from typing import Dict

from fastapi import APIRouter

from algorithms.geo import sample_line
from algorithms.osrm import osrm_route
from model import score_tile
from schemas import PassabilityRequest, RouteRequest, RouteResponse


router = APIRouter()


@router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/passability")
async def passability(payload: PassabilityRequest) -> Dict[str, float]:
    score = score_tile(payload.coord[0], payload.coord[1], payload.zoom)
    return {"passability": score}


@router.post("/route", response_model=RouteResponse)
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
