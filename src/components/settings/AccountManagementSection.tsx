import { Lock, LogOut, Trash2 } from 'lucide-react'
import Card from '../ui/Card'

interface AccountManagementSectionProps {
  onChangePassword: () => void
  onLogout: () => void
  onDeleteAccount: () => void
}

function AccountManagementSection({
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: AccountManagementSectionProps) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-text-primary mb-3">Account Management</h2>

      <Card onClick={onChangePassword} className="bg-card mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="p-4 flex items-center gap-3">
          <Lock className="w-5 h-5 text-primary-500" />
          <div>
            <h3 className="font-medium text-text-primary">Change Password</h3>
            <p className="text-sm text-text-secondary">Update your password</p>
          </div>
        </div>
      </Card>

      <Card onClick={onLogout} className="bg-card mb-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="p-4 flex items-center gap-3">
          <LogOut className="w-5 h-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-700">Log Out</h3>
            <p className="text-sm text-text-secondary">Sign out of your account</p>
          </div>
        </div>
      </Card>

      <Card
        onClick={onDeleteAccount}
        className="bg-red-50 border-2 border-red-200 cursor-pointer hover:shadow-md transition-shadow"
      >
        <div className="p-4 flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-red-600" />
          <div>
            <h3 className="font-medium text-red-600">Delete Account</h3>
            <p className="text-sm text-red-500">Permanently delete your account and data</p>
          </div>
        </div>
      </Card>
    </section>
  )
}

export default AccountManagementSection

