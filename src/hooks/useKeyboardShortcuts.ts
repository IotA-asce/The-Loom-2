/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcut management
 */

import { useEffect, useCallback, useRef } from 'react'

export interface Shortcut {
  key: string
  modifier?: 'ctrl' | 'alt' | 'shift' | 'meta' | ('ctrl' | 'alt' | 'shift' | 'meta')[]
  action: () => void
  description: string
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts)
  
  // Keep ref updated
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const shortcut of shortcutsRef.current) {
      if (matchesShortcut(event, shortcut)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        shortcut.action()
        break
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  // Check key
  if (event.key.toLowerCase() !== shortcut.key.toLowerCase()) {
    return false
  }

  // Check modifiers
  const modifiers = Array.isArray(shortcut.modifier) 
    ? shortcut.modifier 
    : shortcut.modifier ? [shortcut.modifier] : []

  const modifierChecks = {
    ctrl: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  }

  // All required modifiers must be pressed
  for (const mod of modifiers) {
    if (!modifierChecks[mod]) {
      return false
    }
  }

  // No extra modifiers should be pressed
  const allModifiers = ['ctrl', 'alt', 'shift', 'meta'] as const
  for (const mod of allModifiers) {
    if (!modifiers.includes(mod) && modifierChecks[mod]) {
      return false
    }
  }

  return true
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  // Navigation
  GO_TO_LIBRARY: { key: '1', modifier: 'meta', description: 'Go to Library' },
  GO_TO_UPLOAD: { key: '2', modifier: 'meta', description: 'Go to Upload' },
  GO_TO_BRANCHES: { key: '3', modifier: 'meta', description: 'Go to Branches' },
  GO_TO_SETTINGS: { key: '4', modifier: 'meta', description: 'Go to Settings' },
  
  // Actions
  NEW_UPLOAD: { key: 'u', modifier: 'meta', description: 'New Upload' },
  SEARCH: { key: 'k', modifier: 'meta', description: 'Search' },
  CLOSE: { key: 'Escape', description: 'Close/Cancel' },
  SAVE: { key: 's', modifier: 'meta', description: 'Save' },
  
  // Theme
  TOGGLE_THEME: { key: 't', modifier: ['meta', 'shift'], description: 'Toggle Theme' },
  
  // Reader
  NEXT_CHAPTER: { key: 'ArrowRight', description: 'Next Chapter' },
  PREV_CHAPTER: { key: 'ArrowLeft', description: 'Previous Chapter' },
  SCROLL_DOWN: { key: ' ', description: 'Scroll Down' },
  SCROLL_UP: { key: 'shift', modifier: 'shift', description: 'Scroll Up (with Space)' },
} as const

// Format shortcut for display
export function formatShortcut(key: string, modifier?: string | string[]): string {
  const modifiers = Array.isArray(modifier) ? modifier : modifier ? [modifier] : []
  
  const modifierSymbols: Record<string, string> = {
    ctrl: '⌃',
    alt: '⌥',
    shift: '⇧',
    meta: '⌘',
  }

  const parts = modifiers.map(m => modifierSymbols[m] || m)
  parts.push(key)

  return parts.join('')
}

// Get platform-specific modifier
export function getPlatformModifier(): 'ctrl' | 'meta' {
  if (typeof navigator === 'undefined') return 'ctrl'
  return navigator.platform.includes('Mac') ? 'meta' : 'ctrl'
}
