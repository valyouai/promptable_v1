import { PromptCompiler, DocumentContext } from './PromptCompiler';
import { SchemaActivator } from './SchemaActivator';
import { PatternNormalizer } from './PatternNormalizer';
import { AmbiguityCatcher } from './AmbiguityCatcher';
import { MultiPassRefinementAgent } from './MultiPassRefinementAgent';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { ExtractedConcepts } from '@/types';

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
        // Replace this with your actual LLM call adapter
        // @ts-expect-error // Ignoring someLLMAPI as it's a placeholder
        const llmResponse = await someLLMAPI.call({
            systemPrompt: prompt,
            userPrompt: documentText
        });

        return llmResponse.output;
    }
} 