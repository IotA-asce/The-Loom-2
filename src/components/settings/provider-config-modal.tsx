/**
 * Provider Configuration Modal
 * 
 * Modal for configuring LLM provider settings including API key,
 * model selection, and connection testing.
 */

import React, { useState, useCallback } from 'react';
import { useConfigStore } from '@/stores/configStore';
import { SecureInput } from '@/components/ui/secure-input';
import { LLMProviderFactory } from '@/lib/llm/factory';

/**
 * Provider config modal props
 */
interface ProviderConfigModalProps {
  providerId: string | null;
  onClose: () => void;
}

/**
 * Provider config modal component
 */
export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  providerId,
  onClose,
}) => {
  const { providers, updateProvider, setActiveProvider, getDecryptedApiKey } = useConfigStore();
  const provider = providers.find((p) => p.id === providerId);

  const [apiKey, setApiKey] = useState(provider ? getDecryptedApiKey(provider.id) || '' : '');
  const [selectedModel, setSelectedModel] = useState(provider?.defaultModel ?? '');
  const [temperature, setTemperature] = useState(provider?.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(provider?.maxTokens ?? 4096);
  const [timeout, setTimeout] = useState((provider?.timeoutMs ?? 60000) / 1000);
  const [enabled, setEnabled] = useState(provider?.enabled ?? true);
  
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const handleSave = useCallback(() => {
    if (!provider) return;

    updateProvider(provider.id, {
      apiKey,
      defaultModel: selectedModel,
      temperature,
      maxTokens,
      timeoutMs: timeout * 1000,
      enabled,
    });

    onClose();
  }, [apiKey, selectedModel, temperature, maxTokens, timeout, enabled, provider, updateProvider, onClose]);

  const handleTestConnection = useCallback(async () => {
    if (!provider) return;

    setTestStatus('testing');
    setTestMessage('Testing connection...');

    try {
      // Create a temporary provider with current settings
      const testProvider = LLMProviderFactory.create({
        ...provider,
        apiKey,
        defaultModel: selectedModel,
      });

      const result = await testProvider.validateConfig();

      if (result.valid) {
        setTestStatus('success');
        setTestMessage('Connection successful!');
      } else {
        setTestStatus('error');
        setTestMessage(result.error || 'Connection failed');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [provider, apiKey, selectedModel]);

  const handleSetActive = useCallback(() => {
    if (!provider) return;
    setActiveProvider(provider.id);
  }, [provider, setActiveProvider]);

  if (!provider) return null;

  const isActive = provider.id === useConfigStore.getState().activeProviderId;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              {provider.name}
            </h2>
            {isActive && (
              <span
                style={{
                  fontSize: '12px',
                  color: '#10b981',
                  fontWeight: 500,
                }}
              >
                Active Provider
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Enabled toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Enabled</span>
            <label
              style={{
                position: 'relative',
                display: 'inline-block',
                width: '44px',
                height: '24px',
              }}
            >
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span
                style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  backgroundColor: enabled ? '#3b82f6' : '#d1d5db',
                  borderRadius: '24px',
                  transition: 'background-color 0.2s',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: enabled ? '24px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: 'left 0.2s',
                  }}
                />
              </span>
            </label>
          </div>

          {/* API Key */}
          <div style={{ marginBottom: '20px' }}>
            <SecureInput
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              helperText={apiKey ? 'Key is set' : 'API key is required'}
            />
          </div>

          {/* Model Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: '#fff',
              }}
            >
              {provider.availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Temperature
              <span>{temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Max Tokens */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Max Tokens
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              min={1}
              max={32768}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
              }}
            />
          </div>

          {/* Timeout */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                fontWeight: 500,
                color: '#374151',
                marginBottom: '4px',
              }}
            >
              Timeout (seconds)
              <span>{timeout}s</span>
            </label>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={timeout}
              onChange={(e) => setTimeout(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Test Connection */}
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !apiKey}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: testStatus === 'success' ? '#10b981' : testStatus === 'error' ? '#ef4444' : '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: !apiKey ? 'not-allowed' : 'pointer',
                opacity: !apiKey ? 0.5 : 1,
              }}
            >
              {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>
            {testMessage && (
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: testStatus === 'success' ? '#10b981' : testStatus === 'error' ? '#ef4444' : '#6b7280',
                }}
              >
                {testMessage}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {!isActive && enabled && (
            <button
              onClick={handleSetActive}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Set as Active
            </button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey}
              style={{
                padding: '10px 16px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: !apiKey ? 'not-allowed' : 'pointer',
                opacity: !apiKey ? 0.5 : 1,
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderConfigModal;
