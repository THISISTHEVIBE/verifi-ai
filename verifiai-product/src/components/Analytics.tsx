import React, { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Users, Clock, CheckCircle, BarChart3, Download } from 'lucide-react'
import { getAggregatedMetrics, TimeRange } from '../services/metricsService'

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d')

  // Prefer real aggregated metrics if available; otherwise use mock data
  const aggregated = useMemo(() => getAggregatedMetrics(timeRange as TimeRange), [timeRange])

  const mockMetrics = {
    totalVerifications: 1234,
    successRate: 94.2,
    avgProcessingTime: 2.3,
    activeUsers: 156,
    dailyVerifications: [45, 52, 48, 67, 89, 76, 54, 43, 65, 78, 89, 92, 87, 76, 65, 54, 43, 65, 78, 89, 92, 87, 76, 65, 54, 43, 65, 78, 89, 92],
    documentTypeDistribution: [
      { type: 'Identity Documents', count: 456, percentage: 37.0 },
      { type: 'Financial Documents', count: 234, percentage: 19.0 },
      { type: 'Business Documents', count: 189, percentage: 15.3 },
      { type: 'Academic Documents', count: 178, percentage: 14.4 },
      { type: 'Other', count: 177, percentage: 14.3 }
    ],
    confidenceDistribution: [
      { range: '90-100%', count: 567, percentage: 45.9 },
      { range: '80-89%', count: 234, percentage: 19.0 },
      { range: '70-79%', count: 189, percentage: 15.3 },
      { range: '60-69%', count: 156, percentage: 12.6 },
      { range: 'Below 60%', count: 88, percentage: 7.1 }
    ],
    hourlyActivity: [
      { hour: '00:00', verifications: 12 },
      { hour: '02:00', verifications: 8 },
      { hour: '04:00', verifications: 5 },
      { hour: '06:00', verifications: 15 },
      { hour: '08:00', verifications: 45 },
      { hour: '10:00', verifications: 67 },
      { hour: '12:00', verifications: 89 },
      { hour: '14:00', verifications: 76 },
      { hour: '16:00', verifications: 92 },
      { hour: '18:00', verifications: 78 },
      { hour: '20:00', verifications: 54 },
      { hour: '22:00', verifications: 23 }
    ]
  }

  const metrics = aggregated || mockMetrics

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ]

  // (removed unused trend helpers)

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const getMaxValue = (data: number[]) => {
    return Math.max(...data)
  }

  const renderBarChart = (data: number[], maxValue: number, height: number = 200) => {
    return (
      <div className="flex items-end space-x-1 h-48">
        {data.map((value, index) => (
          <div
            key={index}
            className="flex-1 bg-primary-200 hover:bg-primary-300 transition-colors rounded-t"
            style={{
              height: `${(value / maxValue) * height}px`,
              minHeight: '4px'
            }}
            title={`Day ${index + 1}: ${value} verifications`}
          />
        ))}
      </div>
    )
  }

  const renderHorizontalBarChart = (data: Array<{ type?: string; range?: string; count: number; percentage: number }>) => {
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">{item.type ?? item.range}</span>
              <span className="text-gray-600">{item.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h2>
          <p className="text-gray-600">Comprehensive insights into your verification system performance.</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field w-40"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button className="btn-secondary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Verifications</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalVerifications)}</p>
              <p className="text-sm text-success-600 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>+12% from last month</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.successRate}%</p>
              <p className="text-sm text-success-600 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>+2.1% from last month</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.avgProcessingTime}s</p>
              <p className="text-sm text-success-600 flex items-center space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>-0.3s from last month</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.activeUsers}</p>
              <p className="text-sm text-success-600 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>+8% from last month</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Verifications Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Verifications</h3>
          <div className="mb-4">
            <p className="text-3xl font-bold text-gray-900">
              {formatNumber(metrics.dailyVerifications.reduce((a, b) => a + b, 0))}
            </p>
            <p className="text-sm text-gray-600">Total verifications in the last 30 days</p>
          </div>
          {renderBarChart(metrics.dailyVerifications, getMaxValue(metrics.dailyVerifications))}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Document Type Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Type Distribution</h3>
          {renderHorizontalBarChart(metrics.documentTypeDistribution)}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confidence Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Confidence Score Distribution</h3>
          {renderHorizontalBarChart(metrics.confidenceDistribution)}
        </div>

        {/* Hourly Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Activity Pattern</h3>
          <div className="flex items-end space-x-1 h-48">
            {metrics.hourlyActivity.map((item, index) => (
              <div
                key={index}
                className="flex-1 bg-blue-200 hover:bg-blue-300 transition-colors rounded-t"
                style={{
                  height: `${(item.verifications / getMaxValue(metrics.hourlyActivity.map(h => h.verifications))) * 200}px`,
                  minHeight: '4px'
                }}
                title={`${item.hour}: ${item.verifications} verifications`}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">High Success Rate</h4>
            <p className="text-sm text-gray-600">Your verification system maintains a 94.2% success rate, well above industry average.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Fast Processing</h4>
            <p className="text-sm text-gray-600">Average processing time of 2.3 seconds ensures quick user experience.</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Growing Usage</h4>
            <p className="text-sm text-gray-600">12% increase in verifications shows growing trust in your system.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
