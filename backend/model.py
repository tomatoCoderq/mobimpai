import io
import math
from functools import lru_cache
from typing import Dict, Tuple

import numpy as np
import onnxruntime as ort
import requests
from PIL import Image

from algorithms.geo import latlng_to_pixel
from config import CLASS_WEIGHTS, IMAGE_SIZE, MODEL_PATH, TILE_SERVER_URL, TILE_SIZE


IMAGE_CACHE: Dict[Tuple[float, float, int], Image.Image] = {}
SCORE_CACHE: Dict[Tuple[float, float, int], float] = {}


session = ort.InferenceSession(str(MODEL_PATH))


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


def score_tile(lng: float, lat: float, zoom: int) -> float:
    cache_key = (round(lng, 6), round(lat, 6), zoom)
    cached = SCORE_CACHE.get(cache_key)
    if cached is not None:
        return cached

    image = fetch_osm_image(lng, lat, zoom)
    inp = _to_input_tensor(image)
    logits = session.run(["logits"], {"pixel_values": inp})[0]
    pred = logits.argmax(axis=1).squeeze()
    score = compute_passability(pred)
    SCORE_CACHE[cache_key] = score
    return score
