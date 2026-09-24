from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# For SQLite, check_same_thread=False & 30s timeout is required for concurrent writes
connect_args = {"check_same_thread": False, "timeout": 30} if "sqlite" in settings.DATABASE_URL else {}

engine = create_engine(settings.DATABASE_URL, echo=False, connect_args=connect_args)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
