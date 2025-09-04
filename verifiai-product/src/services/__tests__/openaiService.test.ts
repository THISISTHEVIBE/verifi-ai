import { OpenAIService } from '../openaiService'

// Mock the OpenAI module
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  confidence: 85,
                  status: 'verified',
                  details: ['Document authenticity confirmed', 'Information matches database records'],
                  documentType: 'identity',
                  extractedText: 'Sample extracted text',
                  riskFactors: []
                })
              }
            }]
          })
        }
      }
    }))
  }
})

describe('OpenAIService', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.VITE_OPENAI_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should analyze a document successfully', async () => {
    // Create a mock file
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    const request = {
      file: mockFile,
      verificationType: 'identity' as const
    }

    const result = await OpenAIService.analyzeDocument(request)

    expect(result).toEqual({
      confidence: 85,
      status: 'verified',
      details: ['Document authenticity confirmed', 'Information matches database records'],
      documentType: 'identity',
      extractedText: 'Sample extracted text',
      riskFactors: []
    })
  })

  it('should handle API errors gracefully', async () => {
    // Mock OpenAI to throw an error
    const mockOpenAI = require('openai').default
    const mockInstance = new mockOpenAI()
    mockInstance.chat.completions.create.mockRejectedValue(new Error('API Error'))

    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const request = {
      file: mockFile,
      verificationType: 'identity' as const
    }

    await expect(OpenAIService.analyzeDocument(request)).rejects.toThrow('Failed to analyze document. Please try again.')
  })

  it('should parse non-JSON responses correctly', async () => {
    // Mock OpenAI to return non-JSON response
    const mockOpenAI = require('openai').default
    const mockInstance = new mockOpenAI()
    mockInstance.chat.completions.create.mockResolvedValue({
      choices: [{
        message: {
          content: 'This document appears to be verified with 90% confidence. The document shows authentic features.'
        }
      }]
    })

    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const request = {
      file: mockFile,
      verificationType: 'identity' as const
    }

    const result = await OpenAIService.analyzeDocument(request)

    expect(result.confidence).toBe(90)
    expect(result.status).toBe('verified')
    expect(result.details).toContain('Document analysis completed')
  })
})
