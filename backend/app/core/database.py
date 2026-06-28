from sqlmodel import Session, SQLModel, create_engine
from app.core.config import DB_URL

engine = create_engine(
    DB_URL or "",
    pool_pre_ping=True,
    pool_recycle=300
)


def get_db():
    with Session(engine) as session:
        yield session


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
