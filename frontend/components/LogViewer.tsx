'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LogLevel } from '@/lib/logger';
import { X, Download, Trash2, Filter } from 'lucide-react';
import { downloadBlob } from '@/lib/utils';

interface LogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to log updates
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Load initial logs
    setLogs(logger.getLogs());

    return unsubscribe;
  }, [isOpen]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => filter === 'ALL' || log.level === filter);

  const exportLogs = (format: 'json' | 'txt') => {
    const blob = logger.exportLogs(format);
    downloadBlob(blob, `ocr-harness-logs-${Date.now()}.${format}`);
  };

  const clearLogs = () => {
    logger.clearLogs();
  };

  const getLevelColor = (level: LogLevel) => {
    const colors = {
      ERROR: 'text-red-600 dark:text-red-400',
      WARNING: 'text-yellow-600 dark:text-yellow-400',
      INFO: 'text-blue-600 dark:text-blue-400',
      DEBUG: 'text-gray-600 dark:text-gray-400',
    };
    return colors[level];
  };

  const getLevelBg = (level: LogLevel) => {
    const colors = {
      ERROR: 'bg-red-50 dark:bg-red-950',
      WARNING: 'bg-yellow-50 dark:bg-yellow-950',
      INFO: 'bg-blue-50 dark:bg-blue-950',
      DEBUG: 'bg-gray-50 dark:bg-gray-900',
    };
    return colors[level];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[700px] bg-white dark:bg-gray-800 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            System Logs
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogLevel | 'ALL')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="ALL">All Logs</option>
            <option value="ERROR">Errors</option>
            <option value="WARNING">Warnings</option>
            <option value="INFO">Info</option>
            <option value="DEBUG">Debug</option>
          </select>

          <button
            onClick={clearLogs}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={() => exportLogs('txt')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export TXT
          </button>

          <button
            onClick={() => exportLogs('json')}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>

        {/* Stats */}
        <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No logs to display</div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 ${getLevelBg(
                  log.level
                )}`}
              >
                <div className="flex items-start gap-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`font-semibold ${getLevelColor(log.level)}`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">
                    {log.component}
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-800 dark:text-gray-200">
                  {log.message}
                </div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                      View details
                    </summary>
                    <pre className="mt-2 text-xs overflow-x-auto bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="autoscroll"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="w-4 h-4"
          />
          <label
            htmlFor="autoscroll"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Auto-scroll to latest
          </label>
        </div>
      </div>
    </>
  );
};
