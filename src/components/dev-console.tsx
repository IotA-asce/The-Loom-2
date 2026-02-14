/**
 * Developer Console
 * 
 * Hidden developer console for debugging and diagnostics.
 * Activated by keyboard shortcut (Ctrl+Shift+D or Cmd+Shift+D).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { errorLogger, LogLevel, type LogEntry, getLogLevel, setLogLevel } from '@/lib/errors/logger';
import { db } from '@/lib/db/database';

/**
 * Developer Console component
 */
export const DevConsole: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogLevel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'db' | 'storage'>('logs');
  const [dbStats, setDbStats] = useState<{ manga: number; storylines: number; anchorEvents: number; branches: number; chapters: number; totalSize: number } | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const [logLevel, setLogLevelState] = useState<LogLevel>(getLogLevel());

  // Keyboard shortcut to open console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Subscribe to logs
  useEffect(() => {
    const unsubscribe = errorLogger.subscribe((entry) => {
      setLogs((prev) => [...prev, entry]);
    });

    // Load existing logs
    setLogs(errorLogger.getAll());

    return unsubscribe;
  }, []);

  // Load DB stats when tab changes
  useEffect(() => {
    if (isOpen && activeTab === 'db') {
      db.getStats().then(setDbStats);
    }
  }, [isOpen, activeTab]);

  // Auto-scroll to bottom
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = useCallback(() => {
    errorLogger.clear();
    setLogs([]);
  }, []);

  const exportLogs = useCallback(() => {
    const data = errorLogger.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loom2-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleLogLevelChange = (level: LogLevel) => {
    setLogLevel(level);
    setLogLevelState(level);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter !== null && log.level !== filter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        log.message.toLowerCase().includes(query) ||
        log.source?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const clearStorage = useCallback(() => {
    if (confirm('Clear all local storage? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  }, []);

  const resetDatabase = useCallback(async () => {
    if (confirm('Reset database? All data will be lost.')) {
      await db.reset();
      window.location.reload();
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '400px',
        backgroundColor: '#1a1a1a',
        color: '#e0e0e0',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        borderTop: '2px solid #444',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#2a2a2a',
          borderBottom: '1px solid #444',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <strong>Developer Console</strong>
          
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['logs', 'db', 'storage'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '4px 12px',
                  backgroundColor: activeTab === tab ? '#444' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#888',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {activeTab === 'logs' && (
          <>
            {/* Log controls */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '8px',
                alignItems: 'center',
              }}
            >
              <select
                value={logLevel}
                onChange={(e) => handleLogLevelChange(Number(e.target.value))}
                style={{
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #444',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                <option value={LogLevel.DEBUG}>DEBUG</option>
                <option value={LogLevel.INFO}>INFO</option>
                <option value={LogLevel.WARN}>WARN</option>
                <option value={LogLevel.ERROR}>ERROR</option>
                <option value={LogLevel.FATAL}>FATAL</option>
              </select>

              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #444',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              />

              <div style={{ display: 'flex', gap: '4px' }}>
                {(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] as const).map(
                  (level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setFilter(
                          filter === LogLevel[level]
                            ? null
                            : LogLevel[level]
                        )
                      }
                      style={{
                        padding: '4px 8px',
                        backgroundColor:
                          filter === LogLevel[level] ? '#444' : 'transparent',
                        color:
                          filter === LogLevel[level]
                            ? getLevelColor(LogLevel[level])
                            : '#888',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      {level}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={exportLogs}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Export
              </button>

              <button
                onClick={clearLogs}
                style={{
                  padding: '4px 12px',
                  backgroundColor: '#522',
                  color: '#fff',
                  border: '1px solid #644',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>

            {/* Log entries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: getLevelBgColor(log.level),
                    borderRadius: '2px',
                    fontFamily: 'monospace',
                  }}
                >
                  <span style={{ color: '#888' }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>{' '}
                  <span style={{ color: getLevelColor(log.level), fontWeight: 'bold' }}>
                    {log.levelName}
                  </span>{' '}
                  {log.source && (
                    <span style={{ color: '#666' }}>[{log.source}] </span>
                  )}
                  <span>{log.message}</span>
                  {log.error && (
                    <div style={{ color: '#f88', marginLeft: '16px', fontSize: '11px' }}>
                      {log.error.name}: {log.error.message}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </>
        )}

        {activeTab === 'db' && dbStats && (
          <div>
            <h3 style={{ marginTop: 0 }}>Database Statistics</h3>
            <table style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {Object.entries(dbStats).map(([key, value]) => (
                  <tr key={key}>
                    <td style={{ padding: '4px 16px 4px 0', color: '#888' }}>
                      {key}:
                    </td>
                    <td style={{ padding: '4px 0' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
              <button
                onClick={resetDatabase}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#522',
                  color: '#fff',
                  border: '1px solid #644',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Reset Database
              </button>
              <button
                onClick={() => db.export().then((data) => console.log(data))}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Export to Console
              </button>
            </div>
          </div>
        )}

        {activeTab === 'storage' && (
          <div>
            <h3 style={{ marginTop: 0 }}>Local Storage</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={clearStorage}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#522',
                  color: '#fff',
                  border: '1px solid #644',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Clear Storage
              </button>
            </div>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444' }}>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Key</th>
                  <th style={{ textAlign: 'left', padding: '8px' }}>Size</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(localStorage).map((key) => (
                  <tr key={key} style={{ borderBottom: '1px solid #333' }}>
                    <td style={{ padding: '4px 8px' }}>{key}</td>
                    <td style={{ padding: '4px 8px' }}>
                      {localStorage.getItem(key)?.length ?? 0} bytes
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Get color for log level
 */
function getLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return '#888';
    case LogLevel.INFO:
      return '#4a9eff';
    case LogLevel.WARN:
      return '#ffb84a';
    case LogLevel.ERROR:
      return '#ff4a4a';
    case LogLevel.FATAL:
      return '#ff0000';
    default:
      return '#888';
  }
}

/**
 * Get background color for log level
 */
function getLevelBgColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      return 'rgba(255, 74, 74, 0.1)';
    case LogLevel.WARN:
      return 'rgba(255, 184, 74, 0.1)';
    default:
      return 'transparent';
  }
}

export default DevConsole;
