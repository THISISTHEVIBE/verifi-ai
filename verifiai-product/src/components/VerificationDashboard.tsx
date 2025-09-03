import React from 'react'
import { Shield, CheckCircle, AlertTriangle, XCircle, Clock, TrendingUp, Users, FileText, Upload, BarChart3 } from 'lucide-react'

const VerificationDashboard: React.FC = () => {
  const stats = [
    {
      title: 'Total Verifications',
      value: '1,234',
      change: '+12%',
      changeType: 'positive',
      icon: Shield,
      color: 'bg-primary-500'
    },
    {
      title: 'Successful',
      value: '1,156',
      change: '+8%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'bg-success-500'
    },
    {
      title: 'Pending',
      value: '45',
      change: '-5%',
      changeType: 'negative',
      icon: Clock,
      color: 'bg-warning-500'
    },
    {
      title: 'Failed',
      value: '33',
      change: '-2%',
      changeType: 'negative',
      icon: XCircle,
      color: 'bg-error-500'
    }
  ]

  const recentVerifications = [
    {
      id: 'VER-001',
      document: 'Passport Verification',
      status: 'success',
      user: 'John Doe',
      timestamp: '2 minutes ago',
      confidence: 98.5
    },
    {
      id: 'VER-002',
      document: 'ID Card Verification',
      status: 'pending',
      user: 'Jane Smith',
      timestamp: '5 minutes ago',
      confidence: null
    },
    {
      id: 'VER-003',
      document: 'Driver License',
      status: 'failed',
      user: 'Mike Johnson',
      timestamp: '10 minutes ago',
      confidence: 45.2
    },
    {
      id: 'VER-004',
      document: 'Utility Bill',
      status: 'success',
      user: 'Sarah Wilson',
      timestamp: '15 minutes ago',
      confidence: 96.8
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success-600 bg-success-50 border-success-200'
      case 'pending':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'failed':
        return 'text-error-600 bg-error-50 border-error-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'failed':
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome back!</h2>
        <p className="text-primary-100">Your verification system is running smoothly. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-success-600' : 'text-error-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Verifications */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Verifications</h3>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View all
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Document</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Confidence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentVerifications.map((verification) => (
                <tr key={verification.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{verification.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{verification.document}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{verification.user}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(verification.status)}`}>
                      {getStatusIcon(verification.status)}
                      <span className="ml-1 capitalize">{verification.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {verification.confidence ? `${verification.confidence}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{verification.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-primary-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Upload Document</h4>
          <p className="text-sm text-gray-600">Verify a new document instantly</p>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-6 h-6 text-success-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">View Analytics</h4>
          <p className="text-sm text-gray-600">Check your verification metrics</p>
        </div>
        
        <div className="card text-center hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-warning-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">View History</h4>
          <p className="text-sm text-gray-600">Browse past verifications</p>
        </div>
      </div>
    </div>
  )
}

export default VerificationDashboard
