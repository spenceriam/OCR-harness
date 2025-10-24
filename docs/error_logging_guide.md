# Error Logging Implementation Guide for OCR-harness

## Overview
This guide provides step-by-step instructions for implementing the comprehensive error logging system in OCR-harness, eliminating the need for users to access browser DevTools (F12).

## Architecture Summary

```
Frontend Logger ←→ Session Storage ←→ Log Viewer UI
     ↓                    ↑                 ↓
Error Events         Log API           Export Files
     ↓                    ↑                 ↓
Backend Logger ←→ Memory Store ←→ Error Reports
```

## Implementation Steps

### Step 1: Install Dependencies

#### Frontend
```bash
cd frontend
npm install nanoid   # For generating log IDs
```

#### Backend
```bash
cd backend
pip install python-json-logger  # For structured logging
```

### Step 2: Create Core Logger Classes

#### Frontend Logger (`frontend/lib/logger.ts`)
```typescript
import { nanoid } from 'nanoid';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: 'FRONTEND' | 'BACKEND' | 'MODEL' | 'SYSTEM';
  component: string;
  message: string;
  details?: Record<string, any>;
  sessionId: string;
}

class FrontendLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;
  private readonly sessionId: string;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.sessionId = nanoid();
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.log('ERROR', `Unhandled error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.log('ERROR', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
      });
    });
  }

  log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      id: nanoid(),
      timestamp: new Date(),
      level,
      source: 'FRONTEND',
      component: this.getCallerComponent(),
      message,
      details: this.sanitizeDetails(details),
      sessionId: this.sessionId
    };

    this.logs.push(entry);
    this.trimLogs();
    this.notifyListeners();
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level}] ${message}`, details);
    }
  }

  private sanitizeDetails(details: any): any {
    if (!details) return undefined;
    
    const sanitized = { ...details };
    // Remove sensitive data
    const sensitiveKeys = [
      'fileContent', 'extractedText', 'imageData',
      'password', 'token', 'apiKey'
    ];
    
    sensitiveKeys.forEach(key => delete sanitized[key]);
    return sanitized;
  }

  private getCallerComponent(): string {
    // Parse stack trace to get component name
    const stack = new Error().stack;
    const match = stack?.match(/at (\w+).*\/components\/(\w+)/);
    return match?.[2] || 'Unknown';
  }

  private trimLogs() {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.logs));
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getLogs(filter?: { level?: LogLevel }): LogEntry[] {
    if (!filter) return [...this.logs];
    
    return this.logs.filter(log => {
      if (filter.level && log.level !== filter.level) return false;
      return true;
    });
  }

  clearLogs() {
    this.logs = [];
    this.notifyListeners();
  }

  exportLogs(format: 'json' | 'txt'): Blob {
    if (format === 'json') {
      return new Blob(
        [JSON.stringify(this.logs, null, 2)],
        { type: 'application/json' }
      );
    }

    const text = this.logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level} - ${log.component}: ${log.message}${
        log.details ? '\n  Details: ' + JSON.stringify(log.details) : ''
      }`
    ).join('\n\n');

    return new Blob([text], { type: 'text/plain' });
  }

  generateErrorReport(error?: Error): object {
    const errorLogs = this.logs.filter(l => l.level === 'ERROR');
    
    return {
      reportId: nanoid(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      currentError: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      recentErrors: errorLogs.slice(-10),
      allLogsCount: this.logs.length,
      systemInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
          width: screen.width,
          height: screen.height,
          pixelRatio: window.devicePixelRatio
        },
        timestamp: new Date().toISOString()
      }
    };
  }
}

export const logger = new FrontendLogger();
```

#### Backend Logger (`backend/utils/logger.py`)
```python
import json
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import uuid4
from collections import deque

class BackendLogger:
    def __init__(self, max_logs: int = 1000):
        self.logs = deque(maxlen=max_logs)
        self.session_id = str(uuid4())
        self.setup_logging()
    
    def setup_logging(self):
        """Configure Python logging to use our custom handler"""
        logging.basicConfig(
            level=logging.DEBUG,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Add custom handler to capture all logs
        handler = CustomLogHandler(self)
        logging.getLogger().addHandler(handler)
    
    def log(self, level: str, message: str, details: Optional[Dict[str, Any]] = None):
        """Add a log entry"""
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
        return entry
    
    def _sanitize_details(self, details: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive information from log details"""
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
        """Get the calling function/module name"""
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
        """Retrieve logs with optional filtering"""
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
        """Clear all logs"""
        self.logs.clear()
    
    def export_logs(self, format: str = 'json') -> str:
        """Export logs in specified format"""
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
        """Generate a comprehensive error report"""
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
    """Custom handler to capture Python logs into our logger"""
    
    def __init__(self, backend_logger):
        super().__init__()
        self.backend_logger = backend_logger
    
    def emit(self, record):
        level_map = {
            logging.DEBUG: 'DEBUG',
            logging.INFO: 'INFO',
            logging.WARNING: 'WARNING',
            logging.ERROR: 'ERROR',
            logging.CRITICAL: 'ERROR'
        }
        
        level = level_map.get(record.levelno, 'INFO')
        self.backend_logger.log(
            level,
            record.getMessage(),
            {
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno
            }
        )

# Initialize global logger instance
logger = BackendLogger()
```

### Step 3: Create Log Viewer Component

#### Log Viewer UI (`frontend/components/LogViewer.tsx`)
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '@/lib/logger';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download, Trash2, Filter } from 'lucide-react';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subscribe to log updates
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Load initial logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => 
    filter === 'ALL' || log.level === filter
  );

  const exportLogs = (format: 'json' | 'txt') => {
    const blob = logger.exportLogs(format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-harness-logs-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
  };

  const getLevelColor = (level: LogLevel) => {
    const colors = {
      ERROR: 'text-red-600 dark:text-red-400',
      WARNING: 'text-yellow-600 dark:text-yellow-400',
      INFO: 'text-blue-600 dark:text-blue-400',
      DEBUG: 'text-gray-600 dark:text-gray-400'
    };
    return colors[level];
  };

  const getLevelBg = (level: LogLevel) => {
    const colors = {
      ERROR: 'bg-red-50 dark:bg-red-950',
      WARNING: 'bg-yellow-50 dark:bg-yellow-950',
      INFO: 'bg-blue-50 dark:bg-blue-950',
      DEBUG: 'bg-gray-50 dark:bg-gray-900'
    };
    return colors[level];
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[700px] sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle>System Logs</SheetTitle>
        </SheetHeader>
        
        <div className="flex gap-2 my-4">
          <Select value={filter} onValueChange={(v) => setFilter(v as LogLevel | 'ALL')}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Logs</SelectItem>
              <SelectItem value="ERROR">Errors</SelectItem>
              <SelectItem value="WARNING">Warnings</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={clearLogs}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportLogs('txt')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export TXT
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => exportLogs('json')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
        
        <div className="h-[500px] overflow-y-auto font-mono text-xs space-y-2 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-2 rounded ${getLevelBg(log.level)} border border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-semibold ${getLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {log.component}
                  </span>
                </div>
                <div className="ml-4 mt-1 text-gray-800 dark:text-gray-200">
                  {log.message}
                </div>
                {log.details && (
                  <details className="ml-4 mt-1">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                      View details
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        
        <div className="flex items-center gap-2 mt-4">
          <Checkbox 
            id="autoscroll"
            checked={autoScroll} 
            onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
          />
          <Label htmlFor="autoscroll">Auto-scroll to latest</Label>
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

### Step 4: Add Error Reporter Component

#### Error Reporter (`frontend/components/ErrorReporter.tsx`)
```typescript
import React from 'react';
import { logger } from '@/lib/logger';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download } from 'lucide-react';

interface ErrorReporterProps {
  error: Error;
  onClose: () => void;
}

export const ErrorReporter: React.FC<ErrorReporterProps> = ({ error, onClose }) => {
  const generateReport = () => {
    const report = logger.generateErrorReport(error);
    
    const blob = new Blob(
      [JSON.stringify(report, null, 2)],
      { type: 'application/json' }
    );
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertTitle>An error occurred</AlertTitle>
      <AlertDescription>
        <p className="mb-2">{error.message}</p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="destructive"
            onClick={generateReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Error Report
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={onClose}
          >
            Dismiss
          </Button>
        </div>
        <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
          Click "Generate Error Report" to download debugging information for support.
        </p>
      </AlertDescription>
    </Alert>
  );
};
```

### Step 5: Integrate Logging Throughout Application

#### Add Logging to Key Operations
```typescript
// In file upload handler
const handleFileUpload = async (file: File) => {
  logger.log('INFO', 'File upload initiated', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });
  
  try {
    // Upload logic
    logger.log('INFO', 'File uploaded successfully', {
      fileName: file.name
    });
  } catch (error) {
    logger.log('ERROR', 'File upload failed', {
      fileName: file.name,
      error: error.message
    });
    throw error;
  }
};

// In OCR processing
const processDocument = async (file: File, config: any) => {
  const startTime = Date.now();
  
  logger.log('INFO', 'OCR processing started', {
    fileName: file.name,
    modelConfig: config
  });
  
  try {
    const result = await api.process(file, config);
    
    const duration = Date.now() - startTime;
    logger.log('INFO', 'OCR processing completed', {
      fileName: file.name,
      processingTime: duration,
      resultLength: result.text.length
    });
    
    return result;
  } catch (error) {
    logger.log('ERROR', 'OCR processing failed', {
      fileName: file.name,
      error: error.message,
      config
    });
    throw error;
  }
};

// In export operations
const exportResults = async (text: string, format: string) => {
  logger.log('INFO', 'Export initiated', {
    format,
    textLength: text.length
  });
  
  try {
    // Export logic
    logger.log('INFO', 'Export completed', { format });
  } catch (error) {
    logger.log('ERROR', 'Export failed', {
      format,
      error: error.message
    });
    throw error;
  }
};
```

### Step 6: Add Backend API Endpoints

#### Log Management Routes (`backend/routes/logs.py`)
```python
from fastapi import APIRouter, Query
from typing import Optional
from ..utils.logger import logger

router = APIRouter()

@router.get("/api/logs")
async def get_logs(
    session_id: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """Retrieve system logs with optional filtering"""
    logs = logger.get_logs(session_id, level, limit)
    return {
        "logs": logs,
        "total": len(logs)
    }

@router.get("/api/logs/export")
async def export_logs(
    format: str = Query("json", regex="^(json|txt)$")
):
    """Export all logs in specified format"""
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

@router.delete("/api/logs")
async def clear_logs():
    """Clear all logs from memory"""
    logger.clear_logs()
    return {"message": "Logs cleared successfully"}

@router.post("/api/logs/report")
async def generate_error_report():
    """Generate comprehensive error report"""
    report = logger.generate_error_report()
    return report
```

### Step 7: Add Middleware for Backend Error Logging

#### Error Logging Middleware (`backend/middleware/error_logger.py`)
```python
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback
from ..utils.logger import logger

async def error_logging_middleware(request: Request, call_next):
    """Middleware to log all requests and errors"""
    
    # Log request
    logger.log('INFO', f"Request: {request.method} {request.url.path}", {
        "method": request.method,
        "path": request.url.path,
        "query_params": dict(request.query_params)
    })
    
    try:
        response = await call_next(request)
        
        # Log response
        logger.log('INFO', f"Response: {response.status_code}", {
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
```

### Step 8: Update Main Application Files

#### Update Frontend Layout (`frontend/app/layout.tsx`)
```typescript
import { LogViewer } from '@/components/LogViewer';
import { ErrorReporter } from '@/components/ErrorReporter';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

export default function RootLayout({ children }) {
  const [showLogs, setShowLogs] = useState(false);
  const [currentError, setCurrentError] = useState<Error | null>(null);

  // Set up global error handler
  useEffect(() => {
    const handleError = (error: Error) => {
      setCurrentError(error);
    };
    
    window.addEventListener('error', (e) => handleError(e.error));
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <html>
      <body>
        <header className="flex justify-between items-center p-4">
          <div>
            <h1>OCR-harness</h1>
            <p className="text-sm text-gray-600">LightOnOCR-1B-1025</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Logs
            </Button>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </header>
        
        {currentError && (
          <ErrorReporter
            error={currentError}
            onClose={() => setCurrentError(null)}
          />
        )}
        
        <main>{children}</main>
        
        <LogViewer
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
        />
      </body>
    </html>
  );
}
```

#### Update Backend Main (`backend/app/main.py`)
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .middleware.error_logger import error_logging_middleware
from .routes import process, models, logs
from .utils.logger import logger

app = FastAPI(title="OCR-harness API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add error logging middleware
app.middleware("http")(error_logging_middleware)

# Include routers
app.include_router(process.router)
app.include_router(models.router)
app.include_router(logs.router)

@app.on_event("startup")
async def startup_event():
    logger.log('INFO', 'Backend server started', {
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development")
    })

@app.on_event("shutdown")
async def shutdown_event():
    logger.log('INFO', 'Backend server shutting down')
```

## Usage Guide

### For Users

1. **View Logs**: Click "View Logs" button in header
2. **Filter Logs**: Use dropdown to filter by level
3. **Export Logs**: Click Export TXT or Export JSON
4. **Generate Error Report**: Appears automatically on errors
5. **Clear Logs**: Click Clear button in log viewer

### For Developers

#### Log Levels Guide
- **INFO**: General information about operations
- **WARNING**: Potential issues that don't stop execution
- **ERROR**: Failures that need attention
- **DEBUG**: Detailed information for debugging

#### Adding Logs
```typescript
// Frontend
import { logger } from '@/lib/logger';

logger.log('INFO', 'Operation started', { details });
logger.log('ERROR', 'Operation failed', { error: error.message });

// Backend
from utils.logger import logger

logger.log('INFO', 'Processing file', {'filename': file.name})
logger.log('ERROR', 'Processing failed', {'error': str(e)})
```

## Testing the Error Logging System

### Test Scenarios

1. **Test Error Capture**
   - Trigger a file upload with invalid format
   - Verify error appears in log viewer
   - Check error report generation

2. **Test Log Export**
   - Generate various log entries
   - Export as JSON and TXT
   - Verify file downloads correctly

3. **Test Log Filtering**
   - Create logs of different levels
   - Test each filter option
   - Verify correct logs displayed

4. **Test Privacy**
   - Upload file with content
   - Process and check logs
   - Verify no file content in logs

5. **Test Performance**
   - Generate 1000+ logs
   - Verify auto-trim works
   - Check UI remains responsive

## Troubleshooting

### Common Issues

1. **Logs not appearing**
   - Check logger is imported correctly
   - Verify log level is set appropriately
   - Ensure middleware is registered

2. **Export not working**
   - Check browser download settings
   - Verify blob creation succeeds
   - Test with different formats

3. **Performance issues**
   - Reduce max logs limit
   - Implement pagination
   - Use virtual scrolling for large lists

## Privacy Compliance

The logging system ensures privacy by:
- Never logging file contents
- Sanitizing sensitive fields
- Session-based storage only
- Auto-clear on session end
- No persistent storage

## Future Enhancements

1. **Remote Logging**: Send logs to external service
2. **Log Analytics**: Add charts and metrics
3. **Alert System**: Notify on critical errors
4. **Log Search**: Full-text search capability
5. **Log Replay**: Recreate user sessions from logs
