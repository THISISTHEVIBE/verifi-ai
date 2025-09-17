import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { verifySignedUrl } from "@/lib/security";
import { logger, createRequestContext } from "@/lib/logger";
import { captureAPIError } from "@/lib/sentry";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestContext = createRequestContext(req);
  
  try {
    const fileId = params.id;
    const url = new URL(req.url);
    const expires = url.searchParams.get('expires');
    const signature = url.searchParams.get('signature');

    // Check if this is a signed URL request
    if (expires && signature) {
      // Verify signed URL
      if (!verifySignedUrl(fileId, expires, signature)) {
        logger.warn('Invalid or expired signed URL', { 
          ...requestContext, 
          fileId, 
          expires 
        });
        return new Response('Invalid or expired URL', { status: 403 });
      }
    } else {
      // Require authentication for non-signed requests
      const { user } = await requireAuth();
      
      // Verify user has access to this file
      const document = await db.document.findFirst({
        where: {
          filename: fileId,
          org: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      });

      if (!document) {
        logger.warn('Unauthorized file access attempt', { 
          ...requestContext, 
          userId: user.id, 
          fileId 
        });
        return new Response('File not found or access denied', { status: 404 });
      }
    }

    // Get file from storage
    const fileBuffer = await storage.getFile(fileId);
    
    // Get file metadata from database
    const document = await db.document.findFirst({
      where: { filename: fileId }
    });

    if (!document) {
      return new Response('File metadata not found', { status: 404 });
    }

    logger.info('File served successfully', { 
      ...requestContext, 
      fileId, 
      originalName: document.originalName,
      size: document.size 
    });

    // Return file with appropriate headers
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': document.size.toString(),
        'Content-Disposition': `attachment; filename="${document.originalName}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    logger.requestError(req, "File serving failed", error as Error, requestContext);
    captureAPIError(error as Error, req, { fileId: params.id });
    
    return new Response('Internal server error', { status: 500 });
  }
}
