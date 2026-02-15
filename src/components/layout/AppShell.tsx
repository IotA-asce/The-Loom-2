/**
 * Application Shell
 * Top bar + sidebar navigation layout
 */

import { useState, useCallback } from 'react'
import { 
  Library, Upload, GitBranch, Settings, 
  Menu, X, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { Button } from '@/components/ui'
import { ThemeToggle } from './ThemeToggle'
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
}

interface AppShellProps {
  children: React.ReactNode
  activeView: string
  onNavigate: (viewId: string) => void
  title?: string
  actions?: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { id: 'library', label: 'Library', icon: <Library className="h-5 w-5" />, shortcut: '⌘1' },
  { id: 'upload', label: 'Upload', icon: <Upload className="h-5 w-5" />, shortcut: '⌘2' },
  { id: 'branches', label: 'Branches', icon: <GitBranch className="h-5 w-5" />, shortcut: '⌘3' },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" />, shortcut: '⌘4' },
]

export function AppShell({ 
  children, 
  activeView, 
  onNavigate, 
  title = 'The Loom',
  actions 
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = useCallback((id: string) => {
    onNavigate(id)
    setMobileMenuOpen(false)
  }, [onNavigate])

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside 
        className={`
          hidden md:flex flex-col border-r bg-card
          transition-all duration-300 ease-out
          ${sidebarCollapsed ? 'w-16' : 'w-64'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {!sidebarCollapsed && (
            <span className="text-xl font-semibold tracking-tight">
              {title}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200 ease-out
                ${activeView === item.id 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                ${sidebarCollapsed ? 'justify-center' : ''}
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-sm font-medium text-left">
                    {item.label}
                  </span>
                  {item.shortcut && (
                    <kbd className="text-xs opacity-60">
                      {item.shortcut}
                    </kbd>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t text-xs text-muted-foreground">
            <p>v2.0.0</p>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 h-full w-64 bg-card border-r z-50 md:hidden
          transition-transform duration-300 ease-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <span className="text-xl font-semibold">{title}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-colors duration-200
                ${activeView === item.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted'}
              `}
            >
              {item.icon}
              <span className="flex-1 text-left font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center justify-between h-16 px-4 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="text-lg font-medium capitalize">
              {NAV_ITEMS.find(i => i.id === activeView)?.label || activeView}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <KeyboardShortcutsHelp />
            <ThemeToggle />
            {actions}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
