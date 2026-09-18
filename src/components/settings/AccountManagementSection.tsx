import { ChevronRight, Lock, LogOut, Trash2, type LucideIcon } from 'lucide-react'
import Card from '../ui/Card'

interface AccountManagementSectionProps {
  onChangePassword: () => void
  onLogout: () => void
  onDeleteAccount: () => void
}

interface RowProps {
  Icon: LucideIcon
  label: string
  onClick: () => void
  danger?: boolean
}

function Row({ Icon, label, onClick, danger = false }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 min-h-[52px] text-left hover:bg-[var(--bg-secondary)] transition-colors ${
        danger ? 'text-red-500' : 'text-[var(--text-primary)]'
      }`}
    >
      <Icon size={20} className={danger ? '' : 'text-[var(--text-secondary)]'} />
      <span className="flex-1 font-medium">{label}</span>
      {!danger && <ChevronRight size={18} className="text-[var(--text-inactive)]" />}
    </button>
  )
}

function AccountManagementSection({
  onChangePassword,
  onLogout,
  onDeleteAccount,
}: AccountManagementSectionProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-2 px-1">Account</h2>

      <Card className="bg-card p-0 overflow-hidden divide-y divide-[var(--border-primary)]">
        <Row Icon={Lock} label="Change password" onClick={onChangePassword} />
        <Row Icon={LogOut} label="Log out" onClick={onLogout} />
        <Row Icon={Trash2} label="Delete account" onClick={onDeleteAccount} danger />
      </Card>
    </section>
  )
}

export default AccountManagementSection
