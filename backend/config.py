import os
from pathlib import Path

from dotenv import load_dotenv


ROOT_DIR = Path(__file__).resolve().parents[1]
load_dotenv(ROOT_DIR / "backend" / ".env")

MODEL_PATH = Path(os.getenv("MODEL_PATH", str(ROOT_DIR / "sidewalk_model.onnx"))).resolve()
TILE_SERVER_URL = os.getenv(
    "TILE_SERVER_URL", "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
)
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")

MAPILLARY_TOKEN = os.getenv("MAPILLARY_TOKEN", "")
MAPILLARY_BASE_URL = os.getenv("MAPILLARY_BASE_URL", "https://graph.mapillary.com")
MAPILLARY_RADIUS_M = int(os.getenv("MAPILLARY_RADIUS_M", "50"))

TILE_SIZE = 256
IMAGE_SIZE = 512

CLASS_NAMES = {
    0: "background",
    1: "road",
    2: "sidewalk",
    3: "asphalt_good",
    4: "cobblestone",
    5: "pedestrian",
    6: "stairs",
    7: "pole_sign",
}

# passability = 1 - sum(pixel_fraction[c] * CLASS_WEIGHTS[c]).
# 0.0 = fully walkable, 1.0 = fully blocking.
CLASS_WEIGHTS = {
    0: 0.5,
    1: 0.5,
    2: 0.0,
    3: 0.1,
    4: 0.4,
    5: 0.0,
    6: 1.0,
    7: 0.7,
}
