from pydantic import BaseModel
from typing import List, Optional


class Review(BaseModel):
    author_name: str
    text: str
    rating: Optional[float] = None
    relative_time_description: Optional[str] = None
    profile_photo_url: Optional[str] = None


class Place(BaseModel):
    name: str
    type: str
    lat: float
    lon: float
    tags: dict
    image_url: Optional[str] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    opening_hours: dict = {}
    reviews: List[Review] = []
    google_maps_url: Optional[str] = None
    website: Optional[str] = None
    distance: str = "N/A"
