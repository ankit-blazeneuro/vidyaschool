from sqlmodel import Session, SQLModel, create_engine
from app.core.config import DB_URL

engine = create_engine(DB_URL or "")


def get_db():
    with Session(engine) as session:
        yield session


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
