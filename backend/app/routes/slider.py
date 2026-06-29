from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/slider", tags=["slider"])

class SliderImage(BaseModel):
    id: int
    url: str
    title: str
    enabled: bool

# In-memory storage for slider images (you can move this to database later)
slider_images = [
    {
        "id": 1,
        "url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
        "title": "Welcome to Vidya School",
        "enabled": True
    },
    {
        "id": 2,
        "url": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "title": "Excellence in Education",
        "enabled": True
    },
    {
        "id": 3,
        "url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800",
        "title": "Building Future Leaders",
        "enabled": True
    }
]

@router.get("/images")
async def get_slider_images():
    """Get all enabled slider images for mobile app"""
    return [img for img in slider_images if img["enabled"]]

@router.get("/images/all")
async def get_all_slider_images():
    """Get all slider images (for admin panel)"""
    return slider_images

@router.post("/images")
async def update_slider_images(images: list[SliderImage]):
    """Update slider images (admin only)"""
    global slider_images
    slider_images = [img.dict() for img in images]
    return {"success": True, "images": slider_images}
