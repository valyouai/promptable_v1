import { NextRequest, NextResponse } from 'next/server';
import { buildSystemPrompt } from '@/server/llm/SystemPromptBuilder';
import { LLMAdapterRouter } from '@/server/llm/LLMAdapterRouter';
import type { ExtractedConcepts, PersonaType, GenerationConfig } from '@/types';

export async function POST(req: NextRequest) {
    console.log('[generate-system-prompt API] Received POST request.');
    try {
        const body = await req.json();

        // 🔧 17D HARNESS PATCH INJECTION — BEGIN
        if (process.env.TEST_MODE === 'true' && req.nextUrl.searchParams.get("forceError") === "true") {
            console.warn("[17D Test Harness] Simulated synthesis failure triggered.");
            return NextResponse.json({ error: "Simulated synthesis failure for 17D test." }, { status: 400 });
        }
        // 🔧 17D HARNESS PATCH INJECTION — END

        const { extractedConcepts, persona, contentType, generationConfig } = body;

        // Defensive type enforcement
        if (!extractedConcepts || !persona || !contentType) {
            return NextResponse.json(
                { error: 'Missing required fields: extractedConcepts, persona, or contentType.' },
                { status: 400 }
            );
        }

        const systemPrompt = buildSystemPrompt({
            extractedConcepts: extractedConcepts as ExtractedConcepts,
            persona: persona as PersonaType,
            contentType: contentType as string,
            generationConfig: generationConfig as GenerationConfig || {},
        });

        const response = await LLMAdapterRouter.call({
            systemPrompt: systemPrompt,
            userPrompt: ''
        });

        return NextResponse.json({ synthesizedPrompt: response });

    } catch (err: unknown) {
        console.error('[generate-system-prompt API] Server error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown internal server error';
        return NextResponse.json({ error: 'Internal ServerError', details: errorMessage }, { status: 500 });
    }
} 