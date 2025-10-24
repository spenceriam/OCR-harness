# OCR-harness Project Summary

## Quick Reference for GLM 4.6 Implementation

### Project Overview
**Name:** OCR-harness  
**Purpose:** Flexible OCR demo application with swappable LLM models  
**Current Model:** LightOnOCR-1B-1025  
**Architecture:** Next.js frontend + FastAPI backend + vLLM server  

### Key Features
✅ Desktop-only web application (blocks mobile users)  
✅ Drag-and-drop file upload (PDF, PNG, JPG, etc.)  
✅ Document preview with zoom controls  
✅ OCR text extraction using LightOnOCR-1B  
✅ Export to TXT, CSV, XLSX formats  
✅ Configurable model parameters  
✅ Single command startup (`npm run start`)  
✅ Model flexibility through YAML configuration  
✅ **Comprehensive error logging system**  
✅ **User-accessible log viewer (no DevTools needed)**  
✅ **Log export for debugging and support**  

### Technology Stack

#### Frontend (Port 3000)
```
- Next.js 14+ with TypeScript
- shadcn/ui components
- Tailwind CSS
- react-dropzone, pdfjs-dist
- xlsx, papaparse for exports
```

#### Backend (Port 8000)
```
- FastAPI with Python 3.11+
- pypdfium2 for PDF processing
- Pillow for image handling
- PyYAML for configuration
```

#### Model Server (Port 8001)
```
- vLLM server
- LightOnOCR-1B-1025 model
- Async processing
```

### File Structure
```
ocr-harness/
├── frontend/          # Next.js application
├── backend/           # FastAPI server
├── scripts/           # Startup scripts
└── package.json       # Root orchestration
```

### Implementation Priority

#### Phase 1: Foundation (Critical)
1. Project structure setup
2. Model configuration system
3. Desktop-only layout
4. File upload component

#### Phase 2: Core Features (High)
1. Document preview
2. vLLM integration
3. Processing pipeline
4. Results display

#### Phase 3: Export & Polish (Medium)
1. Export functionality
2. Settings panel
3. Error handling
4. Documentation

### Key Configuration Files

#### Model Configuration (`backend/config/models.yaml`)
```yaml
models:
  default: "lighton-ocr-1b"
  configurations:
    lighton-ocr-1b:
      name: "LightOnOCR-1B-1025"
      display_name: "LightOn OCR 1B (1025)"
      model_path: "lightonai/LightOnOCR-1B-1025"
```

#### Environment Variables
```bash
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Backend  
VLLM_SERVER_URL=http://localhost:8001
MODEL_CONFIG_PATH=./config/models.yaml
```

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/process` | POST | Process document for OCR |
| `/api/models` | GET | Get available models |
| `/api/export` | POST | Export results to file |

### User Flow Summary
1. User opens app (desktop only)
2. Uploads PDF/image file
3. Views preview
4. Clicks "Process"
5. Reviews extracted text
6. Exports to desired format

### Critical Implementation Notes

#### Model Flexibility
- Models defined in YAML, not hardcoded
- Display name shown under app title
- Easy to swap models by editing config

#### Desktop-Only Enforcement
```typescript
// Mobile users see blocking message
if (isMobile) {
  return <DesktopRequiredMessage />
}
```

#### Processing Pipeline
1. Receive file upload
2. Convert PDF to images (if needed)
3. Encode images to base64
4. Send to vLLM server
5. Return extracted text
6. Display results

#### One-Command Startup
```bash
npm run start
# Starts all three services:
# - Frontend (3000)
# - Backend (8000)  
# - vLLM (8001)
```

### Success Metrics
- ✅ Processing < 30 seconds per page
- ✅ No data retention after session
- ✅ All file formats supported
- ✅ Three export formats working
- ✅ Model swapping functional

### Common Pitfalls to Avoid
1. ❌ Don't hardcode model names
2. ❌ Don't allow mobile access
3. ❌ Don't retain user data
4. ❌ Don't skip PDF conversion step
5. ❌ Don't process during preview

### Development Commands

```bash
# Initial Setup
git init
npx create-next-app@latest frontend --typescript --tailwind --app
cd backend && python -m venv venv
pip install fastapi uvicorn pypdfium2 pillow pyyaml

# Install vLLM
pip install vllm

# Development
npm run start              # Start all services
npm run start:frontend     # Frontend only
npm run start:backend      # Backend only
npm run start:vllm        # Model server only

# Testing
npm test                   # Run tests
npm run build             # Build for production
```

### Vercel Deployment (Future)
```bash
# Frontend deployment
cd frontend
vercel --prod

# Backend needs separate hosting (not Vercel)
# Options: Modal.com, Replicate, AWS Lambda
```

### File Upload Limits
- Maximum file size: 50MB
- Supported formats: PDF, PNG, JPG, JPEG, WebP, GIF
- Batch processing: Supported for images

### Model Parameters (Configurable)
- Temperature: 0.0-1.0 (default: 0.2)
- Top-p: 0.0-1.0 (default: 0.9)
- Max Tokens: Adjustable (default: 6500)
- Render DPI: 300 (for PDF conversion)

### Error Handling Strategy
1. File validation errors → Clear user message
2. Processing errors → Retry option
3. Network errors → Connection check
4. Model errors → Fallback message

### Error Logging System
- **Frontend Logger**: Captures all browser errors, React errors, and user actions
- **Backend Logger**: Records API errors, processing failures, and system events
- **Log Viewer**: Built-in UI panel accessible via "View Logs" button
- **Log Levels**: INFO, WARNING, ERROR, DEBUG
- **Privacy**: No file contents or extracted text logged
- **Export Options**: JSON or TXT format for debugging
- **Error Reports**: One-click generation for support tickets
- **Session-Based**: Logs cleared after session ends
- **Max Logs**: 1000 entries per session (auto-trim)

### Log Data Structure
```typescript
{
  id: string,
  timestamp: Date,
  level: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG',
  source: 'FRONTEND' | 'BACKEND' | 'MODEL',
  component: string,
  message: string,
  details: {
    // Sanitized metadata only
    fileName?: string,
    fileSize?: number,
    processingTime?: number,
    errorCode?: string,
    stackTrace?: string
  }
}
```

### Testing Checklist
- [ ] Desktop access works
- [ ] Mobile access blocked
- [ ] File upload accepts valid formats
- [ ] PDF converts to images
- [ ] OCR processing completes
- [ ] Results display correctly
- [ ] All export formats work
- [ ] Settings apply to processing
- [ ] One-command startup works
- [ ] Model name displays correctly

---

## For GLM 4.6 Implementation

This project follows a spec-driven development approach with:
1. **requirements.md** - What to build
2. **design.md** - How to build it
3. **tasks.md** - Step-by-step implementation
4. **user_flow.md** - User journey visualization

Start with Story 1.1 in tasks.md and work through sequentially. Each story has clear acceptance criteria and implementation details.

The model flexibility is KEY - ensure all model references go through the configuration system, never hardcoded.

Remember: This is an MVP focused on proving the OCR model works. Keep it simple, functional, and desktop-only.
