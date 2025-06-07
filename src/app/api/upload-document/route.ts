import { NextResponse, NextRequest } from 'next/server';
import { processDocument } from '@/lib/document-processor';
// import { extractConcepts as legacyExtractConcepts } from '@/lib/concept-extractor'; // No longer needed
import { ExtractionKernel } from '@/server/extraction/ExtractionKernel';
import type { ExtractedConcepts } from '@/types';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { config as appConfig } from '@/lib/config';
// import openai from '@/lib/openai'; // Uncomment if needed for other AI tasks

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Set a higher limit for body parsing, e.g., 10MB
        },
    },
};

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        if (file.size === 0) {
            return NextResponse.json({ error: 'File is empty and cannot be processed.' }, { status: 400 });
        }

        const fileType = file.type;
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
        }

        const extractedText = await processDocument(file);
        const documentId = crypto.randomUUID(); // Still useful for saving and logging

        // --- File writing logic (preserved) ---
        const UPLOADS_DIR = appConfig.uploads.dirPath;
        const filePath = path.join(UPLOADS_DIR, `${documentId}.txt`);

        try {
            await fs.mkdir(UPLOADS_DIR, { recursive: true });
            await fs.writeFile(filePath, extractedText, 'utf-8');
            console.log(`[UPLOAD_API] Document saved. documentId: ${documentId}, path: ${filePath}`);
        } catch (writeError) {
            console.error(`[UPLOAD_API] Failed to write document to disk. documentId: ${documentId}, path: ${filePath}`, writeError);
            return NextResponse.json({ error: 'Failed to save document content to disk after upload.' }, { status: 500 });
        }
        // --- End file writing logic ---

        // ⚠ Safely parse persona from request URL
        const urlPersona = request.nextUrl.searchParams.get('persona') || 'creator';
        const validPersonas = ['creator', 'researcher', 'educator'];
        const persona = validPersonas.includes(urlPersona) ? urlPersona : 'creator';

        console.log(`[UPLOAD_API] Attempting concept extraction via ExtractionKernel.extract for documentId: ${documentId}, persona: ${persona}`);

        // ⚠ context is placeholder until context extractor module is operational
        const extractedConcepts: ExtractedConcepts = await ExtractionKernel.extract({
            persona: persona as 'creator' | 'researcher' | 'educator',
            documentText: extractedText,
            context: undefined
        });

        console.log(`[UPLOAD_API] ExtractionKernel.extract successful for documentId: ${documentId}`);

        return NextResponse.json({ extractedConcepts });

    } catch (error) {
        console.error('[UPLOAD_API] Error processing file upload:', error);
        // Provide more specific error details if possible, and ensure consistent error response structure.
        const errorMessage = error instanceof Error ? error.message : 'Failed to process file upload.';
        return NextResponse.json({ error: 'Failed to process file upload.', details: errorMessage }, { status: 500 });
    }
}
