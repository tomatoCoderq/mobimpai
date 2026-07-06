from pathlib import Path
import sys

from ultralytics import YOLO

CLASS_WEIGHTS = {0: 0.3, 1: 0.15, 2: 1.0, 3: 0.1}

def compute_passability(objects):
    if not objects:
        return 1.0
    for obj in objects:
        if obj["class_id"] == 2:
            return 0.0
    blocked = sum(CLASS_WEIGHTS[o["class_id"]] * o["confidence"] * (1 + o["mask_area"] * 5) for o in objects)
    if len(objects) > 1:
        for i in range(len(objects)):
            for j in range(i + 1, len(objects)):
                dx = objects[i]["cx"] - objects[j]["cx"]
                dy = objects[i]["cy"] - objects[j]["cy"]
                if (dx**2 + dy**2) ** 0.5 < 0.3:
                    blocked *= 1.05
    return round(max(0.0, 1.0 - blocked), 3)

ROOT_DIR = Path(__file__).resolve().parent
MODEL_PATH = ROOT_DIR / "best.pt"

model = YOLO(str(MODEL_PATH))
image = sys.argv[1] if len(sys.argv) > 1 else "test_image.jpg"
results = model(image)
r = results[0]

objects = []
for i, box in enumerate(r.boxes):
    mask_area = float(r.masks.data[i].sum()) / (640 * 640) if r.masks and i < len(r.masks.data) else 0
    objects.append({
        "class_id": int(box.cls),
        "confidence": float(box.conf),
        "cx": float(box.xywh[0][0]) / 640,
        "cy": float(box.xywh[0][1]) / 640,
        "mask_area": mask_area
    })

for obj in objects:
    print(f"{r.names[obj['class_id']]} conf={obj['confidence']:.2f} mask={obj['mask_area']:.3f}")

print(f"passability={compute_passability(objects)}")
r.save("result.jpg")