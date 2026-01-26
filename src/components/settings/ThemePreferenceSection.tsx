import { Palette } from 'lucide-react'
import Card from '../ui/Card'

type ThemeOption = 'light' | 'dark'

interface ThemePreferenceSectionProps {
  theme: ThemeOption
  onThemeChange: (theme: ThemeOption) => void
}

function ThemePreferenceSection({ theme, onThemeChange }: ThemePreferenceSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-3">App Preferences</h2>

      <Card className="bg-card mb-3">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-primary-500" />
              <div>
                <h3 className="font-medium text-text-primary">Theme</h3>
                <p className="text-sm text-text-secondary">Choose your appearance</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onThemeChange('light')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                theme === 'light'
                  ? 'border-primary-500 bg-[var(--bg-primary)]-50 text-primary-700'
                  : 'border-border-primary text-text-secondary hover:border-border-primary'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange('dark')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                theme === 'dark'
                  ? 'border-primary-500 bg-[var(--bg-primary)]-50 text-primary-700'
                  : 'border-border-primary text-text-secondary hover:border-border-primary'
              }`}
            >
              Dark
            </button>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default ThemePreferenceSection

