'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { OCRConfig } from '@/lib/types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: OCRConfig;
  onConfigChange: (config: OCRConfig) => void;
}

const defaultConfig: OCRConfig = {
  temperature: 0.2,
  top_p: 0.9,
  max_tokens: 6500,
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onConfigChange,
}) => {
  const [tempConfig, setTempConfig] = useState<OCRConfig>(currentConfig);

  useEffect(() => {
    setTempConfig(currentConfig);
  }, [currentConfig, isOpen]);

  const handleApply = () => {
    onConfigChange(tempConfig);
    onClose();
  };

  const handleReset = () => {
    setTempConfig(defaultConfig);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Model Configuration
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Temperature */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temperature
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tempConfig.temperature?.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tempConfig.temperature || 0.2}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    temperature: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Controls randomness. Lower values make output more focused and deterministic.
              </p>
            </div>

            {/* Top P */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Top P
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tempConfig.top_p?.toFixed(1)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tempConfig.top_p || 0.9}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    top_p: parseFloat(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Controls diversity via nucleus sampling.
              </p>
            </div>

            {/* Max Tokens */}
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Tokens
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {tempConfig.max_tokens}
                </span>
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={tempConfig.max_tokens || 6500}
                onChange={(e) =>
                  setTempConfig({
                    ...tempConfig,
                    max_tokens: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maximum length of the generated text.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
