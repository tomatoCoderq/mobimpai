from typing import Dict, List, Tuple

from pydantic import BaseModel, Field


class PassabilityRequest(BaseModel):
    coord: Tuple[float, float] = Field(..., description="[lng, lat]")
    zoom: int = 18


class RouteRequest(BaseModel):
    start: Tuple[float, float] = Field(..., description="[lng, lat]")
    end: Tuple[float, float] = Field(..., description="[lng, lat]")
    zoom: int = 18
    grid_size: int = Field(9, ge=5, le=21, description="Odd grid size (5..21)")
    sample_distance: int = Field(40, ge=10, le=200, description="Meters between samples")
    max_samples: int = Field(18, ge=3, le=60, description="Max samples")


class RouteResponse(BaseModel):
    geojson: Dict
    nodes: List[Dict]
    stats: Dict
