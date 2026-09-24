from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from app.core.config import settings
from app.core.database import init_db
from app.api import ipo, watchlist
from app.services.scheduler import start_scheduler, stop_scheduler, sync_live_ipos_to_db

logger = logging.getLogger("captrack.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize database tables instantly
    init_db()
    # 2. Trigger non-blocking background task for dynamic live web sync
    asyncio.create_task(sync_live_ipos_to_db())
    logger.info("Startup dynamic live IPO sync initiated in background task.")
    # 3. Start background scheduler for daily automatic refresh
    start_scheduler()
    yield
    # 4. Cleanup background scheduler on shutdown
    stop_scheduler()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ipo.router, prefix=settings.API_V1_STR)
app.include_router(watchlist.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "dynamic_sync": "enabled",
        "docs": "/docs"
    }
