FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# Ultralytics image already has torch, torchvision, ultralytics, opencv, numpy.
# Only install what's *not* included.
COPY backend/requirements.txt ./requirements.txt
RUN pip install \
        fastapi==0.115.0 \
        uvicorn==0.30.6 \
        python-dotenv==1.0.1 \
        requests==2.32.3 \
        pillow==10.4.0 \
        onnxruntime==1.19.2

COPY backend/ ./
COPY sidewalk_model.onnx      /app/sidewalk_model.onnx
COPY sidewalk_model.onnx.data /app/sidewalk_model.onnx.data

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]