import openaiClient from '@/lib/openai';
import type { ExtractedConcepts } from '@/types';
import { OpenAI } from 'openai'; // Import OpenAI namespace for types
import { config } from '@/lib/config';
import { encodeText, decodeTokens, countTokens } from '@/lib/tokenizer'; // Use the new tokenizer helper
// TextDecoder might not be needed if tiktoken-node decodes to string directly
// import { TextDecoder } from 'util'; 

// Unused imports from tiktoken-node are removed

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

        let safeInputText = documentText;
        let currentTokenCount = 0;
        const maxTokens = 12000; // Example safe budget
        const modelName = config.openai.modelName; // Get modelName for tokenizer

        try {
            currentTokenCount = countTokens(documentText, modelName);

            if (currentTokenCount > maxTokens) {
                console.warn(`[EXTRACTION] Document text with ${currentTokenCount} tokens exceeds max token budget of ${maxTokens}. Truncating.`);
                const encodedTokens = encodeText(documentText, modelName);
                const truncatedEncodedTokens = encodedTokens.slice(0, maxTokens);
                safeInputText = decodeTokens(truncatedEncodedTokens, modelName);
                console.log(`[EXTRACTION] Truncated document text to approx. ${maxTokens} tokens. New length: ${safeInputText.length} chars.`);
            } else {
                console.log(`[EXTRACTION] Document text with ${currentTokenCount} tokens is within budget. No truncation needed.`);
            }
        } catch (e) {
            console.error('[EXTRACTION] Error during token budgeting (using tokenizer helper):', e);
            currentTokenCount = -1; // Indicate that token budgeting failed or was skipped
            console.warn('[EXTRACTION] Proceeding with original (potentially unbudgeted) document text due to tokenization error.');
            // safeInputText remains documentText (initialized above)
        }
        // Removed the finally block as .free() is not needed

        try {
            const response: OpenAI.Chat.Completions.ChatCompletion = await openaiClient.chat.completions.create({
                model: modelName, // Use the same modelName variable
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: safeInputText },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
            });

            const content = response.choices[0]?.message?.content;

            if (!content) {
                console.error('[EXTRACTION] OpenAI API call succeeded but returned no content. Model:', modelName);
                throw new Error('Extraction failed: No content received from LLM.');
            }

            let parsedContent: LLMResponseFormat;
            try {
                parsedContent = JSON.parse(content) as LLMResponseFormat;
            } catch (parseError) {
                console.error('[EXTRACTION] Failed to parse LLM response as JSON. Raw content:', content, 'Error:', parseError);
                throw new Error('Extraction failed: Could not parse LLM response.');
            }

            const validatedConcepts: ExtractedConcepts = {
                principles: Array.isArray(parsedContent.principles) ? parsedContent.principles.filter(p => typeof p === 'string') : [],
                methods: Array.isArray(parsedContent.methods) ? parsedContent.methods.filter(m => typeof m === 'string') : [],
                frameworks: Array.isArray(parsedContent.frameworks) ? parsedContent.frameworks.filter(f => typeof f === 'string') : [],
                theories: Array.isArray(parsedContent.theories) ? parsedContent.theories.filter(t => typeof t === 'string') : [],
            };

            if (!parsedContent.principles || !parsedContent.methods || !parsedContent.frameworks || !parsedContent.theories) {
                console.warn('[EXTRACTION] LLM response might be missing some concept categories or had unexpected types. Raw parsed content:', parsedContent);
            }

            return validatedConcepts;

        } catch (error) {
            console.error('[EXTRACTION] Error during LLM-based concept extraction. Model:', modelName, 'Error:', error);
            if (error instanceof Error && error.message.startsWith('Extraction failed:')) {
                throw error;
            }
            throw new Error('Extraction failed due to an issue with the AI service.');
        }
    }
} 