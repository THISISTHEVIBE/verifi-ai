import React, { useState, useMemo } from 'react'
import { Search, Filter, Download, Eye, Calendar, User, FileText, CheckCircle, XCircle, Clock } from 'lucide-react'

interface VerificationRecord {
  id: string
  document: string
  user: string
  status: 'success' | 'pending' | 'failed'
  confidence: number | null
  timestamp: string
  documentType: string
  fileSize: string
  processingTime: string
}

const VerificationHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('timestamp')

  // Mock data for verification history
  const verificationRecords: VerificationRecord[] = [
    {
      id: 'VER-001',
      document: 'passport_john_doe.pdf',
      user: 'John Doe',
      status: 'success',
      confidence: 98.5,
      timestamp: '2024-01-15T10:30:00Z',
      documentType: 'Identity Document',
      fileSize: '2.3 MB',
      processingTime: '2.3s'
    },
    {
      id: 'VER-002',
      document: 'id_card_jane_smith.jpg',
      user: 'Jane Smith',
      status: 'success',
      confidence: 96.2,
      timestamp: '2024-01-15T09:15:00Z',
      documentType: 'Identity Document',
      fileSize: '1.8 MB',
      processingTime: '1.9s'
    },
    {
      id: 'VER-003',
      document: 'driver_license_mike.pdf',
      user: 'Mike Johnson',
      status: 'failed',
      confidence: 45.2,
      timestamp: '2024-01-15T08:45:00Z',
      documentType: 'Identity Document',
      fileSize: '3.1 MB',
      processingTime: '2.1s'
    },
    {
      id: 'VER-004',
      document: 'utility_bill_sarah.pdf',
      user: 'Sarah Wilson',
      status: 'success',
      confidence: 94.8,
      timestamp: '2024-01-14T16:20:00Z',
      documentType: 'Financial Document',
      fileSize: '1.2 MB',
      processingTime: '1.7s'
    },
    {
      id: 'VER-005',
      document: 'bank_statement_robert.pdf',
      user: 'Robert Brown',
      status: 'pending',
      confidence: null,
      timestamp: '2024-01-14T15:10:00Z',
      documentType: 'Financial Document',
      fileSize: '4.2 MB',
      processingTime: 'Processing...'
    },
    {
      id: 'VER-006',
      document: 'diploma_emma.pdf',
      user: 'Emma Davis',
      status: 'success',
      confidence: 99.1,
      timestamp: '2024-01-14T14:30:00Z',
      documentType: 'Academic Document',
      fileSize: '2.8 MB',
      processingTime: '2.5s'
    },
    {
      id: 'VER-007',
      document: 'contract_company_abc.pdf',
      user: 'ABC Company',
      status: 'success',
      confidence: 97.3,
      timestamp: '2024-01-14T13:45:00Z',
      documentType: 'Business Document',
      fileSize: '5.6 MB',
      processingTime: '3.2s'
    },
    {
      id: 'VER-008',
      document: 'certificate_tom.jpg',
      user: 'Tom Anderson',
      status: 'failed',
      confidence: 32.7,
      timestamp: '2024-01-14T12:20:00Z',
      documentType: 'Academic Document',
      fileSize: '1.9 MB',
      processingTime: '1.8s'
    }
  ]

  const filteredRecords = useMemo(() => {
    return verificationRecords.filter(record => {
      const matchesSearch = 
        record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter
      const matchesDate = dateFilter === 'all' || isWithinDateRange(record.timestamp, dateFilter)
      
      return matchesSearch && matchesStatus && matchesDate
    }).sort((a, b) => {
      switch (sortBy) {
        case 'timestamp':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0)
        case 'user':
          return a.user.localeCompare(b.user)
        case 'document':
          return a.document.localeCompare(b.document)
        default:
          return 0
      }
    })
  }, [searchTerm, statusFilter, dateFilter, sortBy])

  const isWithinDateRange = (timestamp: string, filter: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    
    switch (filter) {
      case 'today':
        return date.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return date >= weekAgo
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return date >= monthAgo
      default:
        return true
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return 'Yesterday'
    return date.toLocaleDateString()
  }

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

  const exportData = () => {
    const csvContent = [
      ['ID', 'Document', 'User', 'Status', 'Confidence', 'Timestamp', 'Document Type', 'File Size', 'Processing Time'],
      ...filteredRecords.map(record => [
        record.id,
        record.document,
        record.user,
        record.status,
        record.confidence?.toString() || 'N/A',
        record.timestamp,
        record.documentType,
        record.fileSize,
        record.processingTime
      ])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verification_history_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification History</h2>
          <p className="text-gray-600">View and manage all your document verification records.</p>
        </div>
        <button
          onClick={exportData}
          className="btn-secondary flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search verifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="timestamp">Sort by Date</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="user">Sort by User</option>
            <option value="document">Sort by Document</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Showing {filteredRecords.length} of {verificationRecords.length} verifications</span>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Verification Records Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Document</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Confidence</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">File Size</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Processing Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{record.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate" title={record.document}>
                    {record.document}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.documentType}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-1 capitalize">{record.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {record.confidence ? `${record.confidence}%` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.fileSize}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{record.processingTime}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{formatTimestamp(record.timestamp)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button className="text-primary-600 hover:text-primary-700 transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No verifications found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerificationHistory
