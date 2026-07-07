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

TILE_SIZE = 256
IMAGE_SIZE = 512


CLASS_WEIGHTS = {
    0: 0.5,
    1: 0.0,
    2: 0.2,
    3: 0.3,
    4: 1.0,
}
