import { ExtractedConcepts, TraceableConcept } from "@/types"; // PersonaType was already removed, ensure other imports are needed.

// const CANONICAL_KEYS: (keyof ExtractedConcepts)[] = ["principles", "methods", "frameworks", "theories", "notes"]; // Removed as it was unused

export class PromptCompilerV1 {
    /**
     * Generates the system prompt for the LLM, instructing it on how to extract concepts
     * and the expected JSON output format based on the canonical schema.
     *
     * @returns A string representing the system prompt.
     */
    public static getExtractionSystemPrompt(): string {
        const schemaExample: ExtractedConcepts = {
            principles: ["Example Principle 1", "Example Principle 2"].map(s => ({ value: s, source: "SchemaExample" } as TraceableConcept)),
            methods: ["Example Method A", "Example Method B"].map(s => ({ value: s, source: "SchemaExample" } as TraceableConcept)),
            frameworks: ["Example Framework X", "Example Framework Y"].map(s => ({ value: s, source: "SchemaExample" } as TraceableConcept)),
            theories: ["Example Theory Alpha", "Example Theory Beta"].map(s => ({ value: s, source: "SchemaExample" } as TraceableConcept)),
            // notes: "Optional brief summary or context if applicable..." // Removed notes field
        };

        const prompt = `
Your task is to carefully read the provided academic text and extract key conceptual information. 
Focus on identifying the following categories: principles, methods, frameworks, and theories discussed or proposed in the text.

Please structure your output as a single JSON object. The JSON object must adhere to the following schema:

{
  "principles": ["string", ...], // An array of strings. List core principles, ideas, or axioms.
  "methods": ["string", ...],    // An array of strings. List methodologies, techniques, or approaches used or described.
  "frameworks": ["string", ...], // An array of strings. List conceptual models, systems, or architectures.
  "theories": ["string", ...],   // An array of strings. List underlying theories or theoretical bases.
  "notes": "string"             // Optional. A brief summary or any relevant context. Omit or use an empty string if not applicable.
}

Key Instructions:
1.  **Accuracy**: Ensure the extracted information accurately reflects the content of the text.
2.  **Completeness**: Extract all relevant items for each category.
3.  **Conciseness**: Keep the extracted strings concise and to the point.
4.  **Format Adherence**: Strictly follow the JSON structure provided above. All main keys ("principles", "methods", "frameworks", "theories") must be present, and their values must be arrays of strings. If no items are found for a category, provide an empty array (e.g., "principles": []).
5.  **String Values**: Ensure all items within the arrays are strings.
6.  **No Extra Keys**: Do not include any keys in the JSON output other than "principles", "methods", "frameworks", "theories", and "notes".

Further Clarifications and Guidance:

**Field Synonyms & Normalization:**
For clarification, here are some acceptable alternate phrasings you may encounter:
- "principles" may also be referred to as "key principles", "core ideas", "primary ideas".
- "methods" may also be "methodologies", "approaches", "strategies", "techniques", "tools".
- "frameworks" may also be "models", "system frameworks", "architectures", "modeling approaches".
- "theories" may also be "theoretical basis", "underlying theories", "relevant theories", "supporting theories", "theoretical concepts".

IMPORTANT: You must normalize all such synonyms encountered in the text into the canonical key names as shown in the schema: "principles", "methods", "frameworks", "theories".

**Extraction Focus:**
You may take your time in extraction reasoning. Prioritize correct field placement and adherence to the schema over verbosity. Avoid over-explaining or adding any commentary outside of the 'notes' field within the JSON. Only output the final JSON object.

Example of a well-formatted response:
${JSON.stringify(schemaExample, null, 2)}

If a category is not mentioned or not applicable, return an empty array for that category. For example, if no specific frameworks are identified, your response should include "frameworks": [].
Avoid introductory phrases like "Here is the JSON:" or any text outside the JSON object itself.
Only output the JSON object.
`;
        return prompt.trim();
    }

    // Future methods for more complex prompt compilation, incorporating user context, persona, etc., can be added here.
    // public static compilePersonaPrompt(persona: string, contentType: string, userQuery: string): string {
    //     // ...
    // }
}

// Example usage (for testing or direct use):
// const systemPrompt = PromptCompilerV1.getExtractionSystemPrompt();
// console.log(systemPrompt); 