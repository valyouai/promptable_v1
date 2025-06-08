import { NextRequest, NextResponse } from 'next/server';
import { LLMAdapterRouter } from '@/server/llm/LLMAdapterRouter';
import type { ExtractedConcepts, PersonaType, SystemPromptResult, GenerationConfig } from '@/types';
import { buildSystemPrompt } from '@/server/llm/SystemPromptBuilder';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { extractedConcepts, persona, contentType, generationConfig } = body;

        const systemPrompt = buildSystemPrompt({ extractedConcepts, persona, contentType, generationConfig });
        const userPrompt = '';  // or whatever userPrompt you pass, if applicable

        const result = await LLMAdapterRouter.call({
            systemPrompt,
            userPrompt
        });

        // The LLMAdapterRouter.call returns { content: string }, so we need to wrap it into SystemPromptResult
        // for the frontend to correctly consume it.
        const finalResult: SystemPromptResult = {
            success: true,
            systemPrompt: (result as { content: string }).content, // Cast result to access content property
            extractedConcepts: extractedConcepts, // Re-use extractedConcepts from the request body
            metadata: { // Placeholder metadata - you might want to generate more robust metadata
                documentTitle: 'Generated Prompt',
                persona: persona,
                contentType: contentType,
                confidenceScore: 1.0, // Assuming high confidence for now
                timestamp: new Date().toISOString(),
            }
        };

        return NextResponse.json(finalResult);
    } catch (err: unknown) {
        console.error('[generate-system-prompt API] Error:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
    }
} 