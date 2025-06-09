import type { ExtractedConcepts, PersonaType, GenerationConfig, TraceableConcept } from "@/types";

function sanitizeExtractedConcepts(concepts: ExtractedConcepts): ExtractedConcepts {
    // console.log("[PATCH CHECK] SystemPromptBuilder.sanitizeExtractedConcepts ACTIVE - vNEW"); // Removed
    const sanitizeTraceableConceptArray = (arr?: TraceableConcept[]): TraceableConcept[] =>
        (arr || []).map(tc => ({
            ...tc,
            value: (typeof tc.value === 'string' ? tc.value.replace(/[\r\n\t]/g, ' ').trim() : '')
        }));

    return {
        principles: sanitizeTraceableConceptArray(concepts.principles),
        methods: sanitizeTraceableConceptArray(concepts.methods),
        frameworks: sanitizeTraceableConceptArray(concepts.frameworks),
        theories: sanitizeTraceableConceptArray(concepts.theories),
    };
}

export function buildSystemPrompt(params: {
    extractedConcepts: ExtractedConcepts;
    persona: PersonaType;
    contentType: string;
    generationConfig: GenerationConfig;
}): string {
    // console.log("[PATCH CHECK] SystemPromptBuilder.buildSystemPrompt ACTIVE - vNEW"); // Removed
    const { extractedConcepts, persona, contentType, generationConfig } = params;
    const safeConcepts = sanitizeExtractedConcepts(extractedConcepts);

    const formatConceptList = (concepts?: TraceableConcept[]): string => {
        // console.log("[PATCH CHECK] SystemPromptBuilder.formatConceptList ACTIVE - vNEW"); // Removed
        if (!concepts || concepts.length === 0) return 'N/A';
        return concepts.map(tc => {
            if (tc.value === "[object Object]") {
                // Keep this warn: it means a TraceableConcept.value was exactly "[object Object]" when it reached here.
                console.warn(`[SystemPromptBuilder] formatConceptList: Found TraceableConcept.value as literal string "[object Object]". Replacing with placeholder.`);
                return "[Data Error: Object Stringified]";
            }
            return tc.value;
        }).join(', ');
    };

    let prompt = `You are an AI assistant for a ${persona} persona, specializing in ${contentType}.`;
    prompt += `\n\nHere are the extracted concepts from the document:\n`;
    prompt += `Principles: ${formatConceptList(safeConcepts.principles)}\n`;
    prompt += `Methods: ${formatConceptList(safeConcepts.methods)}\n`;
    prompt += `Frameworks: ${formatConceptList(safeConcepts.frameworks)}\n`;
    prompt += `Theories: ${formatConceptList(safeConcepts.theories)}\n`;

    if (Object.keys(generationConfig).length > 0) {
        prompt += `\nGeneration configuration provided: ${JSON.stringify(generationConfig)}. Incorporate these settings into the prompt as appropriate.`;
    }

    prompt += `\n\nYour task is to synthesize this information into a comprehensive and effective system prompt.`;
    prompt += `\nEnsure the generated prompt is clear, concise, and guides an LLM to perform its task effectively based on the provided context.`;

    return prompt;
} 