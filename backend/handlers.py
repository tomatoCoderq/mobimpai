import logging
import time
from typing import Dict

from fastapi import APIRouter

from algorithms.geo import sample_line
from algorithms.osrm import osrm_route
from mapillary import score_mapillary
from model import score_tile
from schemas import PassabilityRequest, RouteRequest, RouteResponse


logger = logging.getLogger("uvicorn.error")

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
    t_total = time.perf_counter()
    logger.info(
        "/route start start=%s end=%s zoom=%d",
        payload.start, payload.end, payload.zoom,
    )

    coordinates, distance_m, duration_s = osrm_route(payload.start, payload.end)
    samples = sample_line(coordinates, payload.sample_distance, payload.max_samples)

    scored_samples = []
    response_nodes = []
    mly_no_imagery = 0
    fallback_used = 0

    for lng, lat in samples:
        score, stats = score_mapillary(lng, lat, payload.zoom)
        source = "mapillary"

        if score is None:
            mly_no_imagery += 1
            score = score_tile(lng, lat, payload.zoom)
            fallback_used += 1
            source = "osm-fallback"
            logger.info(
                "/route MLY_MISS no imagery at lng=%s lat=%s, fallback score=%.3f",
                lng, lat, score,
            )
        else:
            logger.info(
                "/route MLY score=%.3f cache=%s total=%sms",
                score, stats["cache"], stats["total_ms"],
            )

        scored_samples.append(score)
        response_nodes.append(
            {"lng": lng, "lat": lat, "passability": score, "source": source}
        )

    avg_passability = round(sum(scored_samples) / len(scored_samples), 3) if scored_samples else 1.0

    geojson = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coordinates},
        "properties": {"gridSize": payload.grid_size, "zoom": payload.zoom},
    }

    stats_out = {
        "avg_passability": avg_passability,
        "distance_m": round(distance_m, 1),
        "duration_s": round(duration_s, 1),
        "samples": len(samples),
        "scored_samples": len(scored_samples),
        "mapillary_no_imagery": mly_no_imagery,
        "fallback_used": fallback_used,
    }

    total_ms = round((time.perf_counter() - t_total) * 1000, 1)
    logger.info(
        "/route done avg=%.3f samples=%d fallback=%d total=%.1fms",
        avg_passability, len(samples), fallback_used, total_ms,
    )

    return RouteResponse(geojson=geojson, nodes=response_nodes, stats=stats_out)
