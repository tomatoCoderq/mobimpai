import io
import logging
import time
from typing import Any, Dict, Optional, Tuple

import numpy as np
import requests
from PIL import Image

from config import (
    MAPILLARY_BASE_URL,
    MAPILLARY_RADIUS_M,
    MAPILLARY_TOKEN,
)
from model import (
    _to_input_tensor,
    compute_passability,
    session,
)


logger = logging.getLogger("uvicorn.error")

MAPILLARY_IMAGE_CACHE: Dict[Tuple[float, float], Image.Image] = {}
MAPILLARY_SCORE_CACHE: Dict[Tuple[float, float], float] = {}


def fetch_mapillary_image(lng: float, lat: float, radius: int = MAPILLARY_RADIUS_M) -> Optional[Image.Image]:
    if not MAPILLARY_TOKEN:
        logger.error("MAPILLARY_TOKEN is not set")
        return None

    cache_key = (round(lng, 5), round(lat, 5))
    cached = MAPILLARY_IMAGE_CACHE.get(cache_key)
    if cached is not None:
        return cached.copy()

    safe_radius = min(max(1, radius), 50)
    images_url = (
        f"{MAPILLARY_BASE_URL}/images"
        f"?access_token={MAPILLARY_TOKEN}"
        "&fields=id,thumb_1024_url"
        f"&lat={lat}"
        f"&lng={lng}"
        f"&radius={safe_radius}"
        "&limit=5"
    )
    try:
        response = requests.get(images_url, timeout=20)
        response.raise_for_status()
        payload = response.json()
        data = payload.get("data", [])
    except requests.RequestException as exc:
        status = getattr(exc.response, "status_code", "n/a")
        body = getattr(exc.response, "text", "")
        logger.warning("mapillary lookup failed: %s %s", status, body)
        return None

    if not data:
        logger.info("mapillary no images near lng=%s lat=%s", lng, lat)
        return None

    thumb_url = None
    image_id = None
    for item in data:
        if item.get("thumb_1024_url"):
            thumb_url = item.get("thumb_1024_url")
            image_id = item.get("id")
            break
        if image_id is None:
            image_id = item.get("id")

    if not thumb_url and image_id:
        detail_url = (
            f"{MAPILLARY_BASE_URL}/{image_id}"
            f"?access_token={MAPILLARY_TOKEN}"
            "&fields=thumb_1024_url"
        )
        try:
            detail = requests.get(detail_url, timeout=20)
            detail.raise_for_status()
            thumb_url = detail.json().get("thumb_1024_url")
        except requests.RequestException as exc:
            status = getattr(exc.response, "status_code", "n/a")
            body = getattr(exc.response, "text", "")
            logger.warning("mapillary detail failed: %s %s", status, body)
            return None

    if not thumb_url:
        logger.warning("mapillary image URL missing for id=%s", image_id)
        return None

    try:
        image_response = requests.get(thumb_url, timeout=20)
        image_response.raise_for_status()
        image = Image.open(io.BytesIO(image_response.content)).convert("RGB")
    except requests.RequestException as exc:
        logger.warning("mapillary image fetch failed: %s", exc)
        return None

    MAPILLARY_IMAGE_CACHE[cache_key] = image
    return image.copy()


def score_mapillary(
    lng: float, lat: float, zoom: int,
) -> Tuple[Optional[float], Dict[str, Any]]:
    """Fetch a Mapillary photo near (lng, lat) and run the segmentation model on it.

    Returns (score, stats) or (None, stats) when there is no imagery near the coordinate.
    zoom is accepted for a compatible signature with score_tile.
    """
    t0 = time.perf_counter()
    cache_key = (round(lng, 5), round(lat, 5))

    if cache_key in MAPILLARY_SCORE_CACHE:
        return MAPILLARY_SCORE_CACHE[cache_key], {
            "cache": "score",
            "source": "mapillary",
            "total_ms": round((time.perf_counter() - t0) * 1000, 1),
        }

    image_cached = cache_key in MAPILLARY_IMAGE_CACHE

    t_img = time.perf_counter()
    image = fetch_mapillary_image(lng, lat)
    image_ms = round((time.perf_counter() - t_img) * 1000, 1)

    if image is None:
        return None, {
            "cache": "miss",
            "source": "mapillary",
            "no_imagery": True,
            "image_ms": image_ms,
            "total_ms": round((time.perf_counter() - t0) * 1000, 1),
        }

    t_prep = time.perf_counter()
    inp = _to_input_tensor(image)
    prep_ms = round((time.perf_counter() - t_prep) * 1000, 1)

    t_run = time.perf_counter()
    logits = session.run(["logits"], {"pixel_values": inp})[0]
    onnx_ms = round((time.perf_counter() - t_run) * 1000, 1)

    pred = logits.argmax(axis=1).squeeze()
    score = compute_passability(pred)

    MAPILLARY_SCORE_CACHE[cache_key] = score

    total_ms = round((time.perf_counter() - t0) * 1000, 1)

    return score, {
        "cache": "image" if image_cached else "miss",
        "source": "mapillary",
        "image_ms": image_ms,
        "prep_ms": prep_ms,
        "onnx_ms": onnx_ms,
        "total_ms": total_ms,
    }
