import { PromptCompiler } from './PromptCompiler';
import { SchemaActivator } from './SchemaActivator';
import { PatternNormalizer } from './PatternNormalizer';
import { AmbiguityCatcher } from './AmbiguityCatcher';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { ExtractedConcepts } from '@/types';
import openaiClient from '@/lib/openai';
import { OpenAI } from 'openai'; // Import OpenAI namespace for types
import { config } from '@/lib/config';
import { encodeText, decodeTokens, countTokens } from '@/lib/tokenizer';

// Obsolete type definitions like LLMResponseFormat and DEFAULT_EMPTY_CONCEPTS are removed.

export class ExtractionEngine {
    static async extract(documentText: string, context: any): Promise<ExtractedConcepts> {
        // Compile new Phase 4 system prompt
        const compiledPrompt = PromptCompiler.compile(context);

        // Call LLM with compiled prompt and document text
        const rawExtraction = await this.callLLM(compiledPrompt, documentText);

        // Apply normalization and schema activation layers
        const normalized = PatternNormalizer.normalize(rawExtraction);
        const schemaAligned = SchemaActivator.activate(normalized);

        // Phase 4B Injection — Soft ambiguity detection
        const ambiguities = AmbiguityCatcher.detectAmbiguities(schemaAligned);
        if (ambiguities.length > 0) {
            console.warn('Ambiguity warnings:', ambiguities);
        }

        // Pass to QA layer
        const qaResult = await ExtractionQAAgent.validate(documentText, schemaAligned as ExtractedConcepts);

        // Use validatedConcepts from qaResult
        const finalOutput = qaResult.validatedConcepts;

        return finalOutput;
    }

    private static async callLLM(systemPrompt: string, documentText: string): Promise<Record<string, any>> {
        let safeInputText = documentText;
        const maxTokens = 50000; // As per previous implementation detail
        const modelName = config.openai.modelName;

        try {
            const currentTokenCount = countTokens(documentText, modelName);
            if (currentTokenCount > maxTokens) {
                console.warn(`[ExtractionEngine.callLLM] Document text with ${currentTokenCount} tokens exceeds max token budget of ${maxTokens}. Truncating.`);
                const encodedTokens = encodeText(documentText, modelName);
                const truncatedEncodedTokens = encodedTokens.slice(0, maxTokens);
                safeInputText = decodeTokens(truncatedEncodedTokens, modelName);
                console.log(`[ExtractionEngine.callLLM] Truncated document text to approx. ${maxTokens} tokens. New length: ${safeInputText.length} chars.`);
            } else {
                console.log(`[ExtractionEngine.callLLM] Document text with ${currentTokenCount} tokens is within budget for ${modelName}. No truncation needed.`);
            }
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.error(`[ExtractionEngine.callLLM] Error during token budgeting: ${errorMessage}`, e);
            // Return empty object if tokenization fails, to allow pipeline to continue if possible or fail gracefully.
            return {};
        }

        try {
            const apiKey = process.env.OPENAI_API_KEY || 'NOT_SET';
            const maskedApiKey = apiKey.startsWith('sk-') ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)}` : apiKey;
            console.log(`[ExtractionEngine.callLLM] Attempting OpenAI API call. API Key (masked): ${maskedApiKey}, Model: ${modelName}`);
            // Log snippets for prompts to avoid overly verbose logs
            console.log(`[ExtractionEngine.callLLM] System Prompt (first 200 chars of ${systemPrompt.length}):\n${systemPrompt.substring(0, 200)}...`);
            console.log(`[ExtractionEngine.callLLM] User Content (first 200 chars of ${safeInputText.length}):\n${safeInputText.substring(0, 200)}...`);

            const response: OpenAI.Chat.Completions.ChatCompletion = await openaiClient.chat.completions.create({
                model: modelName,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: safeInputText },
                ],
                response_format: { type: 'json_object' }, // Assuming JSON output is still desired
                temperature: 0.2, // As per previous implementation detail
            });

            const content = response.choices[0]?.message?.content;
            console.log('[ExtractionEngine.callLLM] Raw OpenAI API response content (first 200 chars):', content ? content.substring(0, 200) + '...' : 'No content received');

            if (!content) {
                console.error('[ExtractionEngine.callLLM] OpenAI API call succeeded but returned no content.');
                return {}; // Return empty object if no content
            }

            let parsedContent: Record<string, any>;
            try {
                parsedContent = JSON.parse(content);
            } catch (parseError: unknown) {
                const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
                console.error(`[ExtractionEngine.callLLM] Failed to parse LLM response as JSON. Raw content snippet: ${content.substring(0, 200)}... Error: ${errorMessage}`, parseError);
                return {}; // Return empty object if parsing fails
            }

            return parsedContent;

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`[ExtractionEngine.callLLM] Error during LLM API call or response processing: ${errorMessage}`, error);
            return {}; // Return empty object on other errors
        }
    }
} 