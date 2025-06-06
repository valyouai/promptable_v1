import { PromptCompiler, DocumentContext } from './PromptCompiler';
import { SchemaActivator } from './SchemaActivator';
import { PatternNormalizer } from './PatternNormalizer';
import { AmbiguityCatcher } from './AmbiguityCatcher';
import { MultiPassRefinementAgent } from './MultiPassRefinementAgent';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { ExtractedConcepts } from '@/types';
import { OpenAIAdapter } from '../llm/OpenAIAdapter';

// Helper type guard to check for Record<string, unknown>
function isRecordStringUnknown(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Obsolete type definitions like LLMResponseFormat and DEFAULT_EMPTY_CONCEPTS are removed.

export class ExtractionEngine {
    static async extract(documentText: string, context: DocumentContext): Promise<ExtractedConcepts> {
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

        // 🧪 Phase 5: Multi-pass refinement (New)
        const reinforcedConcepts = await MultiPassRefinementAgent.reinforce(documentText, schemaAligned as ExtractedConcepts);

        // Pass to QA layer, now with reinforcedConcepts (Updated)
        const qaResult = await ExtractionQAAgent.validate(documentText, reinforcedConcepts);

        // Use validatedConcepts from qaResult
        const finalOutput = qaResult.validatedConcepts;

        return finalOutput;
    }

    private static async callLLM(prompt: string, documentText: string): Promise<Record<string, any>> {
        const llmResponseUnknown: unknown = await OpenAIAdapter.call({
            systemPrompt: prompt,
            userPrompt: documentText
        });

        // Check for OpenAIAdapter's fallback structure: { output: string }
        if (
            typeof llmResponseUnknown === 'object' &&
            llmResponseUnknown !== null &&
            'output' in llmResponseUnknown &&
            typeof (llmResponseUnknown as { output: unknown }).output === 'string' &&
            Object.keys(llmResponseUnknown).length === 1
        ) {
            console.warn('[ExtractionEngine.callLLM] LLM response was not valid JSON and matched fallback. Content:', (llmResponseUnknown as { output: string }).output);
            return {};
        }

        // Check if it's a general record (expected for successful JSON parse of an object)
        if (isRecordStringUnknown(llmResponseUnknown)) {
            // This cast aligns with the method's declared return type Promise<Record<string, any>>.
            // The 'any' here is inherited from that signature.
            return llmResponseUnknown as Record<string, any>;
        }

        console.warn('[ExtractionEngine.callLLM] LLM response was not the expected Record<string, any> structure after parsing. Received:', llmResponseUnknown);
        return {};
    }
} 