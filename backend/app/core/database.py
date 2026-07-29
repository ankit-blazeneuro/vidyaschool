from sqlmodel import Session, SQLModel, create_engine, text
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
    with Session(engine) as session:
        try:
            session.execute(text('ALTER TABLE teacher_note ADD COLUMN IF NOT EXISTS pdf_url TEXT;'))
            session.commit()
        except Exception:
            session.rollback()
            try:
                session.execute(text('ALTER TABLE teacher_note ADD COLUMN pdf_url TEXT;'))
                session.commit()
            except Exception:
                session.rollback()
