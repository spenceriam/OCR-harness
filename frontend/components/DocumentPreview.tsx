'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentPreviewProps {
  file: File | null;
  fileType: 'pdf' | 'image' | null;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ file, fileType }) => {
  const [zoom, setZoom] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (file && fileType === 'image') {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, fileType]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const zoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const previousPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
        <FileText className="w-16 h-16 mb-4 opacity-50" />
        <p>Upload a file to see preview</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-16 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {fileType === 'pdf' && numPages && (
          <div className="flex items-center gap-2">
            <button
              onClick={previousPage}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium">
              Page {currentPage} of {numPages}
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
        <div className="flex items-center justify-center min-h-full">
          {fileType === 'pdf' ? (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loading PDF...</p>
                </div>
              }
              error={
                <div className="text-red-600 dark:text-red-400 text-sm">
                  Failed to load PDF. Please try again.
                </div>
              }
            >
              <Page
                pageNumber={currentPage}
                scale={zoom}
                renderTextLayer={true}
                renderAnnotationLayer={true}
              />
            </Document>
          ) : fileType === 'image' && imageUrl ? (
            <img
              src={imageUrl}
              alt="Document preview"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                maxWidth: '100%',
                height: 'auto',
              }}
              className="transition-transform"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
