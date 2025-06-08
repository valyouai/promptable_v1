import type { ExtractedConcepts, PersonaType, GenerationConfig } from "@/types";

function sanitizeExtractedConcepts(concepts: ExtractedConcepts): ExtractedConcepts {
    const sanitize = (arr?: string[]) =>
        (arr || []).map(item => item.replace(/[\r\n\t]/g, ' ').trim());

    return {
        principles: sanitize(concepts.principles),
        methods: sanitize(concepts.methods),
        frameworks: sanitize(concepts.frameworks),
        theories: sanitize(concepts.theories),
        notes: concepts.notes?.replace(/[\r\n\t]/g, ' ').trim(),
    };
}

export function buildSystemPrompt(params: {
    extractedConcepts: ExtractedConcepts;
    persona: PersonaType;
    contentType: string;
    generationConfig: GenerationConfig;
}): string {
    const { extractedConcepts, persona, contentType, generationConfig } = params;
    const safeConcepts = sanitizeExtractedConcepts(extractedConcepts);

    // TODO: Implement sophisticated system prompt generation logic here
    // This is a placeholder, you'll want to use the safeConcepts, persona,
    // contentType, and generationConfig to craft a dynamic and effective prompt.

    let prompt = `You are an AI assistant for a ${persona} persona, specializing in ${contentType}.`;
    prompt += `\n\nHere are the extracted concepts from the document:\n`;
    prompt += `Principles: ${safeConcepts.principles?.join(', ') || 'N/A'}\n`;
    prompt += `Methods: ${safeConcepts.methods?.join(', ') || 'N/A'}\n`;
    prompt += `Frameworks: ${safeConcepts.frameworks?.join(', ') || 'N/A'}\n`;
    prompt += `Theories: ${safeConcepts.theories?.join(', ') || 'N/A'}\n`;
    if (safeConcepts.notes) {
        prompt += `Notes: ${safeConcepts.notes}\n`;
    }

    if (Object.keys(generationConfig).length > 0) {
        prompt += `\nGeneration configuration provided: ${JSON.stringify(generationConfig)}. Incorporate these settings into the prompt as appropriate.`;
    }

    prompt += `\n\nYour task is to synthesize this information into a comprehensive and effective system prompt.`;
    prompt += `\nEnsure the generated prompt is clear, concise, and guides an LLM to perform its task effectively based on the provided context.`;

    return prompt;
} 