import { NextResponse } from 'next/server';
import { generateSystemPrompt, Persona, ContentType, GenerationConfig } from '@/lib/prompt-templates';
import { ExtractedConcepts } from '@/types';
import { transformInsights, TransformedConcepts } from '@/lib/contextual-transformer';

export async function POST(request: Request) {
    try {
        const {
            documentId, // eslint-disable-line @typescript-eslint/no-unused-vars
            persona,
            contentType: rawContentType, // Rename to rawContentType to avoid conflict
            focusAreas,
            complexityLevel,
            outputStyle,
            extractedConcepts, // Assuming frontend passes this directly for MVP
        }: {
            documentId?: string;
            persona: Persona; // Use imported Persona type
            contentType: string; // Keep as string for request parsing
            focusAreas: string[];
            complexityLevel: GenerationConfig['complexityLevel']; // Use from imported GenerationConfig
            outputStyle: GenerationConfig['outputStyle'];       // Use from imported GenerationConfig
            extractedConcepts: ExtractedConcepts;
        } = await request.json();

        const contentType: ContentType = rawContentType as ContentType; // Explicitly cast to ContentType

        console.log('API received data:', { persona, contentType, extractedConcepts: !!extractedConcepts });

        if (!persona || !contentType || !extractedConcepts) {
            return NextResponse.json({ error: 'Missing required generation parameters or extracted concepts.' }, { status: 400 });
        }

        const transformedConcepts: TransformedConcepts = await transformInsights(extractedConcepts, persona, contentType);

        const config: GenerationConfig = {
            // persona: persona, // Removed from config
            // contentType: contentType, // Removed from config
            focusAreas: focusAreas || [], // Ensure focusAreas is an array
            complexityLevel: complexityLevel || 'intermediate',
            outputStyle: outputStyle || 'directive',
        };

        const systemPrompt = await generateSystemPrompt(transformedConcepts, persona, contentType, config);

        const responsePayload = {
            success: true,
            systemPrompt,
            extractedConcepts: transformedConcepts,
            metadata: {
                documentTitle: "Generated Prompt", // Placeholder for MVP
                persona,
                contentType,
                confidenceScore: 1.0, // Placeholder for MVP
                timestamp: new Date().toISOString(),
            },
        };

        console.log('[API /generate-system-prompt] Response payload being sent to client:', JSON.stringify(responsePayload, null, 2));

        return NextResponse.json(responsePayload);
    } catch (error) {
        console.error('Error generating system prompt:', error);
        return NextResponse.json({ error: 'Failed to generate system prompt.' }, { status: 500 });
    }
} 