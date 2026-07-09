import io
import logging
import math
import os
import time
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import onnxruntime as ort
import requests
from PIL import Image

from algorithms.geo import latlng_to_pixel
from config import (
    CLASS_NAMES,
    CLASS_WEIGHTS,
    IMAGE_SIZE,
    MODEL_PATH,
    TILE_SERVER_URL,
    TILE_SIZE,
)

logger = logging.getLogger("uvicorn.error")

IMAGE_CACHE: Dict[Tuple[float, float, int], Image.Image] = {}
SCORE_CACHE: Dict[Tuple[float, float, int], float] = {}

DEBUG_SAVE = os.environ.get("DEBUG_SAVE_IMAGES", "0") == "1"
DEBUG_DIR = Path(os.environ.get("DEBUG_DIR", "/app/debug"))

# Same color table the reference inference script uses.
_CLASS_COLORS = np.array(
    [
        [0, 0, 0],
        [128, 64, 128],
        [70, 130, 180],
        [0, 200, 0],
        [200, 100, 0],
        [0, 220, 220],
        [255, 50, 50],
        [255, 200, 0],
    ],
    dtype=np.uint8,
)


def _mask_to_rgb(pred: np.ndarray) -> np.ndarray:
    idx = np.clip(pred, 0, len(_CLASS_COLORS) - 1).astype(np.uint8)
    return _CLASS_COLORS[idx]


def _save_snapshot(image: Image.Image, pred: np.ndarray,
                   lng: float, lat: float, zoom: int, tag: str) -> None:
    try:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        ts = int(time.time() * 1000)
        stem = f"{ts}_{tag}_z{zoom}_{lat:.5f}_{lng:.5f}"

        image.save(DEBUG_DIR / f"{stem}_image.png")

        mask_img = Image.fromarray(_mask_to_rgb(pred))
        if mask_img.size != image.size:
            mask_img = mask_img.resize(image.size, Image.NEAREST)
        mask_img.save(DEBUG_DIR / f"{stem}_mask.png")

        combined = Image.new("RGB", (image.size[0] * 2, image.size[1]))
        combined.paste(image, (0, 0))
        combined.paste(mask_img, (image.size[0], 0))
        combined.save(DEBUG_DIR / f"{stem}_combined.png")

        logger.info("debug snapshot saved: %s_{image,mask,combined}.png", stem)
    except Exception as exc:
        logger.warning("debug snapshot failed for tag=%s: %s", tag, exc)


session = ort.InferenceSession(str(MODEL_PATH))
logger.info(
    "model loaded: path=%s inputs=%s outputs=%s",
    MODEL_PATH,
    [(i.name, i.shape) for i in session.get_inputs()],
    [(o.name, o.shape) for o in session.get_outputs()],
)


def _to_input_tensor(image: Image.Image) -> np.ndarray:
    if image.size != (IMAGE_SIZE, IMAGE_SIZE):
        image = image.resize((IMAGE_SIZE, IMAGE_SIZE), Image.BILINEAR)
    arr = np.asarray(image, dtype=np.float32) / 255.0
    return arr.transpose(2, 0, 1)[None, :]


def compute_passability(pred: np.ndarray) -> float:
    if pred.size == 0:
        return 1.0
    total = float(pred.size)
    blocked = 0.0
    for cls_id, weight in CLASS_WEIGHTS.items():
        fraction = float((pred == cls_id).sum()) / total
        blocked += weight * fraction
    return round(max(0.0, 1.0 - min(1.0, blocked)), 3)


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


def score_tile(
    lng: float, lat: float, zoom: int, debug_tag: Optional[str] = None,
) -> Tuple[float, Dict[str, Any]]:
    """Return (passability, stats) so callers can log the pipeline breakdown.

    If DEBUG_SAVE=1 and debug_tag is given, drops the assembled image and
    predicted mask into DEBUG_DIR for later inspection.
    """
    t0 = time.perf_counter()
    cache_key = (round(lng, 6), round(lat, 6), zoom)

    if cache_key in SCORE_CACHE:
        return SCORE_CACHE[cache_key], {
            "cache": "score",
            "total_ms": round((time.perf_counter() - t0) * 1000, 1),
        }

    image_cached = cache_key in IMAGE_CACHE
    tiles_before = fetch_tile.cache_info()

    t_img = time.perf_counter()
    image = fetch_osm_image(lng, lat, zoom)
    image_ms = round((time.perf_counter() - t_img) * 1000, 1)

    tiles_after = fetch_tile.cache_info()
    tile_hits = tiles_after.hits - tiles_before.hits
    tile_misses = tiles_after.misses - tiles_before.misses

    t_prep = time.perf_counter()
    inp = _to_input_tensor(image)
    prep_ms = round((time.perf_counter() - t_prep) * 1000, 1)

    t_run = time.perf_counter()
    logits = session.run(["logits"], {"pixel_values": inp})[0]
    onnx_ms = round((time.perf_counter() - t_run) * 1000, 1)

    t_post = time.perf_counter()
    pred = logits.argmax(axis=1).squeeze()
    score = compute_passability(pred)
    
    unique_ids, counts = np.unique(pred, return_counts=True)
    total_pixels = float(pred.size)
    classes_found = [
        {
            "id": int(cid),
            "name": CLASS_NAMES.get(int(cid), "?"),
            "frac": round(float(cnt) / total_pixels, 3),
        }
        for cid, cnt in sorted(zip(unique_ids, counts), key=lambda x: -x[1])
    ]
    
    post_ms = round((time.perf_counter() - t_post) * 1000, 1)

    SCORE_CACHE[cache_key] = score

    if DEBUG_SAVE and debug_tag:
        _save_snapshot(image, pred, lng, lat, zoom, debug_tag)

    total_ms = round((time.perf_counter() - t0) * 1000, 1)

    return score, {
        "cache": "image" if image_cached else "miss",
        "tile_hits": tile_hits,
        "tile_misses": tile_misses,
        "image_ms": image_ms,
        "prep_ms": prep_ms,
        "onnx_ms": onnx_ms,
        "post_ms": post_ms,
        "total_ms": total_ms,
        "classes": classes_found,
    }
