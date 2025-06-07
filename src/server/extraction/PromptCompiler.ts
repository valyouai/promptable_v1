// src/server/extraction/PromptCompiler.ts

/**
 * Phase 4 - Prompt Compiler v1
 * 
 * This module dynamically assembles the ExtractionEngine system prompt,
 * allowing injection of schema rules, few-shot examples, role definitions,
 * and context-specific prompt segments.
 */

export class PromptCompiler {
    // Master compile entrypoint (now async because we're preparing for future persona-specific dynamic inserts)
    public static async compile(
        documentText: string,
        context: DocumentContext,
        persona: 'creator' | 'researcher' | 'educator'
    ): Promise<{ systemPrompt: string; userPrompt: string }> {
        switch (persona) {
            case 'creator':
                return this.compileCreator(documentText);
            case 'researcher':
            case 'educator':
                return this.compileCreator(documentText); // default passthrough for now
            default:
                throw new Error(`Unsupported persona: ${persona}`);
        }
    }

    // Creator Persona Prompt
    private static compileCreator(documentText: string): { systemPrompt: string; userPrompt: string } {
        const systemPrompt = `
You are an academic research extraction engine. Your task is to extract key concepts from research papers into a structured JSON object.

⚠️ OUTPUT RULES — STRICT JSON ENFORCEMENT:
- You MUST return only a single valid JSON object.
- DO NOT include any natural language, explanations, preambles, markdown, headings, or commentary.
- Output must begin with '{' and end with '}'.
- The entire output must be strictly parsable as valid JSON.

Here is the exact schema you must produce:

{
  "principles": [],
  "methods": [],
  "frameworks": [],
  "theories": [],
  "Research Objective": "",
  "Methods": "",
  "Dataset(s)": "",
  "Key Findings": "",
  "Limitations": "",
  "Future Work": "",
  "Applications": ""
}

Each field:
- "principles", "methods", "frameworks", "theories" → extract as arrays of strings.
- Remaining fields → extract as strings. If not found, output "Not explicitly mentioned." as the field value.
- Never omit fields, even if empty.

REMEMBER: DO NOT ADD ANY NON-JSON TEXT.
        `.trim();

        const userPrompt = `
Extract the key concepts from the following document and produce the required JSON object:

${documentText}
        `.trim();

        return { systemPrompt, userPrompt };
    }

    // Researcher Persona (placeholder: routes to creator template for now)
    private static async compileResearcher(documentText: string): Promise<{ systemPrompt: string; userPrompt: string }> {
        return this.compileCreator(documentText);
    }

    // Educator Persona (placeholder: routes to creator template for now)
    private static async compileEducator(documentText: string): Promise<{ systemPrompt: string; userPrompt: string }> {
        return this.compileCreator(documentText);
    }
}

// Export DocumentContext to prevent downstream type errors
export type DocumentContext = unknown;
