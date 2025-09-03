import React, { useState, useCallback } from 'react'
import { Upload, FileText, Image, File, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  verificationResult?: {
    confidence: number
    status: 'verified' | 'unverified' | 'suspicious'
    details: string[]
  }
}

const DocumentUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [verificationType, setVerificationType] = useState('identity')

  const verificationTypes = [
    { id: 'identity', label: 'Identity Documents', description: 'Passports, ID cards, driver licenses' },
    { id: 'financial', label: 'Financial Documents', description: 'Bank statements, utility bills' },
    { id: 'business', label: 'Business Documents', description: 'Company registrations, contracts' },
    { id: 'academic', label: 'Academic Documents', description: 'Diplomas, certificates, transcripts' }
  ]

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }

  const simulateUpload = (fileId: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, status: 'processing', progress: 100 }
            : file
        ))

        // Simulate verification processing
        setTimeout(() => {
          const result = Math.random() > 0.1 ? 'verified' : 'suspicious'
          const confidence = result === 'verified' ? 85 + Math.random() * 15 : 30 + Math.random() * 40
          
          setUploadedFiles(prev => prev.map(file => 
            file.id === fileId 
              ? { 
                  ...file, 
                  status: 'completed',
                  verificationResult: {
                    confidence: Math.round(confidence * 10) / 10,
                    status: result as 'verified' | 'unverified' | 'suspicious',
                    details: result === 'verified' 
                      ? ['Document authenticity confirmed', 'Information matches database records']
                      : ['Document requires manual review', 'Some information appears inconsistent']
                  }
                }
              : file
          ))
        }, 2000)
      } else {
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, progress: Math.round(progress) }
            : file
        ))
      }
    }, 200)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      case 'processing':
        return <div className="w-4 h-4 border-2 border-warning-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-error-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-success-600 bg-success-50 border-success-200'
      case 'unverified':
        return 'text-warning-600 bg-warning-50 border-warning-200'
      case 'suspicious':
        return 'text-error-600 bg-error-50 border-error-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Document Upload & Verification</h2>
        <p className="text-gray-600">Upload documents to verify their authenticity using our AI-powered verification system.</p>
      </div>

      {/* Verification Type Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Verification Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {verificationTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setVerificationType(type.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                verificationType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900 mb-1">{type.label}</h4>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Documents</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </h4>
          <p className="text-gray-600 mb-4">
            Support for PDF, JPG, PNG files up to 10MB each
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="btn-primary cursor-pointer inline-block"
          >
            Choose Files
          </label>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Files</h3>
          <div className="space-y-4">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{file.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(file.status)}
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {file.status}
                    </span>
                  </div>
                  
                  {file.verificationResult && (
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getVerificationStatusColor(file.verificationResult.status)}`}>
                        {file.verificationResult.status}
                      </span>
                      <span className="text-sm text-gray-600">
                        {file.verificationResult.confidence}% confidence
                      </span>
                    </div>
                  )}
                </div>

                {/* Verification Details */}
                {file.verificationResult && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Verification Details:</p>
                    <ul className="space-y-1">
                      {file.verificationResult.details.map((detail, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Select the type of document you want to verify</li>
          <li>Upload your document (PDF, JPG, PNG supported)</li>
          <li>Our AI system analyzes the document for authenticity</li>
          <li>Get instant results with confidence scores and verification details</li>
        </ol>
      </div>
    </div>
  )
}

export default DocumentUpload
