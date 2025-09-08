import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { OpenAIService, DocumentAnalysisRequest } from '../services/openaiService'
import { addEvent as addMetricsEvent, VerificationCategory, VerificationOutcome } from '../services/metricsService'

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  originalFile: File
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
  // Track when each file started (upload begin) to compute processing duration
  const startTimesRef = useRef<Record<string, number>>({})

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
    // Build and append UI entries that keep a pointer to the original File (Blob)
    const uiEntries: UploadedFile[] = files.map((blob) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: blob.name,
      size: blob.size,
      type: blob.type,
      status: 'uploading',
      progress: 0,
      originalFile: blob,
    }))

    setUploadedFiles((prev) => [...prev, ...uiEntries])

    // Simulate upload progress and then process with the real API
    uiEntries.forEach((uiFile) => {
      // record start time
      startTimesRef.current[uiFile.id] = Date.now()
      let progress = 0
      const uploadInterval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(uploadInterval)

          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uiFile.id ? { ...f, status: 'processing', progress: 100 } : f))
          )

          // Start real document processing with the original Blob
          processDocument(uiFile.id, uiFile.originalFile)
        } else {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === uiFile.id ? { ...f, progress: Math.round(progress) } : f))
          )
        }
      }, 200)
    })
  }

  const processDocument = async (fileId: string, file: File) => {
    try {
      // Update status to processing
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'processing', progress: 50 }
          : f
      ))

      // Check if API key is configured
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your environment variables.')
      }

      // Prepare the analysis request
      const analysisRequest: DocumentAnalysisRequest = {
        file: file,
        verificationType: verificationType as 'identity' | 'financial' | 'business' | 'academic'
      }

      // Call OpenAI service
      const result = await OpenAIService.analyzeDocument(analysisRequest)

      // Update with results
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'completed',
              progress: 100,
              verificationResult: {
                confidence: result.confidence,
                status: result.status,
                details: result.details
              }
            }
          : f
      ))

      // Record metrics event
      const startedAt = startTimesRef.current[fileId] || Date.now()
      const outcome: VerificationOutcome = result.status
      addMetricsEvent({
        id: fileId,
        documentName: file.name,
        bytes: file.size,
        category: verificationType as VerificationCategory,
        outcome,
        confidence: result.confidence,
        startedAt,
        completedAt: Date.now(),
      })

    } catch (error) {
      console.error('Error processing document:', error)
      
      // Update with error status
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'failed',
              progress: 100,
              verificationResult: {
                confidence: 0,
                status: 'unverified',
                details: [error instanceof Error ? error.message : 'Failed to process document']
              }
            }
          : f
      ))

      // Record failed metrics event
      const startedAt = startTimesRef.current[fileId] || Date.now()
      addMetricsEvent({
        id: fileId,
        documentName: file.name,
        bytes: file.size,
        category: verificationType as VerificationCategory,
        outcome: 'failed',
        confidence: null,
        startedAt,
        completedAt: Date.now(),
      })
    }
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
            Support for JPG and PNG files up to 10MB each
          </p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png"
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

      {/* API Configuration Notice */}
      {(!import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY === 'your_openai_api_key_here') && (
        <div className="card bg-yellow-50 border-yellow-200">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ API Configuration Required</h3>
          <p className="text-yellow-800 mb-2">
            To use real document analysis, you need to configure your OpenAI API key:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-yellow-800 text-sm">
            <li>Copy <code className="bg-yellow-100 px-1 rounded">env.example</code> to <code className="bg-yellow-100 px-1 rounded">.env</code></li>
            <li>Add your OpenAI API key: <code className="bg-yellow-100 px-1 rounded">VITE_OPENAI_API_KEY=your_actual_key</code></li>
            <li>Restart the development server</li>
          </ol>
          <p className="text-yellow-800 text-sm mt-2">
            <strong>Note:</strong> This demo uses OpenAI's Vision API for document analysis. In production, API calls should be handled by a backend service for security.
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800">
          <li>Select the type of document you want to verify</li>
          <li>Upload your document (PDF, JPG, PNG supported)</li>
          <li>Our AI system analyzes the document for authenticity using OpenAI's Vision API</li>
          <li>Get instant results with confidence scores and verification details</li>
        </ol>
      </div>
    </div>
  )
}

export default DocumentUpload
