import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '@/server/llm/ExtractionOrchestrator';
import { parseMultipartFormData } from '@/server/utils/parseMultipart';
// Assuming ExtractionResult will be moved to a global types file, 
// for now, we might need to import it from its current location or define a placeholder
// if the global types file isn't updated first. 
// For this step, we'll assume the type will be available or that NextResponse.json handles it.

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // File parsing (PDF, DOCX, fallback to plain text)
        // This function will be created in the next step.
        const documentText = await parseMultipartFormData(file.name, buffer);

        // Full extraction kernel orchestration
        // Note: ExtractionOrchestrator.runExtraction returns Promise<ExtractionResult>
        // The ExtractionResult type from the orchestrator file will be used implicitly here.
        const extractionResult = await ExtractionOrchestrator.runExtraction(documentText);

        return NextResponse.json(extractionResult);
    } catch (err: unknown) {
        console.error('[runExtraction API] Error:', err);
        // Provide a more structured error response if possible
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
    }
} 