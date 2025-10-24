# OCR-harness User Flow Diagram

## Complete User Journey

```mermaid
flowchart TB
    Start([User Opens Application])
    
    %% Mobile Check
    Start --> MobileCheck{Is Mobile Device?}
    MobileCheck -->|Yes| MobileBlock[Display Desktop Required Message]
    MobileBlock --> End1([End Session])
    
    %% Main Flow
    MobileCheck -->|No| MainUI[Display Main Interface]
    MainUI --> ShowModel[Show Current Model: LightOnOCR-1B-1025]
    
    %% Settings Branch
    MainUI --> Settings{User Clicks Settings?}
    Settings -->|Yes| OpenSettings[Open Settings Modal]
    OpenSettings --> AdjustParams[Adjust Parameters<br/>- Temperature<br/>- Top-p<br/>- Max Tokens]
    AdjustParams --> ApplySettings{Apply Changes?}
    ApplySettings -->|Yes| SaveConfig[Save Configuration]
    ApplySettings -->|No| CancelSettings[Close Without Saving]
    SaveConfig --> MainUI
    CancelSettings --> MainUI
    
    %% Log Viewer Branch
    MainUI --> ViewLogs{User Clicks View Logs?}
    ViewLogs -->|Yes| OpenLogViewer[Open Log Panel]
    OpenLogViewer --> LogActions{Log Actions?}
    LogActions -->|Filter| FilterLogs[Filter by Level]
    LogActions -->|Export| ExportLogs[Export as JSON/TXT]
    LogActions -->|Clear| ClearLogs[Clear All Logs]
    LogActions -->|Close| CloseLogViewer[Close Panel]
    FilterLogs --> OpenLogViewer
    ExportLogs --> DownloadLogs[Download Log File]
    ClearLogs --> OpenLogViewer
    CloseLogViewer --> MainUI
    DownloadLogs --> OpenLogViewer
    
    %% Upload Flow
    ShowModel --> UploadChoice{Upload Method?}
    UploadChoice -->|Drag & Drop| DragFile[User Drags File to Zone]
    UploadChoice -->|Click Browse| ClickBrowse[Open File Picker]
    
    DragFile --> ValidateFile{Valid File?}
    ClickBrowse --> SelectFile[Select File]
    SelectFile --> ValidateFile
    
    %% File Validation
    ValidateFile -->|Invalid Type| ShowError1[Show Format Error]
    ValidateFile -->|Too Large| ShowError2[Show Size Error]
    ValidateFile -->|Valid| AcceptFile[File Accepted]
    
    ShowError1 --> UploadChoice
    ShowError2 --> UploadChoice
    
    %% Preview Stage
    AcceptFile --> FileType{File Type?}
    FileType -->|Image| ShowImage[Display Image Preview]
    FileType -->|PDF| ConvertPDF[Convert to Image Preview]
    ConvertPDF --> ShowPDF[Display PDF Preview<br/>with Page Navigation]
    
    ShowImage --> ProcessReady[Ready to Process]
    ShowPDF --> ProcessReady
    
    %% Processing Decision
    ProcessReady --> ProcessChoice{User Action?}
    ProcessChoice -->|Clear| ClearFile[Remove File]
    ClearFile --> UploadChoice
    ProcessChoice -->|Process| StartProcess[Click Process Button]
    
    %% Processing Flow
    StartProcess --> ShowLoading[Display Loading Indicator]
    ShowLoading --> LogProcessStart[📝 Log: Processing Started]
    LogProcessStart --> SendToBackend[Send to Backend API]
    
    SendToBackend --> BackendProcess{Backend Processing}
    BackendProcess --> PDFCheck{Is PDF?}
    PDFCheck -->|Yes| PDFToImages[Convert PDF to Images<br/>at 300 DPI]
    PDFCheck -->|No| PrepImage[Prepare Image]
    
    PDFToImages --> EncodeImages[Base64 Encode Images]
    PrepImage --> EncodeImages
    
    EncodeImages --> CallVLLM[Call vLLM Server<br/>with Model]
    CallVLLM --> ModelProcess[LightOnOCR Processes]
    ModelProcess --> ReturnText[Return Extracted Text]
    
    %% Result Handling
    ReturnText --> ProcessResult{Processing Result?}
    ProcessResult -->|Success| LogSuccess[📝 Log: Processing Complete]
    ProcessResult -->|Failed| LogError[📝 Log: Processing Failed]
    
    LogSuccess --> DisplayText[Display Extracted Text<br/>in Results Panel]
    LogError --> ShowProcessError[Show Processing Error]
    
    ShowProcessError --> GenerateReport{Generate Error Report?}
    GenerateReport -->|Yes| CreateReport[Create Error Report<br/>with Recent Logs]
    GenerateReport -->|No| RetryOption{Retry?}
    CreateReport --> DownloadReport[Download Report JSON]
    DownloadReport --> RetryOption
    
    RetryOption -->|Yes| StartProcess
    RetryOption -->|No| UploadChoice
    
    %% Export Flow
    DisplayText --> ExportChoice{Export Format?}
    ExportChoice -->|None| ViewOnly[User Views Text Only]
    ExportChoice -->|TXT| ExportTXT[Generate TXT File]
    ExportChoice -->|CSV| ExportCSV[Detect Tables<br/>Generate CSV]
    ExportChoice -->|XLSX| ExportXLSX[Create Excel<br/>Multi-sheet if needed]
    
    ExportTXT --> Download[Trigger Download]
    ExportCSV --> Download
    ExportXLSX --> Download
    
    %% Continue or End
    Download --> Continue{Process Another?}
    ViewOnly --> Continue
    Continue -->|Yes| ClearResults[Clear Current Results]
    ClearResults --> UploadChoice
    Continue -->|No| EndSession([End Session])
    
    %% Error Recovery Flows
    ShowProcessError --> ErrorRecovery{Recovery Action?}
    ErrorRecovery -->|Check Settings| OpenSettings
    ErrorRecovery -->|Try Different File| ClearFile
    ErrorRecovery -->|Exit| EndSession
    
    %% Zoom Controls (Parallel Flow)
    ShowImage -.-> ZoomControls[Zoom In/Out Available]
    ShowPDF -.-> ZoomControls
    ZoomControls -.-> ProcessReady
    
    %% Copy Feature (Parallel Flow)
    DisplayText -.-> CopyButton[Copy to Clipboard Available]
    CopyButton -.-> ExportChoice
    
    %% Style Definitions
    classDef startEnd fill:#90EE90,stroke:#333,stroke-width:2px
    classDef process fill:#87CEEB,stroke:#333,stroke-width:2px
    classDef decision fill:#FFE4B5,stroke:#333,stroke-width:2px
    classDef error fill:#FFB6C1,stroke:#333,stroke-width:2px
    classDef success fill:#98FB98,stroke:#333,stroke-width:2px
    
    class Start,End1,EndSession startEnd
    class MainUI,ShowModel,ShowLoading,SendToBackend,CallVLLM,ModelProcess,ReturnText process
    class MobileCheck,Settings,UploadChoice,ValidateFile,FileType,ProcessChoice,BackendProcess,PDFCheck,ProcessResult,ExportChoice,Continue,ApplySettings,RetryOption,ErrorRecovery decision
    class MobileBlock,ShowError1,ShowError2,ShowProcessError error
    class AcceptFile,DisplayText,Download success
```

## User Flow States Description

### Entry Points
1. **Desktop User**: Proceeds to main interface
2. **Mobile User**: Blocked with message, must switch to desktop

### Main Interaction Flows

#### Configuration Flow
- User can adjust model parameters at any time
- Settings persist for the session
- Changes apply to subsequent processing

#### Upload Flow
1. **Drag & Drop**: Direct file drop onto upload zone
2. **Browse**: Traditional file picker dialog
3. **Validation**: Automatic type and size checking
4. **Preview**: Immediate display of uploaded content

#### Processing Flow
1. **Initiation**: User clicks Process button
2. **Backend Processing**:
   - PDF conversion if needed
   - Image preparation
   - Model inference via vLLM
3. **Result Display**: Text appears in results panel

#### Export Flow
- **TXT**: Plain text with layout preservation
- **CSV**: Table detection and structured export
- **XLSX**: Multi-sheet for multi-page documents

### Error Recovery Paths
- **Invalid File**: Return to upload
- **Processing Failure**: Retry or new file
- **Network Error**: Retry after connection restored

### Parallel Features
- **Zoom Controls**: Available during preview
- **Copy to Clipboard**: Available for results
- **Settings Access**: Available at any time
- **Log Viewer**: Accessible at any time via "View Logs" button
- **Error Reporting**: Auto-triggered on critical errors

### Error Logging Flow
1. **Automatic Capture**: All errors logged without user intervention
2. **User Access**: Click "View Logs" to see system events
3. **Filtering**: Filter by INFO, WARNING, ERROR, DEBUG levels
4. **Export**: Download logs as JSON or TXT
5. **Error Reports**: Generate comprehensive report on failures
6. **Privacy**: No sensitive data (file contents) logged

## State Transitions

| From State | Action | To State | Condition |
|------------|--------|----------|-----------|
| Start | Load App | Mobile Block | Is Mobile |
| Start | Load App | Main UI | Is Desktop |
| Main UI | Click Settings | Settings Modal | Always |
| Main UI | Upload File | File Validation | Always |
| File Valid | - | Preview | Automatic |
| Preview | Process | Loading | Always |
| Loading | - | Results/Error | Based on Success |
| Results | Export | Download | Format Selected |
| Any Error | Retry | Previous State | User Choice |
| Any State | Clear | Upload Zone | User Action |

## Key Decision Points

### 1. Device Detection
- **Mobile**: Block and inform
- **Desktop**: Allow access

### 2. File Validation
- **Type Check**: PDF, PNG, JPG, JPEG, WebP, GIF
- **Size Check**: Maximum 50MB
- **Content Check**: Valid file structure

### 3. Processing Path
- **PDF**: Multi-step conversion process
- **Image**: Direct processing

### 4. Export Selection
- **User Choice**: TXT, CSV, or XLSX
- **Auto-detection**: Table structures for CSV/XLSX

## Success Criteria for User Flow

1. **Accessibility**: Desktop users can access all features
2. **Clarity**: Each step has clear feedback
3. **Recovery**: All errors have recovery paths
4. **Efficiency**: Minimum steps to complete task
5. **Flexibility**: Multiple paths to same goal

## Edge Cases Handled

1. **Large Files**: Progress indication and chunking
2. **Multi-page PDFs**: Page-by-page processing
3. **Network Interruption**: Graceful failure and retry
4. **Invalid Settings**: Validation and defaults
5. **Corrupt Files**: Error message and recovery
