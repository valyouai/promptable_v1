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

// Define the default empty concepts object at the very top of the file
const DEFAULT_EMPTY_CONCEPTS: ExtractedConcepts = {
    principles: [],
    methods: [],
    frameworks: [],
    theories: [],
};

export class ExtractionEngine {
    static async extract(documentText: string): Promise<ExtractedConcepts> {
        const systemPrompt = `
You are acting as an expert AI academic concept extractor.

Your task is to analyze academic, scientific, or technical text segments and extract any key academic concepts mentioned into one of the following 4 categories:

- Principles: Foundational laws, rules, or guiding truths that govern a field.
- Methods: Step-by-step techniques, procedures, or approaches used to accomplish tasks or research.
- Frameworks: Conceptual models or organized structures for understanding or approaching problems.
- Theories: Formalized explanations or models supported by evidence that explain phenomena.

Only include items that are explicitly or strongly implied in the text. Do not infer missing content.

## OUTPUT INSTRUCTIONS

You must output a single valid JSON object with this format:

{
  "principles": ["..."],
  "methods": ["..."],
  "frameworks": ["..."],
  "theories": ["..."]
}

If no items exist for a category, return an empty array for that category.

DO NOT include any explanations, commentary, or non-JSON output.

## EXAMPLES

### Example 1 (simple extraction):

Input:

"The scientific method involves observation, hypothesis formation, experimentation, and analysis. Newton's laws form the basis of classical mechanics."

Output:

{
  "principles": ["Newton's laws of motion"],
  "methods": ["Scientific method"],
  "frameworks": [],
  "theories": []
}

### Example 2 (empty categories allowed):

Input:

"This article discusses emerging trends in deep learning for image processing."

Output:

{
  "principles": [],
  "methods": [],
  "frameworks": [],
  "theories": []
}

### Example 3 (multiple items):

Input:

"Grounded theory is widely used in qualitative research. The researcher followed an iterative coding process. Cognitive load theory informs instructional design."

Output:

{
  "principles": [],
  "methods": ["Iterative coding process"],
  "frameworks": [],
  "theories": ["Grounded theory", "Cognitive load theory"]
}

---

You will now be provided with academic text segments to process.
Carefully extract any principles, methods, frameworks, or theories present.
Your output must always follow the JSON format described above.
Do not output anything else.
`;

        let safeInputText = documentText;
        let currentTokenCount = 0;
        const maxTokens = 50000; // Updated from 12000 to 50000
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
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(`[EXTRACTION] Error during token budgeting (using tokenizer helper): ${errorMessage}`, e);
            console.warn('[EXTRACTION] Proceeding with original (potentially unbudgeted) document text due to tokenization error.');
            // If token budgeting fails, it might still proceed, but could error out in the API call if text is too large.
            return DEFAULT_EMPTY_CONCEPTS; // Ensure return on error
        }
        // Removed the finally block as .free() is not needed

        try {
            // Log API Key (masked) and request details
            const apiKey = process.env.OPENAI_API_KEY || 'NOT_SET';
            const maskedApiKey = apiKey.startsWith('sk-') ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : apiKey;
            console.log(`[EXTRACTION] Attempting OpenAI API call. API Key (from env): ${maskedApiKey}, Model: ${modelName}`);
            console.log(`[EXTRACTION] System Prompt (length: ${systemPrompt.length}):\n${systemPrompt}`);
            console.log(`[EXTRACTION] User Content (first 500 chars of ${safeInputText.length} total chars):\n${safeInputText.substring(0, 500)}`);

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
            console.log('[EXTRACTION] Raw OpenAI API response content:', content); // Log raw content

            if (!content) {
                console.error('[EXTRACTION] OpenAI API call succeeded but returned no content. Model:', modelName);
                return DEFAULT_EMPTY_CONCEPTS; // Use top-level default
            }

            let parsedContent: LLMResponseFormat;
            try {
                parsedContent = JSON.parse(content) as LLMResponseFormat;
            } catch (parseError: unknown) {
                const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                console.error(`[EXTRACTION] Failed to parse LLM response as JSON. Raw content: ${content}. Parse Error: ${errorMessage}`, parseError);
                return DEFAULT_EMPTY_CONCEPTS; // Use top-level default
            }

            // Initialize validatedConcepts and assign properties individually
            const validatedConcepts: ExtractedConcepts = {
                principles: [],
                methods: [],
                frameworks: [],
                theories: [],
            };

            if (Array.isArray(parsedContent.principles)) {
                validatedConcepts.principles = parsedContent.principles.filter(p => typeof p === 'string');
            }
            if (Array.isArray(parsedContent.methods)) {
                validatedConcepts.methods = parsedContent.methods.filter(m => typeof m === 'string');
            }
            if (Array.isArray(parsedContent.frameworks)) {
                validatedConcepts.frameworks = parsedContent.frameworks.filter(f => typeof f === 'string');
            }
            if (Array.isArray(parsedContent.theories)) {
                validatedConcepts.theories = parsedContent.theories.filter(t => typeof t === 'string');
            }

            if (Object.keys(parsedContent).length === 0) {
                console.warn('[EXTRACTION] LLM response parsed to an empty object. Raw parsed content:', parsedContent);
            } else {
                // Log if any specific category is missing, which is acceptable if truly no concepts found for it
                if (!parsedContent.principles) {
                    console.log("[EXTRACTION] Note: 'principles' field was not present in LLM JSON response.");
                }
                if (!parsedContent.methods) {
                    console.log("[EXTRACTION] Note: 'methods' field was not present in LLM JSON response.");
                }
                if (!parsedContent.frameworks) {
                    console.log("[EXTRACTION] Note: 'frameworks' field was not present in LLM JSON response.");
                }
                if (!parsedContent.theories) {
                    console.log("[EXTRACTION] Note: 'theories' field was not present in LLM JSON response.");
                }
            }

            return validatedConcepts;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[EXTRACTION] Error during LLM-based concept extraction or response processing. Model: ${modelName}. Full Error: ${errorMessage}`, error);
            return DEFAULT_EMPTY_CONCEPTS; // Use top-level default
        }
    }
} 