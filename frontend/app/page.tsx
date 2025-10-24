'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { FileText, Settings, Download, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { downloadBlob, formatBytes } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function Home() {
  const [isMobile, setIsMobile] = useState(false);
  const [currentModel, setCurrentModel] = useState<string>('Loading...');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Check for mobile on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load current model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const model = await api.getCurrentModel();
        setCurrentModel(model.display_name);
        logger.log('INFO', 'Current model loaded', { model: model.display_name });
      } catch (err) {
        logger.log('ERROR', 'Failed to load model', { error: String(err) });
        setCurrentModel('Error loading model');
      }
    };
    loadModel();
  }, []);

  // File upload handler
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setExtractedText('');
      setError('');
      logger.log('INFO', 'File uploaded', {
        filename: file.name,
        size: file.size,
        type: file.type,
      });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'],
    },
    maxSize: 52428800, // 50MB
    multiple: false,
  });

  // Process document
  const handleProcess = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);
    setError('');

    try {
      logger.log('INFO', 'Processing started', { filename: uploadedFile.name });

      const result = await api.processDocument(uploadedFile);

      if (result.success && result.text) {
        setExtractedText(result.text);
        logger.log('INFO', 'Processing completed', {
          filename: uploadedFile.name,
          textLength: result.text.length,
        });
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMsg);
      logger.log('ERROR', 'Processing failed', { error: errorMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  // Export functions
  const exportTXT = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain' });
    downloadBlob(blob, `${uploadedFile?.name || 'document'}_extracted.txt`);
    logger.log('INFO', 'Text exported', { format: 'txt' });
  };

  const exportCSV = () => {
    if (!extractedText) return;
    // Simple CSV conversion - split by lines
    const lines = extractedText.split('\n');
    const csv = lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadBlob(blob, `${uploadedFile?.name || 'document'}_extracted.csv`);
    logger.log('INFO', 'CSV exported', { format: 'csv' });
  };

  const exportXLSX = () => {
    if (!extractedText) return;
    const lines = extractedText.split('\n');
    const data = lines.map(line => [line]);
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Text');
    XLSX.writeFile(wb, `${uploadedFile?.name || 'document'}_extracted.xlsx`);
    logger.log('INFO', 'Excel exported', { format: 'xlsx' });
  };

  // Mobile blocker
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Desktop Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            This OCR experience works best on desktop or laptop devices. Please access from a larger screen for optimal performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              OCR-harness
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{currentModel}</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Logs
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Upload Section */}
        <div className="grid grid-cols-3 gap-6">
          {/* Upload Zone */}
          <div className="col-span-1">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {uploadedFile ? uploadedFile.name : 'Drop file here or click to browse'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, PNG, JPG (max 50MB)
              </p>
              {uploadedFile && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {formatBytes(uploadedFile.size)}
                </p>
              )}
            </div>

            {uploadedFile && !isProcessing && (
              <button
                onClick={handleProcess}
                className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Process Document
              </button>
            )}

            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Processing...</p>
              </div>
            )}
          </div>

          {/* Preview/Results Section */}
          <div className="col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[500px]">
              <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Extracted Text
              </h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <p className="text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {extractedText ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                      {extractedText}
                    </pre>
                  </div>

                  {/* Export Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={exportTXT}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export TXT
                    </button>
                    <button
                      onClick={exportCSV}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={exportXLSX}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export XLSX
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500 py-20">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Upload and process a document to see extracted text</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
