// API tests for /api/analysis endpoint
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/analysis/route';
import { requireAuth } from '../../lib/auth-utils';
import { db } from '../../lib/db';
import { analyzeContract } from '../../lib/ai/analyzeContract';

// Mock dependencies
jest.mock('../../lib/auth-utils');
jest.mock('../../lib/db');
jest.mock('../../lib/ai/analyzeContract');
jest.mock('../../lib/audit');
jest.mock('../../lib/billing');
jest.mock('../../lib/security');
jest.mock('../../lib/logger');
jest.mock('../../lib/sentry');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockDb = db as jest.Mocked<typeof db>;
const mockAnalyzeContract = analyzeContract as jest.MockedFunction<typeof analyzeContract>;

describe('/api/analysis', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    orgMemberships: [{
      id: 'membership-1',
      role: 'OWNER',
      org: {
        id: 'org-123',
        name: 'Test Org',
        slug: 'test-org'
      }
    }],
    defaultOrg: {
      id: 'org-123',
      name: 'Test Org',
      slug: 'test-org'
    }
  };

  const mockDocument = {
    id: 'doc-123',
    orgId: 'org-123',
    uploaderId: 'user-123',
    originalName: 'test-contract.pdf',
    org: {
      id: 'org-123',
      name: 'Test Org'
    }
  };

  const mockAnalysisResult = {
    id: 'analysis-123',
    documentId: 'doc-123',
    status: 'COMPLETED' as const,
    riskScore: 65,
    summary: 'Contract analysis completed successfully',
    findings: [
      {
        type: 'LEGAL' as const,
        severity: 'MEDIUM' as const,
        title: 'Termination clause review needed',
        description: 'The termination conditions should be reviewed',
        suggestion: 'Legal consultation recommended for termination periods'
      }
    ],
    completedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequireAuth.mockResolvedValue({ user: mockUser });
    
    // Mock security and billing functions
    const { checkRateLimit } = require('../../lib/security');
    const { canPerformAnalysis } = require('../../lib/billing');
    const { createAuditLog } = require('../../lib/audit');
    const { logger } = require('../../lib/logger');
    const { captureUserContext, startPerformanceTransaction } = require('../../lib/sentry');
    
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 9, resetTime: Date.now() + 3600000 });
    canPerformAnalysis.mockResolvedValue({ allowed: true });
    createAuditLog.mockResolvedValue(undefined);
    
    // Mock logger methods
    logger.request = jest.fn();
    logger.info = jest.fn();
    logger.requestError = jest.fn();
    
    // Mock Sentry methods
    captureUserContext.mockReturnValue(undefined);
    startPerformanceTransaction.mockReturnValue({
      setStatus: jest.fn(),
      finish: jest.fn()
    });
    
    mockDb.document.findFirst.mockResolvedValue(mockDocument);
    mockDb.analysis.findFirst.mockResolvedValue(null);
    mockAnalyzeContract.mockResolvedValue(mockAnalysisResult);
  });

  it('should analyze document successfully', async () => {
    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract',
      text: 'Contract content for analysis...'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockAnalysisResult);

    expect(mockDb.document.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'doc-123',
        org: {
          members: {
            some: {
              userId: 'user-123'
            }
          }
        }
      },
      include: {
        org: true
      }
    });

    expect(mockAnalyzeContract).toHaveBeenCalledWith({
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract',
      text: 'Contract content for analysis...'
    });
  });

  it('should return existing analysis if already completed', async () => {
    const existingAnalysis = {
      id: 'existing-analysis-123',
      status: 'COMPLETED',
      riskScore: 45,
      summary: 'Previously completed analysis',
      findings: [],
      completedAt: new Date()
    };

    mockDb.analysis.findFirst.mockResolvedValue(existingAnalysis);

    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('existing-analysis-123');
    expect(mockAnalyzeContract).not.toHaveBeenCalled();
  });

  it('should validate documentId parameter', async () => {
    const requestBody = {
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('validation_failed');
    expect(data.message).toBe('documentId must be a non-empty string');
  });

  it('should reject access to documents user does not own', async () => {
    mockDb.document.findFirst.mockResolvedValue(null);

    const requestBody = {
      documentId: 'unauthorized-doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('document_not_found');
    expect(data.message).toBe('Document not found or access denied');
  });

  it('should enforce billing entitlements', async () => {
    const { canPerformAnalysis } = require('../../lib/billing');
    canPerformAnalysis.mockResolvedValue({ 
      allowed: false, 
      reason: 'Monthly limit exceeded' 
    });

    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('entitlement_exceeded');
    expect(data.message).toBe('Monthly limit exceeded');
  });

  it('should enforce rate limits', async () => {
    const { checkRateLimit } = require('../../lib/security');
    checkRateLimit.mockReturnValue({ 
      allowed: false, 
      remaining: 0, 
      resetTime: Date.now() + 3600000 
    });

    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('rate_limit_exceeded');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
  });

  it('should handle analysis errors gracefully', async () => {
    mockAnalyzeContract.mockRejectedValue(new Error('AI service unavailable'));

    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('analysis_failed');
    expect(data.message).toBe('Failed to analyze document');
  });

  it('should require authentication', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const requestBody = {
      documentId: 'doc-123',
      documentName: 'test-contract.pdf',
      category: 'contract'
    };

    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/analysis', {
      method: 'POST',
      body: 'invalid json',
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
