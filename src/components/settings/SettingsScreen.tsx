/**
 * Settings Screen
 * Full-page settings view
 */

import { useState } from 'react'
import { SettingsPanel, SettingsData } from './SettingsPanel'
import { cn } from '@/lib/utils'

interface SettingsScreenProps {
  className?: string
}

const defaultSettings: SettingsData = {
  general: {
    autoSave: true,
    autoSaveInterval: 5,
    language: 'en',
  },
  llm: {
    providers: [],
    defaultProvider: '',
  },
  analysis: {
    quality: 'balanced',
    parallelJobs: 2,
    autoAnalyze: true,
  },
  appearance: {
    theme: 'system',
    accentColor: '#3b82f6',
    fontSize: 14,
    reduceMotion: false,
    highContrast: false,
  },
  data: {
    autoBackup: false,
    backupInterval: 24,
    storageLimit: 1024,
  },
}

export function SettingsScreen({ className }: SettingsScreenProps) {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingsChange = (newSettings: SettingsData) => {
    setSettings(newSettings)
    setHasChanges(true)
  }

  const handleSave = () => {
    // Save to localStorage or API
    localStorage.setItem('loom_settings', JSON.stringify(settings))
    setHasChanges(false)
  }

  return (
    <div className={cn('h-screen', className)}>
      <SettingsPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
        unsavedChanges={hasChanges}
        onSave={handleSave}
        className="h-full"
      />
    </div>
  )
}
