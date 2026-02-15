/**
 * Theme Toggle
 * Manual light/dark theme toggle button
 */

import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui'
import { useTheme } from './ThemeProvider'

interface ThemeToggleProps {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'icon'
}

export function ThemeToggle({ 
  variant = 'ghost', 
  size = 'icon' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      title={`${theme === 'light' ? 'Dark' : 'Light'} mode`}
      className="transition-colors duration-200"
    >
      {theme === 'light' ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  )
}
