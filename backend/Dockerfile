FROM ultralytics/ultralytics:latest-arm64

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# Ultralytics image already has torch, torchvision, ultralytics, opencv, numpy.
# Only install what's *not* included.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --index-url https://pypi.tuna.tsinghua.edu.cn/simple \
        fastapi==0.115.0 \
        uvicorn==0.30.6 \
        python-dotenv==1.0.1

COPY backend/app.py ./app.py
COPY best.pt /app/best.pt

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]