import { NextResponse } from 'next/server';
import { processDocument } from '@/lib/document-processor';
import { extractConcepts as legacyExtractConcepts } from '@/lib/concept-extractor'; // Renamed for fallback
import { ExtractionKernel } from '@/server/extraction/ExtractionKernel'; // Updated path
import type { ExtractedConcepts } from '@/types'; // Added
import crypto from 'crypto'; // Import crypto for generating UUID
import fs from 'fs/promises'; // Added
import path from 'path';     // Added
import { config as appConfig } from '@/lib/config'; // Renamed import to appConfig
// import openai from '@/lib/openai'; // Uncomment if needed for other AI tasks

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Set a higher limit for body parsing, e.g., 10MB
        },
    },
};

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }

        // Add check for 0KB file size
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

        // Generate a unique documentId first
        const documentId = crypto.randomUUID();

        // --- File writing logic MUST happen before ExtractionKernel.handle() ---
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

        let concepts: ExtractedConcepts | null = null;
        let extractionError: Error | null = null;

        try {
            console.log(`[UPLOAD_API] Attempting concept extraction via ExtractionKernel for documentId: ${documentId}`);
            concepts = await ExtractionKernel.handle(documentId);
            console.log(`[UPLOAD_API] ExtractionKernel successful for documentId: ${documentId}`);
        } catch (kernelError) {
            console.error(`[UPLOAD_API] ExtractionKernel.handle() failed for documentId: ${documentId}. Error:`, kernelError);
            extractionError = kernelError instanceof Error ? kernelError : new Error(String(kernelError));

            // Fallback to legacy extractConcepts
            try {
                console.warn(`[UPLOAD_API] Falling back to legacy extractConcepts for documentId: ${documentId} due to Kernel failure.`);
                concepts = await legacyExtractConcepts(extractedText); // Use renamed import
                console.log(`[UPLOAD_API] Legacy extractConcepts successful for documentId: ${documentId} after Kernel failure.`);
            } catch (legacyError) {
                console.error(`[UPLOAD_API] Legacy extractConcepts also failed for documentId: ${documentId}. Error:`, legacyError);
                extractionError = legacyError instanceof Error ? legacyError : new Error(String(legacyError));
                // If both fail, the error will be handled by the main catch block, or we can return a specific error here
            }
        }

        if (!concepts && extractionError) {
            // If concepts are still null and there was an error, return an error response
            console.error(`[UPLOAD_API] All concept extraction methods failed for documentId: ${documentId}. Last error:`, extractionError);
            return NextResponse.json({ error: 'Failed to extract concepts from document.', details: extractionError.message }, { status: 500 });
        }

        if (!concepts) {
            // This case should ideally not be reached if errors are handled, but as a safeguard:
            console.error(`[UPLOAD_API] Concepts are null after all attempts, but no explicit error was caught. DocumentId: ${documentId}`);
            return NextResponse.json({ error: 'Concept extraction resulted in null, but no specific error was caught.' }, { status: 500 });
        }

        console.log(`[UPLOAD_API] Successfully processed upload and concept extraction for documentId: ${documentId}`);
        return NextResponse.json({
            message: 'File uploaded and processed successfully!',
            documentId,
            extractedText, // Still useful to return for some contexts
            extractedConcepts: concepts, // Changed from analysisResult to extractedConcepts
        });
    } catch (error) {
        console.error('[UPLOAD_API] Error processing file upload:', error);
        return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
    }
}
