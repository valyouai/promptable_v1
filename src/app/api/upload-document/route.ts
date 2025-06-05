import { NextResponse } from 'next/server';
import { processDocument } from '@/lib/document-processor';
import { extractConcepts } from '@/lib/concept-extractor';
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

        const analysisResult = await extractConcepts(extractedText);

        // Generate a unique documentId
        const documentId = crypto.randomUUID();

        // --- Add file writing logic here ---
        const UPLOADS_DIR = appConfig.uploads.dirPath; // Updated to use appConfig
        const filePath = path.join(UPLOADS_DIR, `${documentId}.txt`);

        try {
            await fs.mkdir(UPLOADS_DIR, { recursive: true });
            await fs.writeFile(filePath, extractedText, 'utf-8');
            console.log(`[UPLOAD_API] Document saved. documentId: ${documentId}, path: ${filePath}`);
        } catch (writeError) {
            console.error(`[UPLOAD_API] Failed to write document to disk. documentId: ${documentId}, path: ${filePath}`, writeError);
            return NextResponse.json({ error: 'Failed to save document content to disk after upload.' }, { status: 500 }); // Fail request
        }
        // --- End file writing logic ---

        console.log(`[UPLOAD_API] Successfully processed upload for documentId: ${documentId}`);
        return NextResponse.json({
            message: 'File uploaded and processed successfully!',
            documentId, // Include documentId in the response
            extractedText,
            analysisResult,
        });
    } catch (error) {
        console.error('[UPLOAD_API] Error processing file upload:', error);
        return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
    }
}
