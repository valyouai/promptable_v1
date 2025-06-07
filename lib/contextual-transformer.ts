import { DeepSeekAdapter } from '@/server/adapters/DeepSeekAdapter';
import type { ExtractedConcepts } from '@/types';
import type { Persona, ContentType } from './prompt-templates';

// Define the expected output structure from the LLM for transformed concepts
export interface TransformedLLMConcepts {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
    // Add 'notes: string[]' or 'notes: string' here if DeepSeek is expected to transform/return notes
    // and if the rest of the system expects it in this transformed object.
}

// Updated createErrorFallback to use ExtractedConcepts and improve type safety
function createErrorFallback(rawConcepts: ExtractedConcepts): TransformedLLMConcepts {
    const fallback: TransformedLLMConcepts = {
        principles: [],
        methods: [],
        frameworks: [],
        theories: [],
    };

    // Iterate over the keys expected in TransformedLLMConcepts to populate the fallback
    (Object.keys(fallback) as Array<keyof TransformedLLMConcepts>).forEach(key => {
        const rawValue = rawConcepts[key];
        if (Array.isArray(rawValue)) {
            // Ensure that rawValue is treated as string[] before mapping
            fallback[key] = (rawValue as string[]).map(() => "[Transformation Error]");
        }
        // If a key in TransformedLLMConcepts corresponds to a non-array (and non-notes) rawValue,
        // it will correctly remain an empty array as initialized in fallback.
    });
    return fallback;
}

export async function transformInsights(
    persona: Persona, // Using imported Persona type
    contentType: ContentType, // Using imported ContentType type
    rawConcepts: ExtractedConcepts // Using imported ExtractedConcepts type for input clarity
): Promise<TransformedLLMConcepts> { // Return type updated

    console.log(`[transformInsights] Starting transformation for Persona: ${persona}, ContentType: ${contentType}`);
    console.log('[transformInsights] Received rawConcepts:', JSON.stringify(rawConcepts, null, 2));

    const systemMessage = `
You are a persona transformer.

You will receive extracted research concepts that need to be rephrased and adapted for the target persona and content type.

Persona: ${persona}
Content Type: ${contentType}

Your task:

- Transform each insight into persona-appropriate phrasing.
- Maintain clear, actionable language.
- Preserve the intent of the original concept.
- Do not add speculative information.
- Output MUST follow strict JSON format.

Return only valid JSON with this exact schema:

{
  "principles": [ "transformed insight", ... ],
  "methods": [ "transformed insight", ... ],
  "frameworks": [ "transformed insight", ... ],
  "theories": [ "transformed insight", ... ]
}

If a category is empty, return an empty array.
`;

    const userMessage = `Raw extracted concepts:\n\n${JSON.stringify(rawConcepts, null, 2)}`;

    try {
        // The DeepSeekAdapter.callChatModel now needs to be passed an object as its first argument.
        // The new signature for callChatModel in the user's plan is: 
        // callChatModel(params: { model, messages, temperature?, response_format? })
        const response = await DeepSeekAdapter.callChatModel({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage }
            ],
            temperature: 0.25,
            // response_format is passed here as per user's plan for transformInsights
            // The adapter will need to be updated to accept this in its params object.
            response_format: { type: 'json_object' },
        });

        if (!response.content) {
            console.error('[transformInsights] DeepSeek returned no content.');
            throw new Error('No content returned from DeepSeek for transformation.');
        }

        const parsed = JSON.parse(response.content) as TransformedLLMConcepts;

        // Basic validation of the parsed structure
        const requiredKeys: Array<keyof TransformedLLMConcepts> = ["principles", "methods", "frameworks", "theories"];
        for (const key of requiredKeys) {
            if (!parsed.hasOwnProperty(key) || !Array.isArray(parsed[key])) {
                console.error(`[transformInsights] Parsed DeepSeek response missing or has malformed key: ${key}. Response:`, parsed);
                throw new Error(`Invalid JSON structure from DeepSeek: Missing or malformed key '${key}'.`);
            }
        }

        console.log('[transformInsights] Successfully parsed JSON output from DeepSeek:', parsed);
        return parsed;

    } catch (err) {
        console.error('[transformInsights] Failed during DeepSeek call or JSON parsing:', err);
        // Return a structured error fallback that matches TransformedLLMConcepts type
        return createErrorFallback(rawConcepts);
    }
} 