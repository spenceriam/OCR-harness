# OCR-harness

A flexible OCR demonstration application featuring swappable LLM models for document text extraction and processing. Currently configured with **LightOnOCR-1B-1025** from HuggingFace.

## Features

- **Model Flexibility**: Swap OCR models through YAML configuration without code changes
- **Desktop-First Design**: Optimized for desktop/laptop use (blocks mobile devices)
- **File Support**: PDF, PNG, JPG, JPEG, WebP, GIF (up to 50MB)
- **Drag-and-Drop**: Easy file upload interface
- **Multiple Export Formats**: TXT, CSV, XLSX
- **Comprehensive Logging**: Built-in error logging and diagnostics
- **One-Command Startup**: Launch all services with `npm start`

## Technology Stack

### Frontend
- Next.js 14+ with TypeScript
- Tailwind CSS for styling
- React Dropzone for file uploads
- Lucide React for icons
- XLSX.js for Excel export

### Backend
- FastAPI (Python)
- vLLM for model serving
- pypdfium2 for PDF processing
- Pillow for image handling

### Model
- **LightOnOCR-1B-1025** from [HuggingFace](https://huggingface.co/lightonai/LightOnOCR-1B-1025)
- Configurable through `backend/config/models.yaml`

## Requirements

- **Node.js** 18+
- **Python** 3.11+
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: Recommended for faster processing (optional)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd OCR-harness
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 3. Configure Environment

```bash
# Backend environment
cp backend/.env.example backend/.env
```

### 4. Start the Application

```bash
# Start all services with one command
npm run start
```

Or start services individually:

```bash
# Terminal 1: Start vLLM server (takes several minutes first time)
npm run start:vllm

# Terminal 2: Start backend (after vLLM is ready)
npm run start:backend

# Terminal 3: Start frontend
npm run start:frontend
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **vLLM Server**: http://localhost:8001

## Usage

1. **Upload a Document**: Drag and drop or click to browse for a PDF or image file
2. **Process**: Click "Process Document" to extract text using OCR
3. **Export**: Choose TXT, CSV, or XLSX format to download results
4. **View Logs**: Click "View Logs" for debugging and diagnostics

## Configuration

### Model Configuration

Edit `backend/config/models.yaml` to change OCR models:

```yaml
models:
  default: "lighton-ocr-1b"

  configurations:
    lighton-ocr-1b:
      name: "LightOnOCR-1B-1025"
      display_name: "LightOn OCR 1B (1025)"
      model_path: "lightonai/LightOnOCR-1B-1025"
      server_port: 8001
      parameters:
        temperature: 0.2
        top_p: 0.9
        max_tokens: 6500
        render_dpi: 300
```

### Environment Variables

Frontend (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAX_FILE_SIZE=52428800
```

Backend (`.env`):
```bash
VLLM_SERVER_URL=http://localhost:8001
MODEL_CONFIG_PATH=./config/models.yaml
CORS_ORIGINS=http://localhost:3000
```

## Project Structure

```
OCR-harness/
├── frontend/              # Next.js frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utilities, API client, logger
│   └── package.json
├── backend/              # FastAPI backend
│   ├── app/             # Application code
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   └── utils/       # Utilities
│   ├── config/          # Configuration files
│   │   └── models.yaml  # Model configurations
│   ├── requirements.txt
│   └── start_vllm.py   # vLLM startup script
├── scripts/
│   └── start.js        # Unified startup script
├── docs/               # Project documentation
└── package.json        # Root package file
```

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

### Backend Development

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Skip vLLM During Development

```bash
npm run start -- --skip-vllm
```

This is useful when testing frontend/backend changes without needing the model server.

## Troubleshooting

### vLLM Server Won't Start

- **Check RAM**: Ensure you have at least 8GB available
- **Install vLLM**: `pip install vllm`
- **CUDA Issues**: If you have a GPU, ensure CUDA is properly configured

### Backend Errors

- **Check Python Version**: Must be 3.11+
- **Reinstall Dependencies**: `pip install -r backend/requirements.txt`
- **Check Ports**: Ensure ports 8000 and 8001 are available

### Frontend Build Errors

- **Check Node Version**: Must be 18+
- **Clear Cache**: `rm -rf frontend/.next && cd frontend && npm run dev`
- **Reinstall Modules**: `rm -rf frontend/node_modules && cd frontend && npm install`

### Model Download Issues

The LightOnOCR model will be downloaded automatically on first run. This can take several minutes depending on your internet connection. The model is cached locally for subsequent runs.

## API Endpoints

### Process Document
```
POST /api/process
Content-Type: multipart/form-data

Parameters:
- file: File (PDF or image)
- config: Optional JSON string with processing parameters

Returns:
{
  "success": true,
  "text": "extracted text...",
  "metadata": {
    "filename": "document.pdf",
    "pages": 3,
    "model_used": "LightOn OCR 1B (1025)"
  }
}
```

### Get Models
```
GET /api/models

Returns:
{
  "current": { ... },
  "available": [ ... ]
}
```

### Get Logs
```
GET /api/logs?level=ERROR&limit=100

Returns:
{
  "logs": [ ... ],
  "total": 42
}
```

See full API documentation at http://localhost:8000/docs when running.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review logs via the "View Logs" button in the UI
3. Check the API documentation at http://localhost:8000/docs
4. Open an issue on GitHub
