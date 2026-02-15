/**
 * Keyboard Shortcuts Help
 * Display available keyboard shortcuts
 */

import { useState, useMemo } from 'react'
import { Keyboard, X } from 'lucide-react'
import { Button } from '@/components/ui'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui'
import { COMMON_SHORTCUTS, formatShortcut, getPlatformModifier } from '@/hooks/useKeyboardShortcuts'

interface ShortcutGroup {
  name: string
  shortcuts: Array<{
    key: string
    modifier?: string | string[]
    description: string
  }>
}

export function useShortcutGroups(): ShortcutGroup[] {
  const mod = getPlatformModifier()
  const modSymbol = mod === 'meta' ? '⌘' : 'Ctrl'

  return useMemo(() => [
    {
      name: 'Navigation',
      shortcuts: [
        { ...COMMON_SHORTCUTS.GO_TO_LIBRARY, modifier: mod },
        { ...COMMON_SHORTCUTS.GO_TO_UPLOAD, modifier: mod },
        { ...COMMON_SHORTCUTS.GO_TO_BRANCHES, modifier: mod },
        { ...COMMON_SHORTCUTS.GO_TO_SETTINGS, modifier: mod },
      ],
    },
    {
      name: 'Actions',
      shortcuts: [
        { ...COMMON_SHORTCUTS.NEW_UPLOAD, modifier: mod },
        { ...COMMON_SHORTCUTS.SEARCH, modifier: mod },
        { ...COMMON_SHORTCUTS.SAVE, modifier: mod },
        COMMON_SHORTCUTS.CLOSE,
      ],
    },
    {
      name: 'Reader',
      shortcuts: [
        COMMON_SHORTCUTS.NEXT_CHAPTER,
        COMMON_SHORTCUTS.PREV_CHAPTER,
        COMMON_SHORTCUTS.SCROLL_DOWN,
      ],
    },
    {
      name: 'Theme',
      shortcuts: [
        { ...COMMON_SHORTCUTS.TOGGLE_THEME, modifier: [mod, 'shift'] },
      ],
    },
  ], [mod])
}

interface KeyboardShortcutsHelpProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function KeyboardShortcutsHelp({ 
  open: controlledOpen, 
  onOpenChange 
}: KeyboardShortcutsHelpProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  
  const groups = useShortcutGroups()

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts"
        aria-label="Keyboard shortcuts"
      >
        <Keyboard className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {groups.map(group => (
              <div key={group.name}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {group.name}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-background rounded border">
                        {formatShortcut(shortcut.key, shortcut.modifier)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground mt-4 pt-4 border-t">
            <p>Tip: Press <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> from anywhere to open this help.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook to handle '?' key for opening shortcuts
export function useShortcutsHelpKey(onOpen: () => void) {
  // This would be implemented with useKeyboardShortcuts
  // when integrated into the app shell
}
