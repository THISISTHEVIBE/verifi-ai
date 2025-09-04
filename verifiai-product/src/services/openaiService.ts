import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be handled by a backend
})

export interface DocumentAnalysisResult {
  confidence: number
  status: 'verified' | 'unverified' | 'suspicious'
  details: string[]
  documentType?: string
  extractedText?: string
  riskFactors?: string[]
}

export interface DocumentAnalysisRequest {
  file: File
  verificationType: 'identity' | 'financial' | 'business' | 'academic'
}

export class OpenAIService {
  /**
   * Analyze a document using OpenAI's Vision API
   */
  static async analyzeDocument(request: DocumentAnalysisRequest): Promise<DocumentAnalysisResult> {
    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(request.file)
      
      // Create the analysis prompt based on verification type
      const prompt = this.createAnalysisPrompt(request.verificationType)
      
      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${request.file.type};base64,${base64Image}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })

      // Parse the response
      const analysisText = response.choices[0]?.message?.content || ''
      return this.parseAnalysisResponse(analysisText, request.verificationType)
      
    } catch (error) {
      console.error('Error analyzing document:', error)
      throw new Error('Failed to analyze document. Please try again.')
    }
  }

  /**
   * Convert file to base64 string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  /**
   * Create analysis prompt based on verification type
   */
  private static createAnalysisPrompt(verificationType: string): string {
    const basePrompt = `Analyze this document and provide a detailed verification assessment. 
    Focus on authenticity, consistency, and potential risk factors.`

    const typeSpecificPrompts = {
      identity: `
        For this identity document (passport, ID card, driver's license), check for:
        - Document authenticity indicators (security features, watermarks, holograms)
        - Text consistency and formatting
        - Photo quality and consistency
        - Expiration dates and validity
        - Potential signs of tampering or forgery
        - Information completeness and accuracy
      `,
      financial: `
        For this financial document (bank statement, utility bill, invoice), check for:
        - Document formatting and layout consistency
        - Account information accuracy
        - Date ranges and transaction details
        - Bank or institution branding authenticity
        - Potential signs of digital manipulation
        - Required information completeness
      `,
      business: `
        For this business document (contract, registration, certificate), check for:
        - Document structure and formatting
        - Legal language consistency
        - Signature authenticity
        - Company information accuracy
        - Date and term validity
        - Potential contract risks or unusual clauses
      `,
      academic: `
        For this academic document (diploma, transcript, certificate), check for:
        - Institution branding and formatting
        - Degree or certification details
        - Grade or score consistency
        - Date and validity information
        - Signature and seal authenticity
        - Potential signs of forgery
      `
    }

    return `${basePrompt}\n\n${typeSpecificPrompts[verificationType as keyof typeof typeSpecificPrompts] || typeSpecificPrompts.identity}

    Please respond in the following JSON format:
    {
      "confidence": <number between 0-100>,
      "status": "<verified|unverified|suspicious>",
      "details": ["<detail1>", "<detail2>", ...],
      "documentType": "<detected document type>",
      "extractedText": "<key text extracted from document>",
      "riskFactors": ["<risk1>", "<risk2>", ...]
    }`
  }

  /**
   * Parse the analysis response from OpenAI
   */
  private static parseAnalysisResponse(response: string, verificationType: string): DocumentAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
          status: parsed.status || 'suspicious',
          details: Array.isArray(parsed.details) ? parsed.details : ['Analysis completed'],
          documentType: parsed.documentType || verificationType,
          extractedText: parsed.extractedText || '',
          riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : []
        }
      }
    } catch (error) {
      console.error('Error parsing OpenAI response:', error)
    }

    // Fallback parsing if JSON parsing fails
    const confidence = this.extractConfidence(response)
    const status = this.extractStatus(response)
    const details = this.extractDetails(response)

    return {
      confidence,
      status,
      details,
      documentType: verificationType,
      extractedText: '',
      riskFactors: []
    }
  }

  /**
   * Extract confidence score from text response
   */
  private static extractConfidence(response: string): number {
    const confidenceMatch = response.match(/(\d+)%|confidence[:\s]*(\d+)/i)
    if (confidenceMatch) {
      return parseInt(confidenceMatch[1] || confidenceMatch[2]) || 50
    }
    return 50
  }

  /**
   * Extract status from text response
   */
  private static extractStatus(response: string): 'verified' | 'unverified' | 'suspicious' {
    const lowerResponse = response.toLowerCase()
    if (lowerResponse.includes('verified') || lowerResponse.includes('authentic')) {
      return 'verified'
    } else if (lowerResponse.includes('suspicious') || lowerResponse.includes('concern')) {
      return 'suspicious'
    }
    return 'unverified'
  }

  /**
   * Extract details from text response
   */
  private static extractDetails(response: string): string[] {
    const lines = response.split('\n').filter(line => line.trim())
    const details: string[] = []
    
    for (const line of lines) {
      if (line.includes('-') || line.includes('•') || line.includes('*')) {
        const detail = line.replace(/^[-•*]\s*/, '').trim()
        if (detail) details.push(detail)
      }
    }
    
    return details.length > 0 ? details : ['Document analysis completed']
  }
}
