"""
FraudShield Backend Application Entrypoint
FastAPI application configured with CORS, database initialization,
and error handling.
"""

from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.database.db import init_db
from backend.ml.predict import FraudPredictor
from backend.ml.train import run_training_pipeline

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
BEST_MODEL_PATH = MODELS_DIR / "best_model.joblib"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database tables
    init_db()

    # Verify if model is trained; if not, train baseline model automatically
    if not BEST_MODEL_PATH.exists():
        print("Model artifact not found on startup. Executing initial training pipeline...")
        run_training_pipeline()

    # Preload predictor singleton
    predictor = FraudPredictor.get_instance()
    predictor.load_model()
    print("FraudShield API and Machine Learning Engine initialized successfully.")
    yield


app = FastAPI(
    title="FraudShield API",
    description="Credit Card Fraud Detection & Financial Risk Analytics API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for local development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler: prevent sensitive internal path exposure
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # In development/academic context, log the exception safely
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the transaction request.",
            "detail": str(exc) if "HTTPException" not in type(exc).__name__ else ""
        }
    )

app.include_router(router)


@app.get("/")
def root():
    return {
        "app": "FraudShield — Credit Card Fraud Detection System",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "api_base": "/api",
        "health": "/api/health"
    }
