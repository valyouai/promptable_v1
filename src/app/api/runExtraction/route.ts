import { NextRequest, NextResponse } from 'next/server';
import { ExtractionOrchestrator } from '@/server/llm/ExtractionOrchestrator';
import { parseMultipartFormData } from '@/server/utils/parseMultipart';
import type { PersonaType } from '@/server/llm/RelevanceFilteringAgent';

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
        const documentText = await parseMultipartFormData(file.name, buffer);

        const cognitiveKernelResult = await ExtractionOrchestrator.runExtraction(documentText, validatedPersona);

        return NextResponse.json(cognitiveKernelResult);
    } catch (err: unknown) {
        console.error('[runExtraction API] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        return NextResponse.json({ error: 'Internal ServerError', details: errorMessage }, { status: 500 });
    }
} 