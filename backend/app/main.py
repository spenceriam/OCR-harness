"""FastAPI main application for OCR-harness backend."""
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback
from dotenv import load_dotenv

from .routes import models, logs, process
from .utils.logger import logger

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="OCR-harness API",
    description="Backend API for OCR document processing",
    version="1.0.0"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Error logging middleware
@app.middleware("http")
async def error_logging_middleware(request: Request, call_next):
    """Middleware to log all requests and errors."""

    # Log request
    logger.log('INFO', f"Request: {request.method} {request.url.path}", {
        "method": request.method,
        "path": request.url.path,
        "query_params": dict(request.query_params)
    })

    try:
        response = await call_next(request)

        # Log response
        logger.log('DEBUG', f"Response: {response.status_code}", {
            "path": request.url.path,
            "status_code": response.status_code
        })

        return response

    except Exception as e:
        # Log error
        logger.log('ERROR', f"Unhandled exception: {str(e)}", {
            "path": request.url.path,
            "method": request.method,
            "error_type": type(e).__name__,
            "stackTrace": traceback.format_exc()
        })

        # Return error response
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal server error",
                "message": str(e),
                "path": request.url.path
            }
        )


# Include routers
app.include_router(models.router)
app.include_router(logs.router)
app.include_router(process.router)


@app.on_event("startup")
async def startup_event():
    """Log startup event."""
    logger.log('INFO', 'Backend server started', {
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    })


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown event."""
    logger.log('INFO', 'Backend server shutting down')


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "OCR-harness API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": logger.logs[-1]['timestamp'] if logger.logs else None
    }
