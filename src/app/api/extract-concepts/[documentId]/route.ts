import { NextRequest, NextResponse } from 'next/server';
import { ExtractionKernel } from '@/lib/extraction/ExtractionKernel';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ documentId: string }> }
) {
    const { documentId } = await params;
    console.log(`[EXTRACT_API] Received request for documentId: ${documentId}`);

    if (!documentId) {
        console.warn('[EXTRACT_API] Missing documentId in request params.');
        return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    try {
        console.log(`[EXTRACT_API] Calling ExtractionKernel for documentId: ${documentId}`);
        const extractedConcepts = await ExtractionKernel.handle(documentId);
        console.log(`[EXTRACT_API] Successfully extracted concepts for documentId: ${documentId}`);
        return NextResponse.json(extractedConcepts);
    } catch (error) {
        console.error(`[EXTRACT_API] Extraction failed for documentId: ${documentId}. Error:`, error);
        // Check if the error is the specific "Document not found" error from StorageDriver
        if (error instanceof Error && error.message.includes('Document with ID') && error.message.includes('not found')) {
            return NextResponse.json({ error: error.message, type: 'DocumentNotFound' }, { status: 404 });
        }
        return NextResponse.json({ error: 'Extraction failed due to an internal server error.' }, { status: 500 });
    }
} 