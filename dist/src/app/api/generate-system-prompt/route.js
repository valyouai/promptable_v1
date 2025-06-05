import { NextResponse } from 'next/server';
import { generateSystemPrompt } from '@/lib/prompt-templates';
import { transformInsights } from '@/lib/contextual-transformer';
export async function POST(request) {
    try {
        const { documentId, // eslint-disable-line @typescript-eslint/no-unused-vars
        persona, contentType: rawContentType, // Rename to rawContentType to avoid conflict
        focusAreas, complexityLevel, outputStyle, extractedConcepts, // Assuming frontend passes this directly for MVP
         } = await request.json();
        const contentType = rawContentType; // Explicitly cast to ContentType
        console.log('API received data:', { persona, contentType, extractedConcepts: !!extractedConcepts });
        if (!persona || !contentType || !extractedConcepts) {
            return NextResponse.json({ error: 'Missing required generation parameters or extracted concepts.' }, { status: 400 });
        }
        const transformedConcepts = await transformInsights(extractedConcepts, persona, contentType);
        const config = {
            // persona: persona, // Removed from config
            // contentType: contentType, // Removed from config
            focusAreas: focusAreas || [], // Ensure focusAreas is an array
            complexityLevel: complexityLevel || 'intermediate',
            outputStyle: outputStyle || 'directive',
        };
        const systemPrompt = await generateSystemPrompt(transformedConcepts, persona, contentType, config);
        return NextResponse.json({
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
        });
    }
    catch (error) {
        console.error('Error generating system prompt:', error);
        return NextResponse.json({ error: 'Failed to generate system prompt.' }, { status: 500 });
    }
}
