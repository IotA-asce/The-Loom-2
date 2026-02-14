/**
 * Settings Screen
 * 
 * Main settings page with sections for providers, appearance, and data management.
 */

import React from 'react';
import { useConfigStore } from '@/stores/configStore';
import { usePreferencesStore, type ThemeMode } from '@/stores/preferencesStore';
import { ProviderConfigModal } from './provider-config-modal';
import { useUIStore } from '@/stores/uiStore';
import { db } from '@/lib/db/database';

/**
 * Settings screen component
 */
export const SettingsScreen: React.FC = () => {
  const { providers, activeProviderId } = useConfigStore();
  const { theme, setTheme, analysisSpeed, setAnalysisSpeed, reset: resetPreferences } = usePreferencesStore();
  const { openModal, activeModal } = useUIStore();
  const [selectedProviderId, setSelectedProviderId] = React.useState<string | null>(null);

  const handleOpenProviderConfig = (providerId: string) => {
    setSelectedProviderId(providerId);
    openModal('providerConfig');
  };

  const handleExportData = async () => {
    const data = await db.export();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loom2-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        await db.import(data.data, { clear: true });
        alert('Data imported successfully');
        window.location.reload();
      } catch (error) {
        alert('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    reader.readAsText(file);
  };

  const handleResetAll = () => {
    if (confirm('Reset all settings and data? This cannot be undone.')) {
      resetPreferences();
      localStorage.clear();
      db.reset().then(() => {
        window.location.reload();
      });
    }
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    marginTop: 0,
    marginBottom: '16px',
    color: '#111827',
  };

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6',
  };

  const settingLabelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  };

  const settingDescriptionStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  };

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#3b82f6',
    color: '#fff',
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: '#fff',
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px' }}>
        Settings
      </h1>

      {/* LLM Providers Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>LLM Providers</h2>
        
        {providers.map((provider) => (
          <div key={provider.id} style={settingRowStyle}>
            <div>
              <div style={settingLabelStyle}>
                {provider.name}
                {provider.id === activeProviderId && (
                  <span
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      backgroundColor: '#dbeafe',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                    }}
                  >
                    Active
                  </span>
                )}
                {provider.enabled && (
                  <span
                    style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      backgroundColor: '#d1fae5',
                      color: '#059669',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '4px',
                    }}
                  >
                    Enabled
                  </span>
                )}
              </div>
              <div style={settingDescriptionStyle}>
                Model: {provider.defaultModel}
              </div>
            </div>
            <button
              style={buttonStyle}
              onClick={() => handleOpenProviderConfig(provider.id)}
            >
              Configure
            </button>
          </div>
        ))}
      </div>

      {/* Appearance Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Appearance</h2>
        
        <div style={settingRowStyle}>
          <div>
            <div style={settingLabelStyle}>Theme</div>
            <div style={settingDescriptionStyle}>
              Choose your preferred color theme
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTheme(mode)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: theme === mode ? '#3b82f6' : '#f3f4f6',
                  color: theme === mode ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Analysis</h2>
        
        <div style={settingRowStyle}>
          <div>
            <div style={settingLabelStyle}>Analysis Speed</div>
            <div style={settingDescriptionStyle}>
              Balance between speed and thoroughness
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['fast', 'balanced', 'thorough'] as const).map((speed) => (
              <button
                key={speed}
                onClick={() => setAnalysisSpeed(speed)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: analysisSpeed === speed ? '#3b82f6' : '#f3f4f6',
                  color: analysisSpeed === speed ? '#fff' : '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>Data Management</h2>
        
        <div style={settingRowStyle}>
          <div>
            <div style={settingLabelStyle}>Export Data</div>
            <div style={settingDescriptionStyle}>
              Download a backup of all your data
            </div>
          </div>
          <button style={buttonStyle} onClick={handleExportData}>
            Export
          </button>
        </div>
        
        <div style={settingRowStyle}>
          <div>
            <div style={settingLabelStyle}>Import Data</div>
            <div style={settingDescriptionStyle}>
              Restore from a backup file
            </div>
          </div>
          <label style={{ ...primaryButtonStyle, display: 'inline-block' }}>
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              style={{ display: 'none' }}
            />
            Import
          </label>
        </div>
        
        <div style={{ ...settingRowStyle, borderBottom: 'none' }}>
          <div>
            <div style={settingLabelStyle}>Reset All</div>
            <div style={settingDescriptionStyle}>
              Clear all settings and data (cannot be undone)
            </div>
          </div>
          <button style={dangerButtonStyle} onClick={handleResetAll}>
            Reset All
          </button>
        </div>
      </div>

      {/* Modal */}
      {activeModal === 'providerConfig' && (
        <ProviderConfigModal
          providerId={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
        />
      )}
    </div>
  );
};

export default SettingsScreen;
