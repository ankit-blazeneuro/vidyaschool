import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, create_engine

from app.core.auth import decode_session_token
from app.core.database import init_db
from app.core.fees import build_default_fee_installments
from app.routes.fees import router as fees_router

# Load env variables from .env
load_dotenv()

# Load database URL and adjust for SQLAlchemy PostgreSQL driver
db_url = os.getenv("DATABASE_URL")
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = create_engine(db_url or "")

app = FastAPI(title="VidyaSchool Fees Backend API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fees_router)


@app.on_event("startup")
def on_startup():
    init_db()


__all__ = ["app", "build_default_fee_installments", "decode_session_token"]



