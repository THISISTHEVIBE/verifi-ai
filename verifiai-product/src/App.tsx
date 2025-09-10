import React, { useEffect, useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, XCircle, Upload, FileText, Search, BarChart3, Settings, User } from 'lucide-react'
import VerificationDashboard from './components/VerificationDashboard'
import DocumentUpload from './components/DocumentUpload'
import VerificationHistory from './components/VerificationHistory'
import Analytics from './components/Analytics'
import SignInPrompt from './components/SignInPrompt'
import { getSession, getSignOutUrl } from './services/authService'

type TabType = 'dashboard' | 'upload' | 'history' | 'analytics'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = await getSession()
      if (!cancelled) {
        setAuthenticated(!!s.authenticated)
        setUserName(s.user?.name || s.user?.email || null)
        setAuthChecked(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <VerificationDashboard />
      case 'upload':
        return <DocumentUpload />
      case 'history':
        return <VerificationHistory />
      case 'analytics':
        return <Analytics />
      default:
        return <VerificationDashboard />
    }
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-50" />
  }

  if (!authenticated) {
    return <SignInPrompt />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">VerifiAI</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">{userName || 'Signed in'}</span>
              <a href={getSignOutUrl()} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Sign out">
                <User className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
