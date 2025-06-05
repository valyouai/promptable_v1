import openaiClient from '@/lib/openai';
import type { ExtractedConcepts } from '@/types';
import { OpenAI } from 'openai'; // Import OpenAI namespace for types
import { config } from '@/lib/config'; // Added

// Define a more robust type for the expected LLM response structure
interface LLMResponseFormat {
    principles?: string[];
    methods?: string[];
    frameworks?: string[];
    theories?: string[];
}


export class ExtractionEngine {
    static async extract(documentText: string): Promise<ExtractedConcepts> {
        const systemPrompt = `You are an expert academic researcher. Your task is to meticulously analyze the provided document text and extract key concepts.
Identify and list the core principles, methods, frameworks, and theories discussed.
Present your findings in a structured JSON format, adhering strictly to the following schema:
{
  "principles": ["Principle 1", "Principle 2", ...],
  "methods": ["Method A", "Method B", ...],
  "frameworks": ["Framework X", "Framework Y", ...],
  "theories": ["Theory Alpha", "Theory Beta", ...]
}
If no concepts are found for a particular category, return an empty array for that category.
Ensure the output is ONLY the JSON object, with no additional commentary or explanatory text.`;

        try {
            const response: OpenAI.Chat.Completions.ChatCompletion = await openaiClient.chat.completions.create({
                model: config.openai.modelName, // Updated to use config
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: documentText },
                ],
                response_format: { type: 'json_object' }, // Request JSON output
                temperature: 0.2, // Lower temperature for more deterministic output
            });

            const content = response.choices[0]?.message?.content;

            if (!content) {
                console.error('[EXTRACTION] OpenAI API call succeeded but returned no content. Model:', config.openai.modelName);
                throw new Error('Extraction failed: No content received from LLM.');
            }

            let parsedContent: LLMResponseFormat;
            try {
                parsedContent = JSON.parse(content) as LLMResponseFormat;
            } catch (parseError) {
                console.error('[EXTRACTION] Failed to parse LLM response as JSON. Raw content:', content, 'Error:', parseError);
                throw new Error('Extraction failed: Could not parse LLM response.');
            }

            // Validate and normalize the parsed content
            const validatedConcepts: ExtractedConcepts = {
                principles: Array.isArray(parsedContent.principles) ? parsedContent.principles.filter(p => typeof p === 'string') : [],
                methods: Array.isArray(parsedContent.methods) ? parsedContent.methods.filter(m => typeof m === 'string') : [],
                frameworks: Array.isArray(parsedContent.frameworks) ? parsedContent.frameworks.filter(f => typeof f === 'string') : [],
                theories: Array.isArray(parsedContent.theories) ? parsedContent.theories.filter(t => typeof t === 'string') : [],
            };

            // Optional: Log if any category was missing or malformed, for debugging
            if (!parsedContent.principles || !parsedContent.methods || !parsedContent.frameworks || !parsedContent.theories) {
                console.warn('[EXTRACTION] LLM response might be missing some concept categories or had unexpected types. Raw parsed content:', parsedContent);
            }


            return validatedConcepts;

        } catch (error) {
            console.error('[EXTRACTION] Error during LLM-based concept extraction. Model:', config.openai.modelName, 'Error:', error);
            // Re-throw a more generic error or handle specific OpenAI errors
            if (error instanceof Error && error.message.startsWith('Extraction failed:')) {
                throw error;
            }
            throw new Error('Extraction failed due to an issue with the AI service.');
        }
    }
} 