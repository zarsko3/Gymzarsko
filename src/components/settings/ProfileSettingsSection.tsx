import Card from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'

interface ProfileSettingsSectionProps {
  displayName: string
  fallbackName: string
  onDisplayNameChange: (value: string) => void
  onSave: () => void
  saving: boolean
  disableSave: boolean
}

function ProfileSettingsSection({
  displayName,
  fallbackName,
  onDisplayNameChange,
  onSave,
  saving,
  disableSave,
}: ProfileSettingsSectionProps) {
  const name = displayName || fallbackName
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2 px-1">Profile</h2>

      <Card className="bg-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 dark:text-primary-600 flex items-center justify-center text-lg font-semibold flex-shrink-0">
            {initial}
          </div>
          <p className="text-lg font-semibold text-[var(--text-primary)] truncate">{name}</p>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Display name"
              type="text"
              value={displayName}
              onChange={(e) => onDisplayNameChange(e.target.value)}
              placeholder="Your name"
              disabled={saving}
            />
          </div>
          {!disableSave && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
      </Card>
    </section>
  )
}

export default ProfileSettingsSection
