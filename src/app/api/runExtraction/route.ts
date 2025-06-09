import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '@/server/llm/ExtractionOrchestrator';
import type { PersonaType } from '@/types';
import { safeDecodeBuffer } from '@/lib/utils/SafeDocumentDecoder';

// Default PDF extraction microservice URL (can be overridden by environment variable)
const PDF_EXTRACTION_MICROSERVICE_URL = process.env.PDF_EXTRACTION_MICROSERVICE_URL || 'http://localhost:7000/api/extract-pdf-text';

async function parseMultipartFormData(fileName: string, fileBuffer: Buffer, fileType: string): Promise<string> {
    console.log(`[parseMultipartFormData] Received file: ${fileName}, type: ${fileType}`);
    const lowerFileName = fileName.toLowerCase();

    if (fileType === 'application/pdf' || lowerFileName.endsWith('.pdf')) {
        console.log(`[parseMultipartFormData] Routing PDF ${fileName} to microservice: ${PDF_EXTRACTION_MICROSERVICE_URL}.`);
        try {
            const fileObject = new File([fileBuffer], fileName, { type: 'application/pdf' });
            const nativeFormData = new FormData();
            nativeFormData.append('file', fileObject);

            const response = await fetch(PDF_EXTRACTION_MICROSERVICE_URL, {
                method: 'POST',
                body: nativeFormData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[parseMultipartFormData] Microservice error: ${response.status} - ${errorText}`);
                throw new Error(`PDF Microservice failed for ${fileName} with status ${response.status}: ${errorText}`);
            }
            const extractedText = await response.text();
            console.log(`[parseMultipartFormData] Successfully extracted text from PDF ${fileName}.`);
            return extractedText;
        } catch (error) {
            console.error(`[parseMultipartFormData] Error calling PDF microservice for ${fileName}:`, error);
            if (error instanceof Error) {
                throw new Error(`Failed to process PDF ${fileName}: ${error.message}`);
            }
            throw new Error(`An unknown error occurred while processing PDF ${fileName}.`);
        }
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || lowerFileName.endsWith('.docx')) {
        console.warn(`[parseMultipartFormData] DOCX processing for ${fileName} is not fully implemented. Using fallback decoder.`);
        return safeDecodeBuffer(fileBuffer);
    } else {
        console.log(`[parseMultipartFormData] Processing ${fileName} as plain text.`);
        return safeDecodeBuffer(fileBuffer);
    }
}

const ALLOWED_PERSONAS: PersonaType[] = ['educator', 'researcher', 'creator'];

// Persona mapping for numeric string inputs
const personaMap: Record<string, PersonaType> = {
    '1': 'creator',
    '2': 'educator',
    '3': 'researcher',
};

export async function POST(req: NextRequest) {
    console.log('[runExtraction API] Received POST request.');
    try {
        const formData = await req.formData();

        // 🔧 17D HARNESS PATCH INJECTION — BEGIN
        if (process.env.TEST_MODE === 'true' && req.nextUrl.searchParams.get("forceError") === "true") {
            console.warn("[17D Test Harness] Simulated extraction failure triggered.");
            return NextResponse.json({ error: "Simulated extraction failure for 17D test." }, { status: 500 });
        }
        // 🔧 17D HARNESS PATCH INJECTION — END

        const file = formData.get('file') as File;
        const personaValueFromForm = formData.get('persona') as string | null;

        // Apply mapping: if personaValueFromForm is "1", "2", or "3", it gets mapped.
        // Otherwise, use personaValueFromForm directly (handles cases like "creator", "educator", "researcher" or null).
        const mappedPersonaValue = personaValueFromForm ? (personaMap[personaValueFromForm] ?? personaValueFromForm) : null;

        const normalizedPersona = mappedPersonaValue?.trim().toLowerCase();

        console.log('[runExtraction API] Parsed FormData:', {
            fileName: file?.name,
            originalPersonaValue: personaValueFromForm,
            mappedPersonaValue: mappedPersonaValue,
            normalizedPersona
        });

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        if (!normalizedPersona) {
            return NextResponse.json({ error: 'No persona provided or persona could not be resolved' }, { status: 400 });
        }

        if (!ALLOWED_PERSONAS.includes(normalizedPersona as PersonaType)) {
            return NextResponse.json(
                { error: `Invalid persona "${normalizedPersona}". Allowed personas: ${ALLOWED_PERSONAS.join(', ')}` },
                { status: 400 }
            );
        }

        const validatedPersona = normalizedPersona as PersonaType;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`[runExtraction API] Invoking parser for file: ${file.name}`);
        const documentText = await parseMultipartFormData(file.name, buffer, file.type);

        const cognitiveKernelResult = await ExtractionOrchestrator.runExtraction(documentText, validatedPersona);
        return NextResponse.json(cognitiveKernelResult);
    } catch (err: unknown) {
        console.error('[runExtraction API] Server error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown internal server error';
        return NextResponse.json({ error: 'Internal ServerError', details: errorMessage }, { status: 500 });
    }
} 