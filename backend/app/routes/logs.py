"""API routes for log management."""
from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse, PlainTextResponse
from typing import Optional
from datetime import datetime
import json

from ..utils.logger import logger

router = APIRouter(prefix="/api", tags=["logs"])


@router.get("/logs")
async def get_logs(
    session_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """Retrieve system logs with optional filtering.

    Args:
        session_id: Filter by session ID
        level: Filter by log level (INFO, WARNING, ERROR, DEBUG)
        limit: Maximum number of logs to return (1-1000)

    Returns:
        Dictionary containing logs and total count
    """
    logs = logger.get_logs(session_id, level, limit)

    return {
        "logs": logs,
        "total": len(logs),
        "session_id": logger.session_id
    }


@router.get("/logs/export")
async def export_logs(
    format: str = Query("json", regex="^(json|txt)$")
):
    """Export all logs in specified format.

    Args:
        format: Export format ('json' or 'txt')

    Returns:
        Logs in requested format
    """
    content = logger.export_logs(format)

    if format == "json":
        return JSONResponse(
            content=json.loads(content),
            headers={
                "Content-Disposition": f"attachment; filename=logs-{datetime.now().isoformat()}.json"
            }
        )
    else:
        return PlainTextResponse(
            content=content,
            headers={
                "Content-Disposition": f"attachment; filename=logs-{datetime.now().isoformat()}.txt"
            }
        )


@router.delete("/logs")
async def clear_logs():
    """Clear all logs from memory.

    Returns:
        Success message
    """
    logger.clear_logs()
    logger.log('INFO', 'Logs cleared by user request')

    return {"message": "Logs cleared successfully"}


@router.post("/logs/report")
async def generate_error_report():
    """Generate comprehensive error report.

    Returns:
        Dictionary containing error report
    """
    report = logger.generate_error_report()

    logger.log('INFO', 'Error report generated', {
        'report_id': report['reportId']
    })

    return report
