"use client"

import { useState } from "react"
import { User, Shield, Key, Globe, Moon, Sun, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import styles from "@/styles/settings.module.css"

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [language, setLanguage] = useState("english")
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveSettings = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
      // Show success message
      alert("Settings saved successfully")
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 antialiased">
      <PageHeader title="Settings" showBackButton={true} backUrl="/dashboard" />
      <div className={`container py-8 ${styles.settingsContainer}`}>
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Account Settings</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Manage your account preferences and settings</p>
        </div>

        <div className={`${styles.settingsCard} dark:bg-gray-800 dark:border-gray-700`}>
          <div className={`${styles.settingsHeader} dark:border-gray-700`}>
            <h2 className={`${styles.settingsTitle} dark:text-gray-100`}>Profile Information</h2>
            <p className={`${styles.settingsDescription} dark:text-gray-400`}>
              Update your personal information and profile settings
            </p>
          </div>
          <div className={styles.settingsContent}>
            <div className={styles.profileSection}>
              <div className={styles.profileAvatar}>
                <User className="h-10 w-10 text-gray-400" />
              </div>
              <div className={styles.profileInfo}>
                <h3 className={`${styles.profileName} dark:text-gray-100`}>Mark Johnson</h3>
                <p className={`${styles.profileEmail} dark:text-gray-400`}>mark.johnson@example.com</p>
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                  Change Avatar
                </Button>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={`${styles.settingsSectionTitle} dark:text-gray-100 dark:border-gray-700`}>
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                    defaultValue="Mark"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                    defaultValue="Johnson"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                    defaultValue="mark.johnson@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                    defaultValue="(555) 123-4567"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.settingsCard} mt-6 dark:bg-gray-800 dark:border-gray-700`}>
          <div className={`${styles.settingsHeader} dark:border-gray-700`}>
            <h2 className={`${styles.settingsTitle} dark:text-gray-100`}>Preferences</h2>
            <p className={`${styles.settingsDescription} dark:text-gray-400`}>Customize your application experience</p>
          </div>
          <div className={styles.settingsContent}>
            <div className={styles.settingsSection}>
              <h3 className={`${styles.settingsSectionTitle} dark:text-gray-100 dark:border-gray-700`}>Appearance</h3>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>Dark Mode</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Switch between light and dark theme
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <Switch
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <span className="ml-2 dark:text-gray-300">
                    {darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  </span>
                </div>
              </div>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>Language</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Select your preferred language
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-md"
                  >
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                  </select>
                  <Globe className="ml-2 h-4 w-4 dark:text-gray-300" />
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={`${styles.settingsSectionTitle} dark:text-gray-100 dark:border-gray-700`}>
                Notifications
              </h3>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>Email Notifications</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Receive updates and reminders via email
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>SMS Notifications</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Receive updates and reminders via text message
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <Switch
                    checked={smsNotifications}
                    onCheckedChange={setSmsNotifications}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className={styles.settingsSection}>
              <h3 className={`${styles.settingsSectionTitle} dark:text-gray-100 dark:border-gray-700`}>Security</h3>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>Two-Factor Authentication</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Add an extra layer of security to your account
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <Switch
                    checked={twoFactorAuth}
                    onCheckedChange={setTwoFactorAuth}
                    className="data-[state=checked]:bg-blue-600"
                  />
                  <Shield className="ml-2 h-4 w-4 dark:text-gray-300" />
                </div>
              </div>
              <div className={`${styles.settingsRow} dark:border-gray-700`}>
                <div>
                  <div className={`${styles.settingsLabel} dark:text-gray-300`}>API Keys</div>
                  <div className={`${styles.settingsDescription} dark:text-gray-400`}>
                    Manage your API keys for third-party integrations
                  </div>
                </div>
                <div className={styles.settingsControl}>
                  <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                    <Key className="mr-2 h-4 w-4" />
                    Manage Keys
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className={`${styles.settingsFooter} dark:bg-gray-700 dark:border-gray-600`}>
            <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={isSaving} variant="contrast">
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
