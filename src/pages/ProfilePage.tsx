import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical, User, Bell, Database, Info, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'

const settingsItems = [
  { icon: Bell, label: 'Notifications', description: 'Manage alerts' },
  { icon: Database, label: 'Data & Storage', description: 'Backup and sync' },
  { icon: Info, label: 'About', description: 'App info and version' },
]

function ProfilePage() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Failed to log out:', error)
    } finally {
      setLoading(false)
      setShowLogoutModal(false)
    }
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="sticky top-0 bg-[var(--bg-primary)] border-b border-border-primary z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Profile</h1>
          <button className="text-text-secondary hover:text-text-primary min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* User Profile Card */}
        <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200">
          <div className="flex items-center gap-4 p-2">
            <div className="w-20 h-20 bg-[var(--bg-primary)]-500 rounded-full flex items-center justify-center">
              <User size={40} className="text-white" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-text-primary">
                {currentUser?.email?.split('@')[0] || 'User'}
              </h3>
              <p className="text-text-secondary text-sm mt-1">
                {currentUser?.email || 'No email'}
              </p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs bg-card px-2 py-1 rounded-full text-primary-600 font-medium">
                  Free Plan
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-500">42</div>
            <div className="text-text-secondary text-xs mt-1">Workouts</div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-500">6</div>
            <div className="text-text-secondary text-xs mt-1">Weeks</div>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-primary-500">12k</div>
            <div className="text-text-secondary text-xs mt-1">Volume</div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary">Settings</h3>
          <div className="space-y-2">
            {settingsItems.map((item) => (
              <Card
                key={item.label}
                className="hover:shadow-md transition-shadow cursor-pointer bg-card"
              >
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-3">
                    <item.icon size={24} className="text-primary-500" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-medium text-text-primary">{item.label}</h4>
                      <p className="text-text-secondary text-sm">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-text-inactive" />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <Card 
          onClick={() => setShowLogoutModal(true)}
          className="border-2 border-red-200 bg-red-50 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3 p-2">
            <LogOut size={24} className="text-red-600" strokeWidth={1.5} />
            <div>
              <h4 className="font-medium text-red-600">Log Out</h4>
              <p className="text-red-500 text-sm">Sign out of your account</p>
            </div>
          </div>
        </Card>

        {/* App Info */}
        <div className="text-center pt-4 pb-6">
          <p className="text-text-secondary text-sm font-medium">Gymzarski v1.0.0</p>
          <p className="text-text-inactive text-xs mt-1">Built with React & Tailwind CSS</p>
          <p className="text-text-inactive text-xs mt-3">Made for fitness enthusiasts</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Log Out"
      >
        <p className="text-text-secondary mb-6">
          Are you sure you want to log out? You'll need to sign in again to access your workouts.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setShowLogoutModal(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handleLogout}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading ? 'Logging out...' : 'Log Out'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ProfilePage
