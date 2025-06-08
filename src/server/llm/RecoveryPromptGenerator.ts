import type { DomainField } from './DomainSchema';
import type { ExtractedConcepts } from '@/types';

// More specific type for context to be passed for generation
export interface RecoveryPromptContext {
    targetField: DomainField;
    // Concepts already extracted that might be relevant (e.g., from dependent fields)
    relatedConcepts: Partial<ExtractedConcepts>;
    // Original document text, or relevant snippets, might be needed
    documentSnippet?: string;
    // Schema definition for the target field might also be useful context
    fieldSchemaDefinition?: unknown; // Could be a more specific type later
    // The persona for which we are generating content
    persona: 'creator' | 'researcher' | 'educator';
}

export interface GeneratedRecoveryPrompts {
    systemPrompt: string;
    userPrompt: string;
}

export class RecoveryPromptGenerator {
    public static generate(context: RecoveryPromptContext): GeneratedRecoveryPrompts {
        const { targetField, relatedConcepts, documentSnippet, persona } = context;

        // Basic system prompt - this will need significant refinement
        const systemPrompt = `You are an AI assistant specialized in recovering missing information for the field "${targetField}" based on related concepts and document context.
You are assisting the "${persona}" persona.
The goal is to extract or infer a plausible value for "${targetField}".
Focus only on the field: "${targetField}".
Respond with a JSON object containing a single key, "${targetField}", whose value is an array of strings.
Example: { "${targetField}": ["value1", "value2"] }
If no plausible value can be determined, return an empty array for "${targetField}".
Example: { "${targetField}": [] }
Do not include explanations or any other text outside the JSON object.`;

        // Basic user prompt - this will also need significant refinement
        let userPrompt = `Based on the following information, please provide a value for the field "${targetField}".\n\n`;

        if (Object.keys(relatedConcepts).length > 0) {
            userPrompt += `Relevant extracted concepts from related fields:\n${JSON.stringify(relatedConcepts, null, 2)}\n\n`;
        }

        if (documentSnippet) {
            userPrompt += `Excerpt from the original document that might contain information about "${targetField}":\n"${documentSnippet}"\n\n`;
        } else {
            userPrompt += `The original document context for "${targetField}" was not provided, but please attempt to infer it based on related concepts if possible.\n\n`;
        }

        userPrompt += `Generate the value for "${targetField}".`;

        return {
            systemPrompt: systemPrompt.trim(),
            userPrompt: userPrompt.trim(),
        };
    }
}

// Example usage (can be removed or moved to a test file later)
/*
const exampleContext: RecoveryPromptContext = {
    targetField: "methods" as DomainField,
    relatedConcepts: {
        principles: ["Zero-shot grafting"]
    },
    documentSnippet: "The paper discusses zero-shot grafting and its application in vision encoder training. Several novel methods are proposed...",
    persona: "researcher"
};

const prompts = RecoveryPromptGenerator.generate(exampleContext);
console.log("--- Generated Recovery Prompts ---");
console.log("System Prompt:\\n", prompts.systemPrompt);
console.log("\\nUser Prompt:\\n", prompts.userPrompt);
*/ 