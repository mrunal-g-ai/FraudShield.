"""
FraudShield Database Configuration and Session Management
SQLite database with SQLAlchemy ORM for persisting transaction predictions and audit logs.
"""

from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_DIR = Path(__file__).resolve().parent
DB_FILE = DB_DIR / "fraudshield.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency to yield database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Creates database tables if they do not exist."""
    import backend.app.database.models  # Ensure models are imported
    Base.metadata.create_all(bind=engine)


# Initialize tables on load
init_db()
