// End-to-end test for full user flow: login → upload → see findings → export PDF
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('VerifiAI User Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('complete user flow: login → upload → analyze → export', async ({ page }) => {
    // Step 1: Check if user needs to sign in
    const signInButton = page.locator('text=Sign In');
    if (await signInButton.isVisible()) {
      // Mock authentication for testing
      await page.route('/api/auth/session', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-123',
              email: 'test@example.com',
              name: 'Test User',
              image: null
            }
          })
        });
      });

      // Mock user authentication
      await page.evaluate(() => {
        // Simulate authenticated state
        window.localStorage.setItem('auth-state', 'authenticated');
      });

      await page.reload();
    }

    // Step 2: Navigate to upload page
    await page.click('text=Upload');
    await expect(page).toHaveURL(/.*upload/);

    // Verify upload page elements
    await expect(page.locator('h2')).toContainText('Contract Upload & Analysis');
    await expect(page.locator('text=Select Contract Type')).toBeVisible();

    // Step 3: Select contract type
    await page.click('text=General Contracts');
    await expect(page.locator('text=General Contracts').locator('..')).toHaveClass(/border-primary-500/);

    // Step 4: Mock file upload API
    await page.route('/api/documents', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'doc-123',
            filename: 'test-contract.pdf',
            size: 1024,
            type: 'application/pdf',
            category: 'contract',
            status: 'UPLOADED',
            uploadedAt: new Date().toISOString()
          })
        });
      }
    });

    // Step 5: Mock analysis API
    await page.route('/api/analysis', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'analysis-123',
            documentId: 'doc-123',
            status: 'COMPLETED',
            riskScore: 65,
            summary: 'Contract has moderate risk due to unclear termination clauses',
            findings: [
              {
                type: 'LEGAL',
                severity: 'MEDIUM',
                title: 'Kündigungsklausel prüfen',
                description: 'Die Kündigungsbedingungen sollten überprüft werden.',
                suggestion: 'Rechtliche Beratung für Kündigungsfristen empfohlen.'
              },
              {
                type: 'FINANCIAL',
                severity: 'LOW',
                title: 'Zahlungsbedingungen',
                description: 'Standardzahlungsbedingungen identifiziert.',
                suggestion: 'Zahlungsfristen könnten optimiert werden.'
              }
            ],
            completedAt: new Date().toISOString()
          })
        });
      }
    });

    // Step 6: Upload a file
    const fileInput = page.locator('input[type="file"]');
    
    // Create a test file for upload
    const testFilePath = path.join(__dirname, 'fixtures', 'test-contract.pdf');
    
    // Mock file selection (since we can't create actual files in tests)
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test contract content'], 'test-contract.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Step 7: Verify file appears in upload list
    await expect(page.locator('text=test-contract.pdf')).toBeVisible();
    await expect(page.locator('text=uploading')).toBeVisible();

    // Wait for upload to complete
    await expect(page.locator('text=processing')).toBeVisible();
    
    // Wait for analysis to complete
    await expect(page.locator('text=completed')).toBeVisible({ timeout: 10000 });

    // Step 8: Verify analysis results are displayed
    await expect(page.locator('text=65% confidence')).toBeVisible();
    await expect(page.locator('text=Analysis Results:')).toBeVisible();
    await expect(page.locator('text=Kündigungsklausel prüfen')).toBeVisible();
    await expect(page.locator('text=Zahlungsbedingungen')).toBeVisible();

    // Step 9: Test export functionality
    await page.route('/api/reports/analysis-123*', async route => {
      const url = new URL(route.request().url());
      const format = url.searchParams.get('format') || 'pdf';
      
      if (format === 'csv') {
        await route.fulfill({
          status: 200,
          contentType: 'text/csv',
          headers: {
            'Content-Disposition': 'attachment; filename="analysis-123.csv"'
          },
          body: 'Document,Analysis Date,Risk Score,Status,Finding Type,Severity,Title,Description,Suggestion\n"test-contract.pdf","2024-01-01","65","COMPLETED","LEGAL","MEDIUM","Kündigungsklausel prüfen","Die Kündigungsbedingungen sollten überprüft werden.","Rechtliche Beratung für Kündigungsfristen empfohlen."'
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'text/html',
          headers: {
            'Content-Disposition': 'attachment; filename="analysis-123.html"'
          },
          body: '<html><body><h1>Contract Analysis Report</h1><p>Risk Score: 65/100</p></body></html>'
        });
      }
    });

    // Mock export access check
    await page.route('/api/reports/analysis-123', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ allowed: true })
      });
    });

    // Click export button (assuming there's an export button in the UI)
    const exportButton = page.locator('text=Export').or(page.locator('[data-testid="export-button"]'));
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // Verify export options
      await expect(page.locator('text=PDF').or(page.locator('text=CSV'))).toBeVisible();
    }

    // Step 10: Navigate to dashboard to see metrics
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/.*dashboard/);

    // Mock metrics API
    await page.route('/api/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalDocuments: 1,
          totalAnalyses: 1,
          completedAnalyses: 1,
          avgRiskScore: 65,
          recentDocuments: 1,
          successRate: 100,
          riskDistribution: {
            low: 0,
            medium: 1,
            high: 0
          }
        })
      });
    });

    // Verify dashboard shows updated metrics
    await expect(page.locator('text=1').first()).toBeVisible(); // Total documents
    await expect(page.locator('text=100%')).toBeVisible(); // Success rate

    // Step 11: Check history page
    await page.click('text=History');
    await expect(page).toHaveURL(/.*history/);

    // Verify uploaded document appears in history
    await expect(page.locator('text=test-contract.pdf')).toBeVisible();
  });

  test('should handle authentication redirect', async ({ page }) => {
    // Mock unauthenticated state
    await page.route('/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: null })
      });
    });

    await page.goto('/');

    // Should show sign-in prompt
    await expect(page.locator('text=Sign In')).toBeVisible();
    await expect(page.locator('text=GitHub')).toBeVisible();
    await expect(page.locator('text=Google')).toBeVisible();
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock authenticated user
    await page.route('/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      });
    });

    await page.goto('/upload');

    // Mock upload error
    await page.route('/api/documents', async route => {
      await route.fulfill({
        status: 413,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'file_size_exceeded',
          message: 'File size exceeds limit for your plan'
        })
      });
    });

    // Try to upload a file
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['large file content'], 'large-contract.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should show error message
    await expect(page.locator('text=File size exceeds limit')).toBeVisible();
  });

  test('should handle analysis errors gracefully', async ({ page }) => {
    // Mock authenticated user
    await page.route('/api/auth/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-123',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      });
    });

    await page.goto('/upload');

    // Mock successful upload
    await page.route('/api/documents', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'doc-123',
          filename: 'test-contract.pdf',
          size: 1024,
          type: 'application/pdf',
          status: 'UPLOADED'
        })
      });
    });

    // Mock analysis error
    await page.route('/api/analysis', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'analysis_failed',
          message: 'AI service temporarily unavailable'
        })
      });
    });

    // Upload file
    await page.evaluate(() => {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['test content'], 'test-contract.pdf', { type: 'application/pdf' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Should show failed status
    await expect(page.locator('text=failed')).toBeVisible();
    await expect(page.locator('text=AI service temporarily unavailable')).toBeVisible();
  });
});
