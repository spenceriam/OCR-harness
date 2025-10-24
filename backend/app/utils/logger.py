"""Backend logging system for OCR-harness."""
import json
import logging
import traceback
import sys
import platform
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import uuid4
from collections import deque


class BackendLogger:
    """Logger for backend events and errors."""

    def __init__(self, max_logs: int = 1000):
        """Initialize the backend logger.

        Args:
            max_logs: Maximum number of logs to keep in memory
        """
        self.logs = deque(maxlen=max_logs)
        self.session_id = str(uuid4())
        self.max_logs = max_logs
        self.setup_logging()

    def setup_logging(self):
        """Configure Python logging to use our custom handler."""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

        # Add custom handler to capture all logs
        handler = CustomLogHandler(self)
        logging.getLogger().addHandler(handler)

    def log(self, level: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Add a log entry.

        Args:
            level: Log level (INFO, WARNING, ERROR, DEBUG)
            message: Log message
            details: Optional dictionary with additional details
        """
        entry = {
            "id": str(uuid4()),
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "source": "BACKEND",
            "component": self._get_caller_info(),
            "message": message,
            "details": self._sanitize_details(details) if details else None,
            "sessionId": self.session_id
        }

        self.logs.append(entry)

        # Also log to Python logger
        log_level = getattr(logging, level, logging.INFO)
        logging.log(log_level, f"{message} | {details if details else ''}")

        return entry

    def _sanitize_details(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from log details.

        Args:
            details: Dictionary with log details

        Returns:
            Sanitized dictionary
        """
        if not details:
            return {}

        sanitized = details.copy()
        sensitive_keys = [
            'file_content', 'extracted_text', 'image_data',
            'password', 'token', 'api_key', 'secret'
        ]

        for key in sensitive_keys:
            sanitized.pop(key, None)

        return sanitized

    def _get_caller_info(self) -> str:
        """Get the calling function/module name.

        Returns:
            Name of the calling component
        """
        import inspect
        frame = inspect.currentframe()
        if frame and frame.f_back and frame.f_back.f_back:
            caller_frame = frame.f_back.f_back
            module = inspect.getmodule(caller_frame)
            if module:
                return module.__name__.split('.')[-1]
        return "unknown"

    def get_logs(self,
                 session_id: Optional[str] = None,
                 level: Optional[str] = None,
                 limit: int = 100) -> List[dict]:
        """Retrieve logs with optional filtering.

        Args:
            session_id: Filter by session ID
            level: Filter by log level
            limit: Maximum number of logs to return

        Returns:
            List of log entries
        """
        filtered_logs = list(self.logs)

        if session_id:
            filtered_logs = [
                log for log in filtered_logs
                if log.get('sessionId') == session_id
            ]

        if level:
            filtered_logs = [
                log for log in filtered_logs
                if log.get('level') == level
            ]

        return filtered_logs[-limit:]

    def clear_logs(self):
        """Clear all logs."""
        self.logs.clear()

    def export_logs(self, format: str = 'json') -> str:
        """Export logs in specified format.

        Args:
            format: Export format ('json' or 'txt')

        Returns:
            Formatted logs as string
        """
        logs_list = list(self.logs)

        if format == 'json':
            return json.dumps(logs_list, indent=2)

        # Text format
        lines = []
        for log in logs_list:
            line = f"[{log['timestamp']}] {log['level']} - {log['component']}: {log['message']}"
            if log.get('details'):
                line += f"\n  Details: {json.dumps(log['details'], indent=2)}"
            lines.append(line)

        return "\n\n".join(lines)

    def generate_error_report(self, error: Optional[Exception] = None) -> dict:
        """Generate a comprehensive error report.

        Args:
            error: Optional exception to include in report

        Returns:
            Dictionary containing error report
        """
        error_logs = [
            log for log in self.logs
            if log.get('level') == 'ERROR'
        ]

        report = {
            "reportId": str(uuid4()),
            "timestamp": datetime.now().isoformat(),
            "sessionId": self.session_id,
            "currentError": None,
            "recentErrors": error_logs[-10:],
            "allLogsCount": len(self.logs),
            "systemInfo": {
                "python_version": sys.version,
                "platform": platform.platform(),
                "processor": platform.processor()
            }
        }

        if error:
            report["currentError"] = {
                "type": type(error).__name__,
                "message": str(error),
                "stackTrace": traceback.format_exc()
            }

        return report


class CustomLogHandler(logging.Handler):
    """Custom handler to capture Python logs into our logger."""

    def __init__(self, backend_logger: BackendLogger):
        """Initialize the handler.

        Args:
            backend_logger: BackendLogger instance to use
        """
        super().__init__()
        self.backend_logger = backend_logger

    def emit(self, record: logging.LogRecord):
        """Emit a log record.

        Args:
            record: Log record to emit
        """
        level_map = {
            logging.DEBUG: 'DEBUG',
            logging.INFO: 'INFO',
            logging.WARNING: 'WARNING',
            logging.ERROR: 'ERROR',
            logging.CRITICAL: 'ERROR'
        }

        level = level_map.get(record.levelno, 'INFO')

        # Avoid infinite recursion
        if record.name != 'root':
            return

        self.backend_logger.log(
            level,
            record.getMessage(),
            {
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno
            }
        )


# Global logger instance
logger = BackendLogger()
