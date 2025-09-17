// Unit tests for analyzeContract function
import { analyzeContract } from '../lib/ai/analyzeContract';
import { db } from '../lib/db';

// Mock the database
jest.mock('../lib/db', () => ({
  db: {
    analysis: {
      create: jest.fn(),
      update: jest.fn(),
    },
    finding: {
      createMany: jest.fn(),
    },
  },
}));

// Mock fetch for OpenAI API calls
global.fetch = jest.fn();

describe('analyzeContract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    (db.analysis.create as jest.Mock).mockResolvedValue({
      id: 'test-analysis-id',
    });
    
    (db.analysis.update as jest.Mock).mockResolvedValue({
      id: 'test-analysis-id',
      completedAt: new Date(),
    });
    
    (db.finding.createMany as jest.Mock).mockResolvedValue({});
  });

  it('should analyze contract successfully with OpenAI API', async () => {
    // Mock successful OpenAI response
    const mockOpenAIResponse = {
      riskScore: 65,
      summary: 'Contract has moderate risk due to unclear termination clauses',
      findings: [
        {
          type: 'LEGAL',
          severity: 'MEDIUM',
          title: 'Kündigungsklausel prüfen',
          description: 'Die Kündigungsbedingungen sollten überprüft werden.',
          suggestion: 'Rechtliche Beratung für Kündigungsfristen empfohlen.'
        }
      ]
    };

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify(mockOpenAIResponse)
          }
        }]
      })
    });

    // Set environment variable for test
    process.env.OPENAI_API_KEY = 'test-api-key';

    const result = await analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract',
      text: 'This is a test contract with some content...'
    });

    expect(result).toEqual({
      id: 'test-analysis-id',
      documentId: 'test-doc-id',
      status: 'COMPLETED',
      riskScore: 65,
      summary: 'Contract has moderate risk due to unclear termination clauses',
      findings: mockOpenAIResponse.findings,
      completedAt: expect.any(Date),
    });

    // Verify database calls
    expect(db.analysis.create).toHaveBeenCalledWith({
      data: {
        documentId: 'test-doc-id',
        status: 'PROCESSING',
      }
    });

    expect(db.analysis.update).toHaveBeenCalledWith({
      where: { id: 'test-analysis-id' },
      data: {
        status: 'COMPLETED',
        riskScore: 65,
        summary: 'Contract has moderate risk due to unclear termination clauses',
        completedAt: expect.any(Date),
      }
    });

    expect(db.finding.createMany).toHaveBeenCalledWith({
      data: [{
        analysisId: 'test-analysis-id',
        type: 'LEGAL',
        severity: 'MEDIUM',
        title: 'Kündigungsklausel prüfen',
        description: 'Die Kündigungsbedingungen sollten überprüft werden.',
        suggestion: 'Rechtliche Beratung für Kündigungsfristen empfohlen.',
        location: undefined,
      }]
    });
  });

  it('should handle OpenAI API failure gracefully', async () => {
    // Mock failed OpenAI response
    (fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    process.env.OPENAI_API_KEY = 'test-api-key';

    const result = await analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract',
      text: 'This is a test contract...'
    });

    // Should still complete with fallback findings
    expect(result.status).toBe('COMPLETED');
    expect(result.findings).toHaveLength(2); // Fallback findings
    expect(result.findings[0].title).toBe('Kündigungsklausel prüfen');
    expect(result.riskScore).toBe(50); // Default risk score
  });

  it('should work without OpenAI API key', async () => {
    // Remove API key
    delete process.env.OPENAI_API_KEY;

    const result = await analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract'
    });

    // Should complete with fallback findings
    expect(result.status).toBe('COMPLETED');
    expect(result.findings).toHaveLength(2); // Fallback findings
    expect(result.riskScore).toBe(50); // Default risk score
    
    // Should not call OpenAI API
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON response from OpenAI', async () => {
    // Mock OpenAI response with invalid JSON
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      })
    });

    process.env.OPENAI_API_KEY = 'test-api-key';

    const result = await analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract',
      text: 'Test contract content'
    });

    // Should fall back to default findings
    expect(result.status).toBe('COMPLETED');
    expect(result.findings).toHaveLength(2);
    expect(result.riskScore).toBe(50);
  });

  it('should handle database errors', async () => {
    // Mock database error
    (db.analysis.create as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

    await expect(analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract'
    })).rejects.toThrow('Database connection failed');
  });

  it('should limit findings to maximum of 20', async () => {
    // Mock OpenAI response with many findings
    const manyFindings = Array.from({ length: 25 }, (_, i) => ({
      type: 'RISK',
      severity: 'LOW',
      title: `Finding ${i + 1}`,
      description: `Description ${i + 1}`,
      suggestion: `Suggestion ${i + 1}`
    }));

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              riskScore: 30,
              summary: 'Many findings detected',
              findings: manyFindings
            })
          }
        }]
      })
    });

    process.env.OPENAI_API_KEY = 'test-api-key';

    const result = await analyzeContract({
      documentId: 'test-doc-id',
      documentName: 'Test Contract.pdf',
      category: 'contract',
      text: 'Test contract'
    });

    // Should limit to 20 findings
    expect(result.findings).toHaveLength(20);
  });

  it('should clamp risk score to valid range', async () => {
    // Test risk score clamping
    const testCases = [
      { input: -10, expected: 0 },
      { input: 150, expected: 100 },
      { input: 50, expected: 50 }
    ];

    for (const testCase of testCases) {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          choices: [{
            message: {
              content: JSON.stringify({
                riskScore: testCase.input,
                summary: 'Test summary',
                findings: []
              })
            }
          }]
        })
      });

      process.env.OPENAI_API_KEY = 'test-api-key';

      const result = await analyzeContract({
        documentId: 'test-doc-id',
        documentName: 'Test Contract.pdf',
        category: 'contract',
        text: 'Test'
      });

      expect(result.riskScore).toBe(testCase.expected);
    }
  });
});
