import type { ExtractedConcepts, PersonaType, GenerationConfig, TraceableConcept } from "@/types";

function sanitizeExtractedConcepts(concepts: ExtractedConcepts): ExtractedConcepts {
    console.log("[PATCH CHECK] SystemPromptBuilder.sanitizeExtractedConcepts ACTIVE - vNEW");
    // Helper to sanitize an array of TraceableConcepts by cleaning their .value property
    const sanitizeTraceableConceptArray = (arr?: TraceableConcept[]): TraceableConcept[] =>
        (arr || []).map(tc => ({
            ...tc,
            // Defensively handle cases where tc.value might be undefined or not a string
            value: (typeof tc.value === 'string' ? tc.value.replace(/[\r\n\t]/g, ' ').trim() : '')
        }));

    return {
        principles: sanitizeTraceableConceptArray(concepts.principles),
        methods: sanitizeTraceableConceptArray(concepts.methods),
        frameworks: sanitizeTraceableConceptArray(concepts.frameworks),
        theories: sanitizeTraceableConceptArray(concepts.theories),
        // Removed notes as it's not part of ExtractedConcepts type
    };
}

export function buildSystemPrompt(params: {
    extractedConcepts: ExtractedConcepts;
    persona: PersonaType;
    contentType: string;
    generationConfig: GenerationConfig;
}): string {
    console.log("[PATCH CHECK] SystemPromptBuilder.buildSystemPrompt ACTIVE - vNEW");
    const { extractedConcepts, persona, contentType, generationConfig } = params;
    const safeConcepts = sanitizeExtractedConcepts(extractedConcepts);

    // Helper to format an array of TraceableConcepts into a string list of their values
    const formatConceptList = (concepts?: TraceableConcept[]): string => {
        console.log("[PATCH CHECK] SystemPromptBuilder.formatConceptList ACTIVE - vNEW");
        if (!concepts || concepts.length === 0) return 'N/A';
        return concepts.map(tc => {
            // If tc.value is literally "[object Object]", replace it.
            // This indicates an upstream issue where an object was improperly stringified into a value.
            if (tc.value === "[object Object]") {
                console.warn(`[SystemPromptBuilder] formatConceptList: Found TraceableConcept.value as literal string "[object Object]". Replacing. Original tc: ${JSON.stringify(tc)}`);
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
    // Removed notes handling as it's not part of safeConcepts after sanitization

    if (Object.keys(generationConfig).length > 0) {
        prompt += `\nGeneration configuration provided: ${JSON.stringify(generationConfig)}. Incorporate these settings into the prompt as appropriate.`;
    }

    prompt += `\n\nYour task is to synthesize this information into a comprehensive and effective system prompt.`;
    prompt += `\nEnsure the generated prompt is clear, concise, and guides an LLM to perform its task effectively based on the provided context.`;

    return prompt;
} 