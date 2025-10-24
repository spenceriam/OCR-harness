/**
 * TypeScript type definitions
 */

export interface OCRConfig {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export interface OCRResult {
  text: string;
  metadata?: {
    filename: string;
    pages: number;
    processing_time: number;
    model_used: string;
  };
}

export interface ModelConfig {
  id: string;
  name: string;
  display_name: string;
  model_path: string;
  parameters?: {
    temperature: number;
    top_p: number;
    max_tokens: number;
    render_dpi: number;
    max_dimension: number;
  };
}

export interface UploadedFile {
  file: File;
  preview?: string;
  type: 'pdf' | 'image';
}
