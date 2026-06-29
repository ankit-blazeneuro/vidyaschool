from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session, select
from main import engine

router = APIRouter(prefix="/api/slider", tags=["slider"])

class SliderImageRequest(BaseModel):
    id: int
    url: str
    title: str
    enabled: bool

@router.get("/images")
async def get_slider_images():
    """Get all enabled slider images for mobile app"""
    from models import SliderImage
    with Session(engine) as db:
        images = db.exec(select(SliderImage).where(SliderImage.enabled == True).order_by(SliderImage.order)).all()
        
        # If no images exist, create defaults
        if not images:
            defaults = [
                SliderImage(id=1, url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", title="Welcome to Vidya School", enabled=True, order=1),
                SliderImage(id=2, url="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", title="Excellence in Education", enabled=True, order=2),
                SliderImage(id=3, url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", title="Building Future Leaders", enabled=True, order=3)
            ]
            for img in defaults:
                db.add(img)
            db.commit()
            images = defaults
        
        return [{"id": img.id, "url": img.url, "title": img.title, "enabled": img.enabled} for img in images]

@router.get("/images/all")
async def get_all_slider_images():
    """Get all slider images (for admin panel)"""
    from models import SliderImage
    with Session(engine) as db:
        images = db.exec(select(SliderImage).order_by(SliderImage.order)).all()
        
        # If no images exist, create defaults
        if not images:
            defaults = [
                SliderImage(id=1, url="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800", title="Welcome to Vidya School", enabled=True, order=1),
                SliderImage(id=2, url="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800", title="Excellence in Education", enabled=True, order=2),
                SliderImage(id=3, url="https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800", title="Building Future Leaders", enabled=True, order=3)
            ]
            for img in defaults:
                db.add(img)
            db.commit()
            images = defaults
        
        return [{"id": img.id, "url": img.url, "title": img.title, "enabled": img.enabled} for img in images]

@router.post("/images")
async def update_slider_images(images: list[SliderImageRequest]):
    """Update slider images (admin only)"""
    from models import SliderImage
    
    with Session(engine) as db:
        # Delete all existing images
        existing = db.exec(select(SliderImage)).all()
        for img in existing:
            db.delete(img)
        
        # Add new images
        for idx, img_data in enumerate(images):
            new_img = SliderImage(
                id=img_data.id,
                url=img_data.url,
                title=img_data.title,
                enabled=img_data.enabled,
                order=idx + 1,
                updated_at=datetime.utcnow()
            )
            db.add(new_img)
        
        db.commit()
        
        return {"success": True, "images": [{"id": i.id, "url": i.url, "title": i.title, "enabled": i.enabled} for i in images]}

