import openai from './openai';
import { ExtractedConcepts, TraceableConcept } from '@/types';

/**
 * Sanitize array contents by filtering invalid values, trimming strings,
 * and converting them to TraceableConcept objects.
 */
function sanitizeAndConvertToTraceableConceptArray(arr: unknown[]): TraceableConcept[] {
    return arr
        .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
        .map(item => ({
            value: item.trim(),
            source: "N/A"
        }));
}

export async function extractConcepts(text: string): Promise<ExtractedConcepts> {
    const prompt = `Extract key concepts, principles, methods, and frameworks from the following research text.
  Format the output as a JSON object with keys: "principles", "methods", "frameworks", "theories".
  Each key should contain an array of strings. If a category is not found, provide an empty array.

  Research Text:
  """
  ${text}
  """

  JSON Output:`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            temperature: 0.2,
        });

        const rawResponse = completion.choices[0].message.content;
        if (!rawResponse) {
            throw new Error('No response from OpenAI for concept extraction.');
        }

        const parsedResponse = JSON.parse(rawResponse);

        const validatedConcepts: ExtractedConcepts = {
            principles: Array.isArray(parsedResponse.principles) ? sanitizeAndConvertToTraceableConceptArray(parsedResponse.principles) : [],
            methods: Array.isArray(parsedResponse.methods) ? sanitizeAndConvertToTraceableConceptArray(parsedResponse.methods) : [],
            frameworks: Array.isArray(parsedResponse.frameworks) ? sanitizeAndConvertToTraceableConceptArray(parsedResponse.frameworks) : [],
            theories: Array.isArray(parsedResponse.theories) ? sanitizeAndConvertToTraceableConceptArray(parsedResponse.theories) : [],
        };

        return validatedConcepts;
    } catch (error) {
        console.error('Error extracting concepts:', error);
        return { principles: [], methods: [], frameworks: [], theories: [] };
    }
}
