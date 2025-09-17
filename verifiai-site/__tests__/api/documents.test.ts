// API tests for /api/documents endpoint
import { NextRequest } from 'next/server';
import { POST } from '../../app/api/documents/route';
import { requireAuth } from '../../lib/auth-utils';
import { db } from '../../lib/db';
import { storage } from '../../lib/storage';
import { scanFile } from '../../lib/virus-scan';

// Mock dependencies
jest.mock('../../lib/auth-utils');
jest.mock('../../lib/db');
jest.mock('../../lib/storage');
jest.mock('../../lib/virus-scan');
jest.mock('../../lib/audit');
jest.mock('../../lib/billing');
jest.mock('../../lib/security');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockDb = db as jest.Mocked<typeof db>;
const mockStorage = storage as jest.Mocked<typeof storage>;
const mockScanFile = scanFile as jest.MockedFunction<typeof scanFile>;

describe('/api/documents', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequireAuth.mockResolvedValue({ user: mockUser });
    
    // Mock security functions
    const { checkRateLimit, isDocumentSizeAllowed } = require('../../lib/security');
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetTime: Date.now() + 3600000 });
    isDocumentSizeAllowed.mockResolvedValue({ allowed: true });
    
    // Mock audit function
    const { createAuditLog } = require('../../lib/audit');
    createAuditLog.mockResolvedValue(undefined);
    
    mockScanFile.mockResolvedValue({ isClean: true, scanTime: 100 });
    
    mockStorage.uploadFile.mockResolvedValue({
      id: 'file-123',
      path: '/uploads/file-123.pdf',
      originalName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      uploadedAt: new Date()
    });
    
    mockDb.document.create.mockResolvedValue({
      id: 'doc-123',
      orgId: 'org-123',
      uploaderId: 'user-123',
      filename: 'file-123',
      originalName: 'test.pdf',
      path: '/uploads/file-123.pdf',
      size: 1024,
      mimeType: 'application/pdf',
      status: 'UPLOADED',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  it('should upload document successfully', async () => {
    const formData = new FormData();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);
    formData.append('category', 'contract');

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: 'doc-123',
      filename: 'test.pdf',
      size: 1024,
      type: 'application/pdf',
      category: 'contract',
      status: 'UPLOADED',
      uploadedAt: expect.any(String)
    });

    expect(mockStorage.uploadFile).toHaveBeenCalledWith(
      expect.any(File),
      'test.pdf',
      'application/pdf'
    );

    expect(mockDb.document.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org-123',
        uploaderId: 'user-123',
        filename: 'file-123',
        originalName: 'test.pdf',
        path: '/uploads/file-123.pdf',
        size: expect.any(Number),
        mimeType: 'application/pdf',
        status: 'UPLOADED'
      }
    });
  });

  it('should reject non-multipart requests', async () => {
    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' }),
      headers: {
        'content-type': 'application/json'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('expected_multipart_form_data');
  });

  it('should reject missing file', async () => {
    const formData = new FormData();
    formData.append('category', 'contract');

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('file_missing');
  });

  it('should reject unsupported file types', async () => {
    const formData = new FormData();
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(415);
    expect(data.error).toBe('unsupported_type');
    expect(data.allowed).toEqual(['PDF', 'DOCX', 'DOC']);
  });

  it('should reject files that fail virus scan', async () => {
    mockScanFile.mockResolvedValue({
      isClean: false,
      threats: ['virus.test'],
      scanTime: 100
    });

    const formData = new FormData();
    const file = new File(['malicious content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('virus_detected');
    expect(data.threats).toEqual(['virus.test']);
  });

  it('should enforce rate limits', async () => {
    const { checkRateLimit } = require('../../lib/security');
    checkRateLimit.mockReturnValue({ 
      allowed: false, 
      remaining: 0, 
      resetTime: Date.now() + 3600000 
    });

    const formData = new FormData();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('rate_limit_exceeded');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
  });

  it('should enforce file size limits', async () => {
    const { isDocumentSizeAllowed } = require('../../lib/billing');
    isDocumentSizeAllowed.mockResolvedValue({ 
      allowed: false, 
      reason: 'File size exceeds limit' 
    });

    const formData = new FormData();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(413);
    expect(data.error).toBe('file_size_exceeded');
    expect(data.message).toBe('File size exceeds limit');
  });

  it('should require authentication', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'));

    const formData = new FormData();
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new NextRequest('http://localhost:3000/api/documents', {
      method: 'POST',
      body: formData,
      headers: {
        'content-type': 'multipart/form-data; boundary=----formdata-test'
      }
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
