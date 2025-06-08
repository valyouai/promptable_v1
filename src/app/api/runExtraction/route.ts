import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '@/server/llm/ExtractionOrchestrator';
// Removed import for parseMultipartFormData from '@/server/utils/parseMultipart' as it's now locally defined.
import type { PersonaType } from '@/server/llm/RelevanceFilteringAgent';
import { safeDecodeBuffer } from '@/lib/utils/SafeDocumentDecoder'; // Kept for fallback

// Default PDF extraction microservice URL (can be overridden by environment variable)
const PDF_EXTRACTION_MICROSERVICE_URL = process.env.PDF_EXTRACTION_MICROSERVICE_URL || 'http://localhost:7000/api/extract-pdf-text'; // Corrected endpoint

async function parseMultipartFormData(fileName: string, fileBuffer: Buffer, fileType: string): Promise<string> {
    console.log(`[parseMultipartFormData] Received file: ${fileName}, type: ${fileType}`);
    const lowerFileName = fileName.toLowerCase();

    if (fileType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
        console.log(`[parseMultipartFormData] Routing PDF ${fileName} to microservice: ${PDF_EXTRACTION_MICROSERVICE_URL} using global FormData.`);
        try {
            // Use global File and FormData
            const fileObject = new File([fileBuffer], fileName, { type: 'application/pdf' });
            const nativeFormData = new FormData(); // This is now global FormData
            nativeFormData.append('file', fileObject);

            const response = await fetch(PDF_EXTRACTION_MICROSERVICE_URL, {
                method: 'POST',
                body: nativeFormData, // Pass the global FormData instance
                // Headers will be set automatically by fetch for FormData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[parseMultipartFormData] Microservice error: ${response.status} - ${errorText}`);
                throw new Error(`PDF Microservice failed for ${fileName} with status ${response.status}: ${errorText}`);
            }
            const extractedText = await response.text();
            console.log(`[parseMultipartFormData] Successfully extracted text from PDF ${fileName} via microservice.`);
            return extractedText;
        } catch (error) {
            console.error(`[parseMultipartFormData] Error calling PDF microservice for ${fileName}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to process PDF ${fileName} via microservice: ${error.message}`);
            }
            throw new Error(`An unknown error occurred while processing PDF ${fileName} via microservice.`);
        }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerFileName.endsWith('.docx')) {
        console.warn(`[parseMultipartFormData] DOCX processing for ${fileName} is not fully implemented. Using text fallback.`);
        // Placeholder for future Mammoth or other DOCX library integration
        return safeDecodeBuffer(fileBuffer);
    } else {
        console.log(`[parseMultipartFormData] Processing ${fileName} (type: ${fileType}) as plain text using safeDecodeBuffer.`);
        return safeDecodeBuffer(fileBuffer);
    }
}

const ALLOWED_PERSONAS: PersonaType[] = ['educator', 'researcher', 'creator'];

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const personaValue = formData.get('persona') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!personaValue) {
            return NextResponse.json({ error: 'No persona provided' }, { status: 400 });
        }

        if (!ALLOWED_PERSONAS.includes(personaValue as PersonaType)) {
            return NextResponse.json(
                { error: `Invalid persona. Allowed personas are: ${ALLOWED_PERSONAS.join(', ')}` },
                { status: 400 }
            );
        }
        const validatedPersona = personaValue as PersonaType;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[runExtraction API] Processing file ${file.name} (type: ${file.type}) by calling local parseMultipartFormData.`);
        // Using the locally defined parseMultipartFormData function
        const documentText = await parseMultipartFormData(file.name, buffer, file.type);

        const cognitiveKernelResult = await ExtractionOrchestrator.runExtraction(documentText, validatedPersona);

        return NextResponse.json(cognitiveKernelResult);
    } catch (err: unknown) {
        console.error('[runExtraction API] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal ServerError', details: errorMessage }, { status: 500 });
    }
} 