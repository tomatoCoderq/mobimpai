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


def _fmt_classes(classes) -> str:
    if not classes:
        return "-"
    return " ".join(f"{c['name']}:{int(c['frac'] * 100)}%" for c in classes)


@router.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@router.post("/passability")
async def passability(payload: PassabilityRequest) -> Dict[str, float]:
    score, stats = score_tile(payload.coord[0], payload.coord[1], payload.zoom)
    logger.info(
        "/passability coord=%s zoom=%d score=%.3f %s",
        payload.coord, payload.zoom, score, stats,
    )
    return {"passability": score}


@router.post("/route", response_model=RouteResponse)
async def route(payload: RouteRequest) -> RouteResponse:
    t_total = time.perf_counter()
    logger.info(
        "/route start start=%s end=%s zoom=%d sample_dist=%dm max_samples=%d",
        payload.start, payload.end, payload.zoom,
        payload.sample_distance, payload.max_samples,
    )

    t_osrm = time.perf_counter()
    coordinates, distance_m, duration_s = osrm_route(payload.start, payload.end)
    osrm_ms = round((time.perf_counter() - t_osrm) * 1000, 1)
    logger.info(
        "/route osrm polyline=%d distance=%.0fm duration=%.0fs took=%.1fms",
        len(coordinates), distance_m, duration_s, osrm_ms,
    )

    samples = sample_line(coordinates, payload.sample_distance, payload.max_samples)
    logger.info(
        "/route sampled %d points (spacing=%dm, cap=%d, polyline=%d)",
        len(samples), payload.sample_distance, payload.max_samples, len(coordinates),
    )

    scored_samples = []
    response_nodes = []
    sum_mly_ms = 0.0
    sum_onnx_ms = 0.0
    mly_hits = mly_misses = mly_no_imagery = fallback_used = 0

    route_id = f"route{int(t_total * 1000) % 10_000_000}"

    for idx, (lng, lat) in enumerate(samples, 1):
        debug_tag = f"{route_id}_s{idx}" if idx == 1 else None

        score, stats = score_mapillary(lng, lat, payload.zoom, debug_tag=debug_tag)
        source = "mapillary"

        if score is None:
            # Fallback to OSM-tile scoring so the route still has a signal
            # (weaker, but better than a hole).
            mly_no_imagery += 1
            score, tile_stats = score_tile(lng, lat, payload.zoom, debug_tag=None)
            fallback_used += 1
            source = "osm-fallback"
            logger.info(
                "/route %2d/%d MLY_MISS no imagery, fallback score=%.3f (%sms onnx) classes=%s",
                idx, len(samples), score, tile_stats.get("onnx_ms", "?"),
                _fmt_classes(tile_stats.get("classes")),
            )
        else:
            if stats["cache"] == "score":
                mly_hits += 1
                logger.info(
                    "/route %2d/%d MLY_SCORE_HIT total=%sms score=%.3f",
                    idx, len(samples), stats["total_ms"], score,
                )
            else:
                mly_misses += 1
                sum_mly_ms += stats.get("image_ms", 0.0)
                sum_onnx_ms += stats.get("onnx_ms", 0.0)
                logger.info(
                    "/route %2d/%d MLY_FRESH image=%sms onnx=%sms score=%.3f classes=%s",
                    idx, len(samples), stats["image_ms"], stats["onnx_ms"], score,
                    _fmt_classes(stats.get("classes")),
                )

        scored_samples.append(score)
        response_nodes.append(
            {"lng": lng, "lat": lat, "passability": score, "source": source}
        )

    if not scored_samples:
        avg_passability = 1.0
    else:
        avg_passability = round(sum(scored_samples) / len(scored_samples), 3)

    geojson = {
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coordinates},
        "properties": {"gridSize": payload.grid_size, "zoom": payload.zoom},
    }

    response_stats = {
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
        "/route done avg=%.3f samples=%d | "
        "mapillary: hit=%d fresh=%d no_imagery=%d fallback=%d | "
        "osrm=%.1fms mly_fetch=%.1fms onnx=%.1fms total=%.1fms",
        avg_passability, len(samples),
        mly_hits, mly_misses, mly_no_imagery, fallback_used,
        osrm_ms, sum_mly_ms, sum_onnx_ms, total_ms,
    )

    return RouteResponse(geojson=geojson, nodes=response_nodes, stats=response_stats)
