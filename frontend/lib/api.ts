/**
 * API client for communicating with the backend
 */
import axios from 'axios';
import { logger } from './logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    logger.log('DEBUG', `API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      method: config.method,
      url: config.url,
    });
    return config;
  },
  (error) => {
    logger.log('ERROR', 'API Request failed', {
      error: error.message,
    });
    return Promise.reject(error);
  }
);

// Add response interceptor for logging
apiClient.interceptors.response.use(
  (response) => {
    logger.log('DEBUG', `API Response: ${response.status}`, {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    logger.log('ERROR', `API Error: ${error.message}`, {
      status: error.response?.status,
      url: error.config?.url,
      error: error.message,
    });
    return Promise.reject(error);
  }
);

export interface ProcessResponse {
  success: boolean;
  text?: string;
  metadata?: {
    filename: string;
    pages: number;
    processing_time: number;
    model_used: string;
  };
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  display_name: string;
  model_path: string;
  parameters?: Record<string, any>;
}

export interface ModelsResponse {
  current: ModelInfo;
  available: ModelInfo[];
}

export const api = {
  // Process document
  async processDocument(file: File, config?: Record<string, any>): Promise<ProcessResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (config) {
      formData.append('config', JSON.stringify(config));
    }

    const response = await apiClient.post('/api/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  // Get models
  async getModels(): Promise<ModelsResponse> {
    const response = await apiClient.get('/api/models');
    return response.data;
  },

  // Get current model
  async getCurrentModel(): Promise<ModelInfo> {
    const response = await apiClient.get('/api/models/current');
    return response.data;
  },

  // Switch model
  async switchModel(modelId: string): Promise<{ success: boolean; model: ModelInfo }> {
    const response = await apiClient.post(`/api/models/switch/${modelId}`);
    return response.data;
  },

  // Get logs
  async getLogs(params?: { session_id?: string; level?: string; limit?: number }) {
    const response = await apiClient.get('/api/logs', { params });
    return response.data;
  },

  // Export logs
  async exportLogs(format: 'json' | 'txt') {
    const response = await apiClient.get(`/api/logs/export`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  },

  // Clear logs
  async clearLogs() {
    const response = await apiClient.delete('/api/logs');
    return response.data;
  },

  // Health check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  },

  // Check vLLM health
  async checkVLLMHealth() {
    const response = await apiClient.get('/api/health/vllm');
    return response.data;
  },
};
