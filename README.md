# MobImpAI

Pedestrian routing that scores how walkable each part of a proposed route is, based on a semantic segmentation model applied to OpenStreetMap tile imagery.

## What it does

Given a start and an end point, the backend:

1. Asks OSRM for a walking route.
2. Samples the route every N meters.
3. Downloads the OSM raster tile around each sample and builds a 512x512 image.
4. Runs an ONNX segmentation model on the image and computes a per-tile
   passability score from the fraction of pixels classified as walkable,
   grass, road, obstacle, etc.
5. Returns the route geometry, the sampled nodes with their scores, and a summary of average passability, distance, and estimated duration.

The frontend renders the route on a Mapbox map, colored by passability, and
lets the user pick start and end via search or clicks.

## Stack

React 19, Vite, FastAPI, ONNX Runtime for inference, Caddy for reverse proxy

## Configuration

Two environment files are read at build and runtime:

- Root `.env` (used by docker compose for build args). Required entry:
  ```
  VITE_MAPBOX_TOKEN=pk.your-mapbox-public-token
  ```
- `frontend/.env` (read by Vite when running `npm run dev` outside Docker).
  Required entries:
  ```
  VITE_API_URL=http://localhost:8000
  VITE_MAPBOX_TOKEN=pk.your-mapbox-public-token
  ```

## Run locally

```
docker compose up -d --build
open http://localhost:3000
```

- Frontend is served at `http://localhost:3000` (nginx inside the container).
- Backend is directly reachable at `http://localhost:8000` for debugging.
- The frontend calls `/api/*`, which the container's own nginx proxies to
  the backend service on the internal docker network.
- Be careful as docker uses arm64 images, so it may require changes for x86 hosts or try running prod containers.

## Run in production (VM)

The production stack adds a Caddy service that owns ports 80 and 443,
handles HTTPS with automatically-provisioned Let's Encrypt certificates,
and reverse-proxies to the internal frontend and backend containers.

Prerequisites on the VM:

- DNS A records for `mobimpai.ru` and `www.mobimpai.ru` pointing at the VM.
- Ports 80 and 443 open in the firewall.
- Repo checked out at `/home/mobimpai`.
- Root `.env` with the Mapbox token.

Start the stack:

```
cd /home/mobimpai
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml logs -f caddy
```

Wait for Caddy to log `certificate obtained successfully`. The site is then
live at `https://mobimpai.ru`.


## How passability is computed

For each sampled point on the route:

1. Fetch the surrounding OSM tiles and stitch a 512x512 image centered on
   the coordinate.
2. Convert to a float32 NCHW tensor in the range [0, 1].
3. Run the ONNX session:
   `session.run(["logits"], {"pixel_values": input})`.
4. Take `argmax` over the class axis to get a per-pixel class map.
5. Compute score (see formula in the code )

Class weights live in `backend/config.py` and need to match the semantics of the trained model