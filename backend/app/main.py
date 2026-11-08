"""
Main FastAPI Application for POD Design Studio.
Local Web Server running on localhost:8000.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ARTWORKS_DIR, MOCKUPS_DIR, TEMPLATES_DIR, OUTPUT_DIR
from app.database import init_db
from app.routers import states, artwork, mockup, history, settings, dpi

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite tables and directories
    init_db()
    os.makedirs(ARTWORKS_DIR, exist_ok=True)
    os.makedirs(MOCKUPS_DIR, exist_ok=True)
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    print("POD Design Studio Database and Storage Initialized.")
    yield
    # Shutdown
    print("POD Design Studio Backend shutting down.")

app = FastAPI(
    title="POD Design Studio API",
    description="State-Aware US Print-on-Demand (POD) Studio Local API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset directories
app.mount("/static/artworks", StaticFiles(directory=str(ARTWORKS_DIR)), name="artworks")
app.mount("/static/mockups", StaticFiles(directory=str(MOCKUPS_DIR)), name="mockups")
app.mount("/static/templates", StaticFiles(directory=str(TEMPLATES_DIR)), name="templates")

# Include Routers
app.include_router(states.router)
app.include_router(artwork.router)
app.include_router(mockup.router)
app.include_router(history.router)
app.include_router(settings.router)
app.include_router(dpi.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "service": "POD Design Studio",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

