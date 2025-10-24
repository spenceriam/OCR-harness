# OCR-harness Requirements Specification

## Project Overview
**Name:** OCR-harness  
**Version:** 1.0.0  
**Purpose:** A flexible OCR demonstration application that can swap different LLM models for document text extraction and processing  
**Primary Model:** LightOnOCR-1B-1025 (with flexibility for future models)

## Core Requirements

### R1: System Architecture Requirements

#### R1.1: Model Flexibility
**WHEN** the system is configured  
**THE** OCR-harness **SHALL** support swappable LLM models through configuration files  
**SO THAT** different OCR models can be tested without code changes  

#### R1.2: Local Execution
**WHEN** the application starts  
**THE** system **SHALL** run both frontend and backend locally with a single command  
**WHERE** frontend runs on localhost:3000 and backend on localhost:8000  

#### R1.3: Vercel Deployment Ready
**THE** frontend **SHALL** be built with Next.js  
**SO THAT** it can be deployed to Vercel in future phases  

### R2: User Interface Requirements

#### R2.1: Desktop-Only Design
**WHEN** a user accesses the application from a mobile device  
**THE** system **SHALL** display a message stating "This experience works best on desktop or laptop devices"  
**WHILE** blocking mobile viewport rendering  

#### R2.2: No-Scroll Viewport
**THE** interface **SHALL** fit within a standard desktop viewport (1920x1080)  
**WITH** minimal or no scrolling required for core functionality  

#### R2.3: Model Display
**THE** application **SHALL** prominently display the current LLM model name  
**UNDER** the main application title "OCR-harness"  

#### R2.4: Clean UI
**THE** interface **SHALL** use shadcn/ui components  
**TO PROVIDE** a clean, functional design without unnecessary complexity  

### R3: File Upload Requirements

#### R3.1: Supported Formats
**THE** system **SHALL** accept the following file formats:
- Images: PNG, JPEG, JPG, WebP, GIF
- Documents: PDF (single and multi-page)

#### R3.2: Upload Methods
**THE** system **SHALL** support:
- Drag-and-drop file upload
- Click-to-browse file selection
- Maximum file size: 50MB

#### R3.3: Batch Processing
**IF** multiple images are uploaded  
**THE** system **SHALL** process them in batch mode  
**WHILE** maintaining individual file results  

### R4: Processing Requirements

#### R4.1: OCR Processing
**WHEN** a file is uploaded  
**THE** system **SHALL** send it to the backend for OCR processing  
**USING** the configured LLM model (default: LightOnOCR-1B-1025)  

#### R4.2: Configuration Options
**THE** system **SHALL** expose the following model parameters:
- Temperature (0.0 - 1.0, default: 0.2)
- Top-p (0.0 - 1.0, default: 0.9)
- Max tokens (adjustable, default: 6500)

#### R4.3: PDF Handling
**WHEN** processing PDF files  
**THE** system **SHALL** convert each page to an image at 300 DPI  
**BEFORE** sending to the OCR model  

### R5: Preview Requirements

#### R5.1: Document Preview
**AFTER** file upload  
**THE** system **SHALL** display the original document/image  
**IN** a preview panel with basic zoom controls  

#### R5.2: Results Preview
**AFTER** processing completes  
**THE** system **SHALL** display the extracted text  
**IN** a separate results panel  

#### R5.3: No Real-Time Processing
**THE** preview **SHALL** only update after processing is complete  
**NOT** during processing  

### R6: Export Requirements

#### R6.1: Text Export
**THE** system **SHALL** export results as .txt files  
**WITH** preserved layout and formatting where possible  

#### R6.2: CSV Export
**THE** system **SHALL** export tabular data as .csv files  
**WITH** proper column detection and delimiter handling  

#### R6.3: Excel Export
**THE** system **SHALL** export results as .xlsx files  
**WITH** support for:
- Multi-sheet exports for multi-page documents
- Basic table formatting preservation

### R7: Non-Functional Requirements

#### R7.1: Performance
**THE** system **SHALL** process a single-page document  
**WITHIN** 30 seconds on standard hardware (8GB RAM minimum)  

#### R7.2: Privacy
**THE** system **SHALL NOT** retain any uploaded files or processed data  
**AFTER** the user session ends  

#### R7.3: Error Handling
**WHEN** processing fails  
**THE** system **SHALL** display clear error messages  
**AND** allow the user to retry or upload a new file  

## Acceptance Criteria

### AC1: One-Command Startup
```bash
npm run start
```
**RESULT:** Both frontend and backend start successfully

### AC2: Model Configuration
- Configuration file exists at `/backend/config/models.yaml`
- Model name displays correctly in UI
- Model can be changed without code modification

### AC3: File Processing Flow
1. User uploads supported file → File appears in preview
2. User clicks "Process" → Loading indicator appears
3. Processing completes → Extracted text displays
4. User selects export format → File downloads successfully

### AC4: Desktop-Only Enforcement
- Mobile devices see blocking message
- Desktop browsers load full interface
- No horizontal scrolling on 1920x1080 displays

## Out of Scope for MVP
- Authentication/user management
- Cloud deployment (Phase 2)
- Real-time processing preview
- Handwriting recognition optimization
- Multi-language support
- Browser-based model execution
- File history/caching
