import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  User,
  Mail,
  Palette,
  Bell,
  Globe,
  Lock,
  Trash2,
  LogOut,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import {
  getUserProfile,
  updateDisplayName,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} from '../services/userProfileService'
import type { UserProfile } from '../types'

function SettingsPage() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { theme, setTheme } = useTheme()

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form states
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [notifications, setNotifications] = useState({
    workoutReminders: true,
    progressUpdates: true,
    emailNotifications: false,
  })
  const [language, setLanguage] = useState<'en' | 'es' | 'he'>('en')

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Delete account form
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  // Load user profile
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true)
        const userProfile = await getUserProfile()
        if (userProfile) {
          setProfile(userProfile)
          setDisplayName(userProfile.displayName)
          setEmail(userProfile.email)
          // Theme is managed by ThemeContext, no need to set it here
          setNotifications(userProfile.notifications)
          setLanguage(userProfile.language)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        showMessage('error', 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Show message helper
  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Handle display name update
  async function handleUpdateDisplayName() {
    if (!displayName.trim()) {
      showMessage('error', 'Display name cannot be empty')
      return
    }

    try {
      setSaving(true)
      await updateDisplayName(displayName)
      showMessage('success', 'Display name updated successfully')
    } catch (error) {
      console.error('Error updating display name:', error)
      showMessage('error', 'Failed to update display name')
    } finally {
      setSaving(false)
    }
  }

  // Handle theme change
  function handleThemeChange(newTheme: 'light' | 'dark') {
    setTheme(newTheme)
    // ThemeContext handles persistence to Firestore automatically
  }

  // Handle notification preferences
  async function handleNotificationChange(key: keyof typeof notifications, value: boolean) {
    try {
      const updated = { ...notifications, [key]: value }
      setNotifications(updated)
      await updateUserProfile({ notifications: updated })
      showMessage('success', 'Notification preferences saved')
    } catch (error) {
      console.error('Error updating notifications:', error)
      showMessage('error', 'Failed to save preferences')
    }
  }

  // Handle language change
  async function handleLanguageChange(newLanguage: 'en' | 'es' | 'he') {
    try {
      setLanguage(newLanguage)
      await updateUserProfile({ language: newLanguage })
      showMessage('success', 'Language preference saved')
    } catch (error) {
      console.error('Error updating language:', error)
      showMessage('error', 'Failed to save language')
    }
  }

  // Handle password change
  async function handlePasswordChange() {
    setPasswordError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      setSaving(true)
      await changePassword(currentPassword, newPassword)
      showMessage('success', 'Password changed successfully')
      setShowPasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('Error changing password:', error)
      setPasswordError(error.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  // Handle account deletion
  async function handleDeleteAccount() {
    setDeleteError('')

    if (!deletePassword) {
      setDeleteError('Password is required')
      return
    }

    try {
      setSaving(true)
      await deleteUserAccount(deletePassword)
      showMessage('success', 'Account deleted successfully')
      navigate('/login')
    } catch (error: any) {
      console.error('Error deleting account:', error)
      setDeleteError(error.message || 'Failed to delete account')
      setSaving(false)
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      showMessage('error', 'Failed to log out')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-primary">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border-primary z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-primary-500 font-medium min-h-[44px] min-w-[44px] justify-center"
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold text-primary-600">Settings</h1>
          <div className="w-[80px]" /> {/* Spacer for alignment */}
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`max-w-2xl mx-auto mt-4 mx-4 p-4 rounded-lg flex items-start gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Settings */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Profile Settings</h2>

          {/* User Info Card */}
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 mb-3">
            <div className="p-6 flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-text-primary truncate">
                  {displayName || currentUser?.email?.split('@')[0] || 'User'}
                </h3>
                <p className="text-text-secondary text-sm mt-1 truncate">
                  {email || currentUser?.email || 'No email'}
                </p>
              </div>
            </div>
          </Card>

          {/* Display Name */}
          <Card className="bg-card mb-3">
            <div className="p-4">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Display Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Your name"
                  disabled={saving}
                />
                <Button
                  onClick={handleUpdateDisplayName}
                  disabled={saving || displayName === profile?.displayName}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Email (Read-only for now) */}
          <Card className="bg-card">
            <div className="p-4">
              <label className="block text-sm font-medium text-text-primary mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border border-border-primary rounded-lg bg-secondary text-text-secondary"
              />
              <p className="text-xs text-text-secondary mt-2">
                Contact support to change your email address
              </p>
            </div>
          </Card>
        </section>

        {/* App Preferences */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">App Preferences</h2>

          {/* Theme Toggle */}
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
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    theme === 'light'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border-primary text-text-secondary hover:border-border-primary'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    theme === 'dark'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border-primary text-text-secondary hover:border-border-primary'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card className="bg-card mb-3">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary-500" />
                <h3 className="font-medium text-text-primary">Notifications</h3>
              </div>

              {/* Workout Reminders */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Workout Reminders</p>
                  <p className="text-xs text-text-secondary">Get notified to log workouts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.workoutReminders}
                    onChange={(e) =>
                      handleNotificationChange('workoutReminders', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Progress Updates */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Progress Updates</p>
                  <p className="text-xs text-text-secondary">Weekly progress summaries</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.progressUpdates}
                    onChange={(e) =>
                      handleNotificationChange('progressUpdates', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">Email Notifications</p>
                  <p className="text-xs text-text-secondary">Receive updates via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications.emailNotifications}
                    onChange={(e) =>
                      handleNotificationChange('emailNotifications', e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border-primary after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Language */}
          <Card className="bg-card">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-5 h-5 text-primary-500" />
                <div>
                  <h3 className="font-medium text-text-primary">Language</h3>
                  <p className="text-sm text-text-secondary">Choose your language</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    language === 'en'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border-primary text-text-secondary hover:border-border-primary'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('es')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    language === 'es'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border-primary text-text-secondary hover:border-border-primary'
                  }`}
                >
                  Español
                </button>
                <button
                  onClick={() => handleLanguageChange('he')}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                    language === 'he'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border-primary text-text-secondary hover:border-border-primary'
                  }`}
                >
                  עברית
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Note: Localization coming soon
              </p>
            </div>
          </Card>
        </section>

        {/* Account Management */}
        <section>
          <h2 className="text-lg font-semibold text-text-primary mb-3">Account Management</h2>

          {/* Change Password */}
          <Card
            onClick={() => setShowPasswordModal(true)}
            className="bg-card mb-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="p-4 flex items-center gap-3">
              <Lock className="w-5 h-5 text-primary-500" />
              <div>
                <h3 className="font-medium text-text-primary">Change Password</h3>
                <p className="text-sm text-text-secondary">Update your password</p>
              </div>
            </div>
          </Card>

          {/* Logout */}
          <Card
            onClick={() => setShowLogoutModal(true)}
            className="bg-card mb-3 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="p-4 flex items-center gap-3">
              <LogOut className="w-5 h-5 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-700">Log Out</h3>
                <p className="text-sm text-text-secondary">Sign out of your account</p>
              </div>
            </div>
          </Card>

          {/* Delete Account */}
          <Card
            onClick={() => setShowDeleteModal(true)}
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

        {/* App Info */}
        <div className="text-center pt-4 pb-6">
          <p className="text-text-secondary text-sm font-medium">Gymzarsko v1.0.0</p>
          <p className="text-text-inactive text-xs mt-1">Built with React, Tailwind & Firebase</p>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false)
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          setPasswordError('')
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter current password"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter new password"
              disabled={saving}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Confirm new password"
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowPasswordModal(false)
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setPasswordError('')
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handlePasswordChange} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
            </Button>
          </div>
        </div>
      </Modal>

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
          <Button variant="secondary" fullWidth onClick={() => setShowLogoutModal(false)}>
            Cancel
          </Button>
          <Button fullWidth onClick={handleLogout} className="bg-yellow-500 hover:bg-yellow-600">
            Log Out
          </Button>
        </div>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setDeletePassword('')
          setDeleteError('')
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium mb-2">⚠️ Warning: This action cannot be undone!</p>
            <p className="text-sm text-red-600">
              All your workouts, progress data, and profile information will be permanently deleted.
            </p>
          </div>

          {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{deleteError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter your password"
              disabled={saving}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowDeleteModal(false)
                setDeletePassword('')
                setDeleteError('')
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              onClick={handleDeleteAccount}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsPage

