import { NextRequest, NextResponse } from 'next/server';
import { ExtractionKernel, type Persona } from '@/server/extraction/ExtractionKernel';
import { StorageDriver } from '@/lib/extraction/StorageDriver';

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
        // Step 1: Fetch document content
        console.log(`[EXTRACT_API] Fetching document content for documentId: ${documentId}`);
        const documentText = await StorageDriver.fetchDocument(documentId);

        // Step 2: Determine persona (defaulting to 'researcher' for now)
        const persona: Persona = 'researcher'; // TODO: Consider making this configurable via request
        console.log(`[EXTRACT_API] Using persona: ${persona} for documentId: ${documentId}`);

        // Step 3: Call ExtractionKernel.extract
        console.log(`[EXTRACT_API] Calling ExtractionKernel.extract for documentId: ${documentId}`);
        const extractedConcepts = await ExtractionKernel.extract({ persona, documentText });

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