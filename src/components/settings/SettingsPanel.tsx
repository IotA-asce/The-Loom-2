/**
 * Settings Panel
 * Comprehensive settings management
 */

import { useState } from 'react'
import { 
  Settings, Key, Palette, Database, Shield, 
  Zap, Search, Plus, Trash2, Check, AlertCircle,
  Moon, Sun, Monitor, Save, Download, Upload
} from 'lucide-react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export type SettingsCategory = 'general' | 'llm' | 'analysis' | 'appearance' | 'data' | 'advanced'

export interface LLMProvider {
  id: string
  name: string
  apiKey: string
  baseUrl?: string
  model: string
  isDefault: boolean
  status: 'connected' | 'disconnected' | 'testing'
}

export interface SettingsData {
  general: {
    autoSave: boolean
    autoSaveInterval: number
    language: string
  }
  llm: {
    providers: LLMProvider[]
    defaultProvider: string
  }
  analysis: {
    quality: 'fast' | 'balanced' | 'thorough'
    parallelJobs: number
    autoAnalyze: boolean
  }
  appearance: {
    theme: 'light' | 'dark' | 'system'
    accentColor: string
    fontSize: number
    reduceMotion: boolean
    highContrast: boolean
  }
  data: {
    autoBackup: boolean
    backupInterval: number
    storageLimit: number
  }
}

// ============================================================================
// Settings Panel
// ============================================================================

interface SettingsPanelProps {
  settings: SettingsData
  onSettingsChange: (settings: SettingsData) => void
  unsavedChanges: boolean
  onSave: () => void
  className?: string
}

export function SettingsPanel({
  settings,
  onSettingsChange,
  unsavedChanges,
  onSave,
  className,
}: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('general')
  const [searchQuery, setSearchQuery] = useState('')

  const categories: { id: SettingsCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'llm', label: 'LLM Providers', icon: <Key className="h-4 w-4" /> },
    { id: 'analysis', label: 'Analysis', icon: <Zap className="h-4 w-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="h-4 w-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="h-4 w-4" /> },
    { id: 'advanced', label: 'Advanced', icon: <Shield className="h-4 w-4" /> },
  ]

  return (
    <div className={cn('flex h-full', className)}>
      {/* Sidebar */}
      <div className="w-64 border-r bg-card flex-shrink-0">
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <nav className="p-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {categories.find(c => c.id === activeCategory)?.label}
          </h2>
          
          {unsavedChanges && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-600">Unsaved changes</span>
              <Button size="sm" onClick={onSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          )}
        </header>

        {/* Settings Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeCategory === 'general' && (
            <GeneralSettings settings={settings.general} onChange={(g) => onSettingsChange({ ...settings, general: g })} />
          )}
          {activeCategory === 'llm' && (
            <LLMSettings settings={settings.llm} onChange={(l) => onSettingsChange({ ...settings, llm: l })} />
          )}
          {activeCategory === 'analysis' && (
            <AnalysisSettings settings={settings.analysis} onChange={(a) => onSettingsChange({ ...settings, analysis: a })} />
          )}
          {activeCategory === 'appearance' && (
            <AppearanceSettings settings={settings.appearance} onChange={(a) => onSettingsChange({ ...settings, appearance: a })} />
          )}
          {activeCategory === 'data' && (
            <DataSettings settings={settings.data} onChange={(d) => onSettingsChange({ ...settings, data: d })} />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// General Settings
// ============================================================================

function GeneralSettings({ settings, onChange }: { settings: SettingsData['general']; onChange: (s: SettingsData['general']) => void }) {
  return (
    <div className="space-y-6 max-w-xl">
      <SettingGroup title="Auto Save">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoSave}
            onChange={(e) => onChange({ ...settings, autoSave: e.target.checked })}
            className="w-4 h-4"
          />
          <span>Enable auto-save</span>
        </label>
        {settings.autoSave && (
          <div className="mt-3 ml-7">
            <label className="text-sm text-muted-foreground">Interval (minutes)</label>
            <input
              type="number"
              value={settings.autoSaveInterval}
              onChange={(e) => onChange({ ...settings, autoSaveInterval: parseInt(e.target.value) })}
              className="w-24 mt-1 px-3 py-2 border rounded-lg"
              min={1}
              max={60}
            />
          </div>
        )}
      </SettingGroup>

      <SettingGroup title="Language">
        <select
          value={settings.language}
          onChange={(e) => onChange({ ...settings, language: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="en">English</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
          <option value="ko">Korean</option>
        </select>
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// LLM Settings
// ============================================================================

function LLMSettings({ settings, onChange }: { settings: SettingsData['llm']; onChange: (s: SettingsData['llm']) => void }) {
  const addProvider = () => {
    const newProvider: LLMProvider = {
      id: `provider-${Date.now()}`,
      name: 'New Provider',
      apiKey: '',
      model: '',
      isDefault: settings.providers.length === 0,
      status: 'disconnected',
    }
    onChange({ ...settings, providers: [...settings.providers, newProvider] })
  }

  const removeProvider = (id: string) => {
    onChange({ ...settings, providers: settings.providers.filter(p => p.id !== id) })
  }

  const testProvider = (id: string) => {
    // Simulate testing
    onChange({
      ...settings,
      providers: settings.providers.map(p =>
        p.id === id ? { ...p, status: 'testing' } : p
      ),
    })
    setTimeout(() => {
      onChange({
        ...settings,
        providers: settings.providers.map(p =>
          p.id === id ? { ...p, status: Math.random() > 0.3 ? 'connected' : 'disconnected' } : p
        ),
      })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">LLM Providers</h3>
        <Button size="sm" onClick={addProvider}>
          <Plus className="h-4 w-4 mr-1" />
          Add Provider
        </Button>
      </div>

      <div className="space-y-4">
        {settings.providers.map(provider => (
          <div key={provider.id} className="border rounded-xl p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={provider.name}
                  onChange={(e) => onChange({
                    ...settings,
                    providers: settings.providers.map(p =>
                      p.id === provider.id ? { ...p, name: e.target.value } : p
                    ),
                  })}
                  className="font-semibold bg-transparent border-none p-0 focus:ring-0"
                  placeholder="Provider Name"
                />
                <div className="flex items-center gap-2 mt-1">
                  {provider.status === 'connected' && (
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <Check className="h-3 w-3" /> Connected
                    </span>
                  )}
                  {provider.status === 'disconnected' && (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3 w-3" /> Disconnected
                    </span>
                  )}
                  {provider.status === 'testing' && (
                    <span className="text-xs text-muted-foreground">Testing...</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeProvider(provider.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">API Key</label>
                <input
                  type="password"
                  value={provider.apiKey}
                  onChange={(e) => onChange({
                    ...settings,
                    providers: settings.providers.map(p =>
                      p.id === provider.id ? { ...p, apiKey: e.target.value } : p
                    ),
                  })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="Enter API key"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Model</label>
                <input
                  type="text"
                  value={provider.model}
                  onChange={(e) => onChange({
                    ...settings,
                    providers: settings.providers.map(p =>
                      p.id === provider.id ? { ...p, model: e.target.value } : p
                    ),
                  })}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="e.g., gpt-4"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={provider.isDefault}
                    onChange={() => onChange({
                      ...settings,
                      providers: settings.providers.map(p => ({
                        ...p,
                        isDefault: p.id === provider.id,
                      })),
                    })}
                  />
                  <span className="text-sm">Default provider</span>
                </label>

                <Button variant="outline" size="sm" onClick={() => testProvider(provider.id)}>
                  Test Connection
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Analysis Settings
// ============================================================================

function AnalysisSettings({ settings, onChange }: { settings: SettingsData['analysis']; onChange: (s: SettingsData['analysis']) => void }) {
  return (
    <div className="space-y-6 max-w-xl">
      <SettingGroup title="Analysis Quality">
        <div className="space-y-2">
          {(['fast', 'balanced', 'thorough'] as const).map((quality) => (
            <label key={quality} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
              <input
                type="radio"
                name="quality"
                checked={settings.quality === quality}
                onChange={() => onChange({ ...settings, quality })}
              />
              <div>
                <p className="font-medium capitalize">{quality}</p>
                <p className="text-sm text-muted-foreground">
                  {quality === 'fast' && 'Quick analysis, basic results'}
                  {quality === 'balanced' && 'Good balance of speed and accuracy'}
                  {quality === 'thorough' && 'Deep analysis, most accurate results'}
                </p>
              </div>
            </label>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Auto Analysis">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoAnalyze}
            onChange={(e) => onChange({ ...settings, autoAnalyze: e.target.checked })}
          />
          <span>Automatically analyze uploaded manga</span>
        </label>
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// Appearance Settings
// ============================================================================

function AppearanceSettings({ settings, onChange }: { settings: SettingsData['appearance']; onChange: (s: SettingsData['appearance']) => void }) {
  return (
    <div className="space-y-6 max-w-xl">
      <SettingGroup title="Theme">
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((theme) => (
            <button
              key={theme}
              onClick={() => onChange({ ...settings, theme })}
              className={cn(
                'flex flex-col items-center gap-2 p-4 border rounded-xl transition-colors',
                settings.theme === theme ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
            >
              {theme === 'light' && <Sun className="h-6 w-6" />}
              {theme === 'dark' && <Moon className="h-6 w-6" />}
              {theme === 'system' && <Monitor className="h-6 w-6" />}
              <span className="text-sm capitalize">{theme}</span>
            </button>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="Accessibility">
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => onChange({ ...settings, reduceMotion: e.target.checked })}
            />
            <span>Reduce motion</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(e) => onChange({ ...settings, highContrast: e.target.checked })}
            />
            <span>High contrast</span>
          </label>
        </div>
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// Data Settings
// ============================================================================

function DataSettings({ settings, onChange }: { settings: SettingsData['data']; onChange: (s: SettingsData['data']) => void }) {
  return (
    <div className="space-y-6 max-w-xl">
      <SettingGroup title="Backup">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => onChange({ ...settings, autoBackup: e.target.checked })}
          />
          <span>Enable automatic backup</span>
        </label>
      </SettingGroup>

      <SettingGroup title="Data Management">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-1" />
            Export Data
          </Button>
          <Button variant="outline" className="flex-1">
            <Upload className="h-4 w-4 mr-1" />
            Import Data
          </Button>
        </div>
      </SettingGroup>
    </div>
  )
}

// ============================================================================
// Setting Group
// ============================================================================

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="font-medium">{title}</h3>
      {children}
    </div>
  )
}
