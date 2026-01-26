import { User } from 'lucide-react'
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
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-3">Profile Settings</h2>

      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 mb-3">
        <div className="p-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-primary)]-500 flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-text-primary truncate">
              {displayName || fallbackName}
            </h3>
          </div>
        </div>
      </Card>

      <Card className="bg-card mb-3">
        <div className="p-4 space-y-3">
          <Input
            label="Display Name"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            placeholder="Your name"
            disabled={saving}
          />
          <Button onClick={onSave} disabled={disableSave}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </Card>
    </section>
  )
}

export default ProfileSettingsSection

