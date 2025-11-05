import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { getUserProfile, updateUserProfile } from '../services/userProfileService'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  loading: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'gymzarsko-theme'

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { currentUser } = useAuth()
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize from localStorage immediately (for fast initial load)
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    return stored || 'light'
  })
  const [loading, setLoading] = useState(true)

  // Apply theme class to document element
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  // Load theme from Firestore when user is authenticated
  useEffect(() => {
    async function loadTheme() {
      if (!currentUser) {
        // If not logged in, use localStorage theme
        setLoading(false)
        return
      }

      try {
        const profile = await getUserProfile()
        if (profile?.theme) {
          setThemeState(profile.theme)
          localStorage.setItem(THEME_STORAGE_KEY, profile.theme)
        }
      } catch (error) {
        console.error('Error loading theme from profile:', error)
        // Fall back to localStorage
      } finally {
        setLoading(false)
      }
    }

    loadTheme()
  }, [currentUser])

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)

    // Sync with Firestore if user is logged in
    if (currentUser) {
      try {
        await updateUserProfile({ theme: newTheme })
      } catch (error) {
        console.error('Error saving theme to profile:', error)
        // Theme is still applied locally, just Firestore sync failed
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    loading,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

