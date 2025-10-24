# OCR-harness Implementation Tasks

## Epic 1: Project Foundation

### Story 1.1: Initialize Project Structure
**Priority:** P0 - Critical
**Estimate:** 2 hours
**Assigned to:** Dev Agent

#### Context
We need to establish the monorepo structure with separate frontend and backend folders, including all necessary configuration files for both Next.js and FastAPI.

#### Acceptance Criteria
- [ ] Monorepo structure created with `/frontend` and `/backend` directories
- [ ] Next.js 14+ initialized with TypeScript in `/frontend`
- [ ] FastAPI project structure created in `/backend`
- [ ] Package.json in root with unified start script
- [ ] Git repository initialized with proper .gitignore
- [ ] README.md created with basic setup instructions

#### Implementation Details
```bash
# Root structure
mkdir ocr-harness && cd ocr-harness
git init

# Frontend setup
npx create-next-app@latest frontend --typescript --tailwind --app --src-dir=false --import-alias="@/*"
cd frontend
npm install shadcn-ui axios zustand react-dropzone pdfjs-dist xlsx papaparse
npx shadcn-ui@latest init

# Backend setup
cd ../backend
python -m venv venv
pip install fastapi uvicorn python-multipart pyyaml pillow pypdfium2 python-dotenv

# Root package.json
npm init -y
# Add start script to run both frontend and backend
```

#### Testing
- Run `npm run start` from root - both servers should start
- Frontend accessible at http://localhost:3000
- Backend API docs at http://localhost:8000/docs

---

### Story 1.2: Configure Model Management System
**Priority:** P0 - Critical
**Estimate:** 3 hours
**Assigned to:** Dev Agent

#### Context
Implement the flexible model configuration system that allows swapping LLM models without code changes.

#### Acceptance Criteria
- [ ] Create `backend/config/models.yaml` with LightOnOCR configuration
- [ ] Implement ModelService class for dynamic model loading
- [ ] Add environment variables for model paths
- [ ] Create model switching API endpoint
- [ ] Display current model name in frontend

#### Implementation Details
```python
# backend/config/models.yaml
models:
  default: "lighton-ocr-1b"
  configurations:
    lighton-ocr-1b:
      name: "LightOnOCR-1B-1025"
      display_name: "LightOn OCR 1B (1025)"
      model_path: "lightonai/LightOnOCR-1B-1025"
      # ... rest of config

# backend/services/model_service.py
class ModelService:
    def load_config(self, path: str):
        # Load YAML configuration
    
    def get_current_model(self):
        # Return current model info
    
    def switch_model(self, model_id: str):
        # Switch to different model
```

#### Testing
- Model configuration loads correctly
- API returns current model information
- Model name displays in UI
- Configuration changes reflect without code modification

---

## Epic 2: Core UI Components

### Story 2.1: Implement Desktop-Only Layout
**Priority:** P0 - Critical
**Estimate:** 2 hours
**Assigned to:** Dev Agent

#### Context
Create the main layout with mobile blocking to ensure desktop-only experience.

#### Acceptance Criteria
- [ ] Mobile detection implemented
- [ ] Blocking message displays on mobile devices
- [ ] Desktop layout fits in 1920x1080 without scrolling
- [ ] Header shows "OCR-harness" title and model name
- [ ] shadcn/ui components integrated

#### Implementation Details
```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <MobileBlocker />
        <Header />
        <main className="h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}

// components/MobileBlocker.tsx
const MobileBlocker = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  if (!isMobile) return null;
  return <div>Desktop required message</div>;
};
```

#### Testing
- Access from mobile browser - see blocking message
- Access from desktop - see full interface
- No scrollbars appear on standard desktop resolution
- Model name displays under title

---

### Story 2.2: Build File Upload Component
**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Implement drag-and-drop file upload with validation for supported formats.

#### Acceptance Criteria
- [ ] Drag-and-drop zone implemented with react-dropzone
- [ ] File type validation (PDF, PNG, JPG, etc.)
- [ ] File size limit enforcement (50MB)
- [ ] Visual feedback for drag hover state
- [ ] Error messages for invalid files
- [ ] Upload progress indication

#### Implementation Details
```typescript
// components/UploadZone.tsx
import { useDropzone } from 'react-dropzone';

const UploadZone = ({ onFileUpload }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif']
    },
    maxSize: 52428800, // 50MB
    onDrop: (acceptedFiles) => {
      onFileUpload(acceptedFiles[0]);
    }
  });
  
  return (
    <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
      <input {...getInputProps()} />
      {/* Upload UI */}
    </div>
  );
};
```

#### Testing
- Drag valid file - file accepted and preview shown
- Drag invalid file type - error message displayed
- Drag oversized file - size error shown
- Click to browse - file picker opens
- Multiple file handling

---

## Epic 3: Document Processing

### Story 3.1: Implement Document Preview
**Priority:** P1 - High
**Estimate:** 6 hours
**Assigned to:** Dev Agent

#### Context
Create preview components for both images and PDF documents with zoom controls.

#### Acceptance Criteria
- [ ] Image files display with automatic sizing
- [ ] PDF files render using PDF.js
- [ ] Zoom in/out controls functional
- [ ] Page navigation for multi-page PDFs
- [ ] Responsive sizing within panel constraints

#### Implementation Details
```typescript
// components/DocumentPreview.tsx
import { Document, Page, pdfjs } from 'react-pdf';

const DocumentPreview = ({ file, fileType }) => {
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  
  if (fileType === 'pdf') {
    return (
      <Document file={file}>
        <Page pageNumber={currentPage} scale={zoom} />
      </Document>
    );
  }
  
  return <img src={URL.createObjectURL(file)} style={{ zoom }} />;
};
```

#### Testing
- Upload image - displays correctly
- Upload PDF - first page renders
- Zoom controls work for both formats
- Multi-page PDF navigation works
- Preview updates when new file uploaded

---

### Story 3.2: Setup vLLM Server Integration
**Priority:** P0 - Critical
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Configure vLLM server to serve the LightOnOCR model and create backend integration.

#### Acceptance Criteria
- [ ] vLLM server startup script created
- [ ] Server starts with correct model loaded
- [ ] Backend can communicate with vLLM
- [ ] Error handling for server unavailability
- [ ] Health check endpoint implemented

#### Implementation Details
```python
# backend/start_vllm.py
import subprocess

def start_vllm_server():
    cmd = [
        "vllm", "serve",
        "lightonai/LightOnOCR-1B-1025",
        "--limit-mm-per-prompt", '{"image": 1}',
        "--port", "8001",
        "--async-scheduling"
    ]
    subprocess.run(cmd)

# backend/services/vllm_service.py
class VLLMService:
    async def process_image(self, image_base64: str, config: dict):
        payload = {
            "model": self.model_name,
            "messages": [{
                "role": "user",
                "content": [{
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{image_base64}"}
                }]
            }],
            **config
        }
        response = await self.client.post("/v1/chat/completions", json=payload)
        return response.json()
```

#### Testing
- vLLM server starts successfully
- Model loads without errors
- Backend can send requests and receive responses
- Timeout handling works
- Health check returns correct status

---

### Story 3.3: Create Processing Pipeline
**Priority:** P0 - Critical
**Estimate:** 6 hours
**Assigned to:** Dev Agent

#### Context
Implement the complete processing pipeline from file upload to OCR result.

#### Acceptance Criteria
- [ ] PDF to image conversion at 300 DPI
- [ ] Image preprocessing and base64 encoding
- [ ] OCR processing through vLLM
- [ ] Progress indication in UI
- [ ] Error handling at each stage
- [ ] Results returned to frontend

#### Implementation Details
```python
# backend/routes/process.py
@router.post("/api/process")
async def process_document(file: UploadFile, config: dict = None):
    try:
        # Save temp file
        temp_path = save_temp_file(file)
        
        # Convert PDF to images if needed
        if file.content_type == "application/pdf":
            images = pdf_to_images(temp_path, dpi=300)
        else:
            images = [load_image(temp_path)]
        
        # Process each image
        results = []
        for image in images:
            base64_image = image_to_base64(image)
            text = await vllm_service.process_image(base64_image, config)
            results.append(text)
        
        # Clean up temp files
        cleanup_temp_files(temp_path)
        
        return {"success": True, "text": "\n".join(results)}
    except Exception as e:
        return {"success": False, "error": str(e)}
```

#### Testing
- Single image processing works
- Multi-page PDF processing works
- Large files handled without memory issues
- Errors caught and returned properly
- Temp files cleaned up after processing

---

## Epic 4: Results and Export

### Story 4.1: Implement Results Display
**Priority:** P1 - High
**Estimate:** 3 hours
**Assigned to:** Dev Agent

#### Context
Create the results panel to display extracted text after processing.

#### Acceptance Criteria
- [ ] Scrollable text area for results
- [ ] Copy-to-clipboard functionality
- [ ] Clear visual separation from input
- [ ] Loading state during processing
- [ ] Error state for failed processing

#### Implementation Details
```typescript
// components/ResultsView.tsx
const ResultsView = ({ text, isLoading, error }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="results-container">
      <div className="results-header">
        <h3>Extracted Text</h3>
        <Button onClick={copyToClipboard}>Copy</Button>
      </div>
      <pre className="results-text">{text}</pre>
    </div>
  );
};
```

#### Testing
- Text displays after successful processing
- Copy button works correctly
- Loading state shows during processing
- Error messages display appropriately
- Long text scrolls properly

---

### Story 4.2: Build Export Functionality
**Priority:** P1 - High
**Estimate:** 5 hours
**Assigned to:** Dev Agent

#### Context
Implement export to TXT, CSV, and XLSX formats with proper formatting.

#### Acceptance Criteria
- [ ] TXT export with preserved layout
- [ ] CSV export with table detection
- [ ] XLSX export with multi-sheet support
- [ ] Download triggers automatically
- [ ] Proper filename generation

#### Implementation Details
```typescript
// lib/exporters.ts
export class TextExporter {
  static export(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' });
    downloadBlob(blob, `${filename}.txt`);
  }
}

export class CSVExporter {
  static export(text: string, filename: string) {
    const tables = detectTables(text);
    const csv = Papa.unparse(tables);
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `${filename}.csv`);
  }
}

export class ExcelExporter {
  static export(text: string, filename: string, pages: number) {
    const workbook = XLSX.utils.book_new();
    // Create sheets for each page
    for (let i = 0; i < pages; i++) {
      const sheet = XLSX.utils.aoa_to_sheet(parsePageData(text, i));
      XLSX.utils.book_append_sheet(workbook, sheet, `Page ${i + 1}`);
    }
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
}
```

#### Testing
- TXT export maintains text layout
- CSV export handles tabular data correctly
- XLSX creates proper multi-sheet files
- Downloads work in all major browsers
- Filenames are sanitized properly

---

## Epic 5: Settings and Configuration

### Story 5.1: Create Settings Panel
**Priority:** P2 - Medium
**Estimate:** 3 hours
**Assigned to:** Dev Agent

#### Context
Build the settings modal for adjusting model parameters.

#### Acceptance Criteria
- [ ] Modal opens from settings icon
- [ ] Temperature slider (0-1)
- [ ] Top-p slider (0-1)
- [ ] Max tokens input field
- [ ] Reset to defaults button
- [ ] Settings persist during session

#### Implementation Details
```typescript
// components/SettingsPanel.tsx
const SettingsPanel = ({ isOpen, onClose, config, onConfigChange }) => {
  const [tempConfig, setTempConfig] = useState(config);
  
  const handleApply = () => {
    onConfigChange(tempConfig);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>Model Configuration</DialogHeader>
        <div className="settings-grid">
          <Label>Temperature: {tempConfig.temperature}</Label>
          <Slider
            value={[tempConfig.temperature]}
            onValueChange={([v]) => setTempConfig({...tempConfig, temperature: v})}
            min={0} max={1} step={0.1}
          />
          {/* Other controls */}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setTempConfig(defaultConfig)}>
            Reset
          </Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

#### Testing
- Settings modal opens and closes properly
- Sliders update values correctly
- Reset button restores defaults
- Applied settings affect processing
- Settings maintained during session

---

## Epic 6: Integration and Polish

### Story 6.1: Implement One-Command Startup
**Priority:** P0 - Critical
**Estimate:** 2 hours
**Assigned to:** Dev Agent

#### Context
Create unified startup script that launches all services with one command.

#### Acceptance Criteria
- [ ] Single `npm run start` command works from root
- [ ] Frontend server starts on port 3000
- [ ] Backend server starts on port 8000
- [ ] vLLM server starts on port 8001
- [ ] Graceful shutdown on Ctrl+C
- [ ] Clear startup messages

#### Implementation Details
```json
// package.json (root)
{
  "scripts": {
    "start": "node scripts/start.js",
    "start:frontend": "cd frontend && npm run dev",
    "start:backend": "cd backend && python -m uvicorn app.main:app --reload --port 8000",
    "start:vllm": "cd backend && python start_vllm.py"
  }
}
```

```javascript
// scripts/start.js
const { spawn } = require('child_process');
const processes = [];

function startService(name, command, cwd) {
  console.log(`Starting ${name}...`);
  const proc = spawn(command, { shell: true, cwd, stdio: 'inherit' });
  processes.push(proc);
}

startService('vLLM Server', 'python start_vllm.py', './backend');
setTimeout(() => {
  startService('Backend API', 'uvicorn app.main:app --reload --port 8000', './backend');
  startService('Frontend', 'npm run dev', './frontend');
}, 5000); // Wait for vLLM to initialize

process.on('SIGINT', () => {
  processes.forEach(p => p.kill());
  process.exit();
});
```

#### Testing
- Run `npm run start` from root
- All three services start successfully
- Can access frontend at localhost:3000
- Can access backend docs at localhost:8000/docs
- Ctrl+C stops all services cleanly

---

### Story 6.2: Add Error Handling and Validation
**Priority:** P1 - High
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Implement comprehensive error handling throughout the application.

#### Acceptance Criteria
- [ ] File validation with clear error messages
- [ ] Network error handling
- [ ] Processing failure recovery
- [ ] User-friendly error displays
- [ ] Retry mechanisms where appropriate

#### Implementation Details
```typescript
// hooks/useErrorHandler.ts
export const useErrorHandler = () => {
  const handleError = (error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    if (error.message.includes('Network')) {
      toast.error('Connection error. Please check your network.');
    } else if (error.message.includes('File')) {
      toast.error('Invalid file. Please check the format and size.');
    } else if (error.message.includes('Processing')) {
      toast.error('Processing failed. Please try again.');
    } else {
      toast.error('An unexpected error occurred.');
    }
  };
  
  return { handleError };
};
```

#### Testing
- Upload invalid file type - clear error message
- Disconnect network - network error handled
- Stop backend - connection error displayed
- Upload corrupted file - processing error shown
- All errors logged to console

---

### Story 6.3: Performance Optimization
**Priority:** P2 - Medium
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Optimize application performance for smooth user experience.

#### Acceptance Criteria
- [ ] Lazy loading implemented for heavy components
- [ ] Image optimization for previews
- [ ] Debounced API calls
- [ ] Memory cleanup after processing
- [ ] Loading states for all async operations

#### Implementation Details
```typescript
// Lazy loading
const DocumentPreview = lazy(() => import('./components/DocumentPreview'));
const ResultsView = lazy(() => import('./components/ResultsView'));

// Debouncing
const debouncedProcess = useMemo(
  () => debounce(processDocument, 500),
  []
);

// Memory cleanup
useEffect(() => {
  return () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
  };
}, [fileUrl]);
```

#### Testing
- Large file processing doesn't freeze UI
- Component loading is smooth
- Memory usage stays reasonable
- No memory leaks after multiple processes
- UI remains responsive during processing

---

## Epic 7: Documentation and Testing

### Story 7.1: Create User Documentation
**Priority:** P2 - Medium
**Estimate:** 2 hours
**Assigned to:** Dev Agent

#### Context
Write comprehensive README and user documentation.

#### Acceptance Criteria
- [ ] Installation instructions
- [ ] System requirements listed
- [ ] Usage guide with screenshots
- [ ] Troubleshooting section
- [ ] Model configuration guide

#### Implementation Details
```markdown
# README.md
## OCR-harness

### Installation
1. Clone repository
2. Install dependencies
3. Configure model
4. Run `npm start`

### Requirements
- Node.js 18+
- Python 3.11+
- 8GB RAM minimum
- GPU recommended

### Usage
[Screenshots and instructions]

### Troubleshooting
[Common issues and solutions]
```

#### Testing
- New user can follow instructions successfully
- All commands work as documented
- Screenshots match current UI
- Troubleshooting covers common issues

---

### Story 7.2: Implement Basic Test Suite
**Priority:** P2 - Medium
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Create essential tests for critical functionality.

#### Acceptance Criteria
- [ ] Unit tests for utility functions
- [ ] Component rendering tests
- [ ] API endpoint tests
- [ ] File processing tests
- [ ] Test coverage > 60%

#### Implementation Details
```typescript
// __tests__/components/UploadZone.test.tsx
describe('UploadZone', () => {
  it('accepts valid file types', () => {
    const { getByTestId } = render(<UploadZone />);
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    // Test file acceptance
  });
  
  it('rejects invalid file types', () => {
    // Test file rejection
  });
});

// __tests__/api/process.test.py
def test_process_image():
    response = client.post("/api/process", files={"file": test_image})
    assert response.status_code == 200
    assert "text" in response.json()
```

#### Testing
- All tests pass
- Coverage report generated
- CI/CD can run tests
- Tests catch breaking changes

---

## Epic 8: Error Logging and Diagnostics

### Story 8.1: Implement Frontend Logger System
**Priority:** P1 - High
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Create a comprehensive frontend logging system that captures all errors and events without requiring DevTools.

#### Acceptance Criteria
- [ ] Logger class implemented with log levels
- [ ] Error boundary captures React errors
- [ ] Window error events intercepted
- [ ] Logs stored in session memory
- [ ] Sanitization removes sensitive data
- [ ] Export functionality for JSON and TXT

#### Implementation Details
```typescript
// lib/logger.ts
class FrontendLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  
  log(level: LogLevel, message: string, details?: any) {
    const entry = {
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
  }
  
  sanitizeDetails(details: any) {
    // Remove fileContent, extractedText, etc.
  }
  
  setupErrorBoundary() {
    window.addEventListener('error', (event) => {
      this.log('ERROR', event.message, {
        stackTrace: event.error?.stack
      });
    });
  }
}
```

#### Testing
- Errors are captured automatically
- Logs don't contain sensitive data
- Export generates valid files
- Memory limit enforced (1000 logs max)

---

### Story 8.2: Implement Backend Logger System
**Priority:** P1 - High
**Estimate:** 4 hours
**Assigned to:** Dev Agent

#### Context
Create backend logging system that integrates with FastAPI and captures all server-side errors.

#### Acceptance Criteria
- [ ] Logger class for backend events
- [ ] Exception middleware captures all errors
- [ ] Integration with Python logging module
- [ ] Session-based log storage
- [ ] API endpoint for retrieving logs
- [ ] Sanitization of sensitive data

#### Implementation Details
```python
# backend/utils/logger.py
class BackendLogger:
    def __init__(self):
        self.logs = []
        self.max_logs = 1000
    
    def log(self, level: str, message: str, details: dict = None):
        entry = {
            "id": str(uuid4()),
            "timestamp": datetime.now().isoformat(),
            "level": level,
            "source": "BACKEND",
            "message": message,
            "details": self.sanitize_details(details)
        }
        self.logs.append(entry)
        
    def sanitize_details(self, details):
        # Remove sensitive information
        pass

# backend/middleware/error_handler.py
async def log_exceptions(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.log('ERROR', str(e), {
            "path": request.url.path,
            "stackTrace": traceback.format_exc()
        })
        raise
```

#### Testing
- All exceptions are logged
- API errors include proper context
- Logs accessible via API
- No sensitive data in logs

---

### Story 8.3: Build Log Viewer Component
**Priority:** P1 - High
**Estimate:** 5 hours
**Assigned to:** Dev Agent

#### Context
Create a user-friendly log viewer that displays system logs without requiring DevTools.

#### Acceptance Criteria
- [ ] Slide-out panel UI component
- [ ] Real-time log updates (polling)
- [ ] Filter by log level
- [ ] Search functionality
- [ ] Export logs as JSON or TXT
- [ ] Clear logs option
- [ ] Auto-scroll toggle

#### Implementation Details
```typescript
// components/LogViewer.tsx
const LogViewer = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'ALL' | LogLevel>('ALL');
  
  useEffect(() => {
    // Poll for new logs every second
    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  const exportLogs = (format: 'json' | 'txt') => {
    const blob = logger.exportLogs(format);
    downloadBlob(blob, `logs-${Date.now()}.${format}`);
  };
  
  return (
    <Sheet open={isOpen}>
      <SheetContent className="w-[600px]">
        <div className="log-viewer">
          {/* Filter controls */}
          {/* Log entries list */}
          {/* Export buttons */}
        </div>
      </SheetContent>
    </Sheet>
  );
};
```

#### Testing
- Log viewer opens and closes properly
- Logs update in real-time
- Filters work correctly
- Export generates valid files
- UI handles 1000+ logs smoothly

---

### Story 8.4: Add Error Report Generation
**Priority:** P2 - Medium
**Estimate:** 3 hours
**Assigned to:** Dev Agent

#### Context
Implement automatic error report generation for critical failures.

#### Acceptance Criteria
- [ ] Error report button appears on critical errors
- [ ] Report includes recent error logs
- [ ] System information collected
- [ ] Sanitized for privacy
- [ ] Downloads as JSON file
- [ ] User-friendly format

#### Implementation Details
```typescript
// components/ErrorReporter.tsx
const generateErrorReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    error: {
      message: currentError.message,
      stack: currentError.stack
    },
    recentErrors: logger.getErrors().slice(-10),
    systemInfo: {
      browser: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      modelUsed: getCurrentModel()
    },
    sessionId: logger.sessionId
  };
  
  downloadJSON(report, `error-report-${Date.now()}.json`);
};
```

#### Testing
- Error report generates on demand
- Contains relevant debugging info
- No sensitive data included
- Downloads successfully
- Format is readable

---

### Story 8.5: Integrate Logging Throughout Application
**Priority:** P1 - High
**Estimate:** 3 hours
**Assigned to:** Dev Agent

#### Context
Add logging calls throughout the application to capture all important events.

#### Acceptance Criteria
- [ ] Log file uploads (metadata only)
- [ ] Log processing start/end
- [ ] Log API calls and responses
- [ ] Log configuration changes
- [ ] Log export actions
- [ ] Log performance metrics

#### Implementation Details
```typescript
// In upload handler
logger.log('INFO', 'File uploaded', {
  fileName: file.name,
  fileSize: file.size,
  fileType: file.type
});

// In processing
logger.log('INFO', 'Processing started', {
  modelConfig: getConfig(),
  fileName: file.name
});

// In API calls
logger.log('DEBUG', 'API call', {
  endpoint: url,
  method: 'POST',
  responseTime: duration
});

// In exports
logger.log('INFO', 'Export generated', {
  format: exportFormat,
  resultLength: text.length
});
```

#### Testing
- All user actions are logged
- Performance metrics captured
- Error scenarios logged with context
- Log volume is reasonable

---

### Story 8.6: Add Log API Endpoints
**Priority:** P2 - Medium
**Estimate:** 2 hours
**Assigned to:** Dev Agent

#### Context
Create API endpoints for log management and retrieval.

#### Acceptance Criteria
- [ ] GET /api/logs - retrieve logs
- [ ] GET /api/logs/export - export logs
- [ ] DELETE /api/logs - clear logs
- [ ] Filtering by level and session
- [ ] Pagination for large log sets

#### Implementation Details
```python
# backend/routes/logs.py
@router.get("/api/logs")
async def get_logs(
    session_id: str = None,
    level: str = None,
    limit: int = 100
):
    logs = logger.get_logs(session_id, level)
    return {"logs": logs[:limit]}

@router.get("/api/logs/export")
async def export_logs(format: str = "json"):
    logs = logger.get_logs()
    if format == "json":
        return JSONResponse(content=logs)
    else:
        text = format_logs_as_text(logs)
        return PlainTextResponse(content=text)

@router.delete("/api/logs")
async def clear_logs():
    logger.clear()
    return {"message": "Logs cleared"}
```

#### Testing
- API returns logs correctly
- Filtering works
- Export formats are valid
- Clear removes all logs

---

## Deployment Readiness Checklist

### Pre-Deployment
- [ ] All P0 and P1 stories completed
- [ ] Tests passing with >60% coverage
- [ ] Documentation complete
- [ ] Error handling comprehensive
- [ ] Error logging system operational
- [ ] Log viewer accessible to users
- [ ] Export functionality tested
- [ ] Performance optimized

### Deployment Steps
1. Build frontend: `npm run build`
2. Package backend with dependencies
3. Configure production environment variables
4. Deploy to staging environment
5. Run smoke tests
6. Verify error logging works
7. Test log export functionality
8. Deploy to production (Vercel for frontend)

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Review user-submitted error reports
- [ ] Gather user feedback
- [ ] Plan next iteration features

## Success Metrics
- Processing time < 30 seconds per page
- Zero data retention after session
- Support for all specified file formats
- Successful export in all three formats
- Desktop-only enforcement working
- Model swapping without code changes
- Error logging captures all failures
- Users can export logs without DevTools
