import { ExtractedConcepts } from '@/types';
import { DocumentContext } from './PromptCompiler';
import { PromptCompiler } from './PromptCompiler';
import { AmbiguityDetectorAgent, type AmbiguityScore } from '@/server/llm/AmbiguityDetectorAgent';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { LLMAdapterRouter } from '@/server/llm/LLMAdapterRouter';
import { SchemaActivator } from './SchemaActivator';

// Obsolete type definitions like LLMResponseFormat and DEFAULT_EMPTY_CONCEPTS are removed.

export class ExtractionEngine {
    public static async extract(
        documentText: string,
        context: DocumentContext | undefined,
        persona: 'creator' | 'researcher' | 'educator'
    ): Promise<ExtractedConcepts> {
        const compiled = await PromptCompiler.compile(documentText, context, persona);
        const rawExtraction = await this.callLLM(compiled.systemPrompt, compiled.userPrompt);

        const normalized = this.normalize(rawExtraction);

        const schemaAligned = SchemaActivator.activate(persona, normalized);

        const ambiguities: AmbiguityScore[] = AmbiguityDetectorAgent.detectAmbiguities(schemaAligned);
        console.log('[AmbiguityDetectorAgent] Ambiguity scores:', ambiguities);

        // const reinforcedConcepts = await MultiPassRefinementAgent.reinforce(documentText, schemaAligned); // ENSURE THIS LINE IS COMMENTED
        const reinforcedConcepts = schemaAligned; // TEMP: Using schemaAligned directly

        const qaResult = await ExtractionQAAgent.validate(documentText, reinforcedConcepts); // Pass schemaAligned (now as reinforcedConcepts)
        return qaResult.validatedConcepts;
    }

    private static normalize(rawLLMOutput: unknown): Record<string, unknown> {
        if (typeof rawLLMOutput === 'object' && rawLLMOutput !== null) {
            // Check if it's the { output: "string_content_from_failed_repair" } case,
            // which OpenAIAdapter returns if all parsing/repair fails.
            if ('output' in rawLLMOutput && typeof (rawLLMOutput as { output: unknown }).output === 'string') {
                console.warn('[ExtractionEngine.normalize] LLM output was a string within an \'output\' property (likely from failed repair), returning empty concepts.');
                return {};
            }
            // Otherwise, assume rawLLMOutput is the actual JSON object (or a more complex object we can treat as Record).
            return rawLLMOutput as Record<string, unknown>;
        }
        console.warn('[ExtractionEngine.normalize] LLM output was not a usable object, returning empty concepts.');
        return {};
    }

    private static async callLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
        // Inject strict JSON output enforcement
        const enforcedSystemPrompt = `
${systemPrompt}

You MUST format your entire response as pure JSON.
Do not include markdown code blocks, explanations, or any non-JSON text.
If you cannot find a value for a field, return: "Not explicitly mentioned."
Do not add comments or escape characters.

ONLY return valid JSON as your full output.
        `.trim();

        // Directly return the Promise<unknown> from OpenAIAdapter.call
        return LLMAdapterRouter.call({
            systemPrompt: enforcedSystemPrompt,
            userPrompt
        });
    }
} 