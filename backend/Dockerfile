FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# libgomp1 is needed by onnxruntime's OpenMP threading on CPU.
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgomp1 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --index-url https://pypi.tuna.tsinghua.edu.cn/simple -r requirements.txt

COPY backend/ ./
COPY sidewalk_model.onnx      /app/sidewalk_model.onnx
COPY sidewalk_model.onnx.data /app/sidewalk_model.onnx.data

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
