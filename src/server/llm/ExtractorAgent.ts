import type { ExtractedConcepts } from '@/types';
// DOMAIN_SCHEMA import removed as it's not used in the new extract method.
import { LLMAdapterRouter } from './LLMAdapterRouter';
import { jsonrepair } from 'jsonrepair';
// import type OpenAI from 'openai'; // Keep for ChatCompletionMessageParam type if DeepSeekAdapter reuses it -> Removing as changing messages type

function stripMarkdownWrappers(raw: string): string {
    if (typeof raw !== 'string') {
        return raw; // Or handle as an error, or return empty string
    }
    return raw
        .replace(/^\s*```(?:json)?\s*/i, '')  // Remove starting code block
        .replace(/\s*```$/i, '');             // Remove ending code block
}

export class ExtractorAgent {
    public static async extract(chunkText: string): Promise<ExtractedConcepts> {
        // 4.a Combine the chunks into full document text
        // const documentText = chunks.join(" "); // Removed this line

        // 4.b Construct schema-constrained prompt
        const promptForSystem = `
You are an AI research extraction agent.

Given the following research text, extract the concepts into the following structured schema:

{
  "principles": [...],
  "methods": [...],
  "frameworks": [...],
  "theories": [...]
  // Note: The user's original prompt in ExtractorAgent did not include a 'notes' field in the schema example for the LLM.
  // If 'notes' needs to be extracted, the schema here should be updated.
}

Only use values mentioned in the text. Return all outputs as string arrays. If a field is not found, leave it as an empty array.

⚠ IMPORTANT OUTPUT FORMAT RULE:
- DO NOT include markdown code blocks (such as \`\`\`json ... \`\`\`).
- DO NOT include any commentary or explanation.
- Output must be STRICT raw JSON only.
`;
        // The user's example in the last message had the prompt split into system and user roles.
        // The original prompt in ExtractorAgent was a single block passed to a user role.
        // Adopting the system/user role split as per the most recent instruction for the patch.

        // 4.c Call the LLM
        const response = await LLMAdapterRouter.call({
            systemPrompt: promptForSystem,
            userPrompt: chunkText,
        });

        // 4.d Parse output (use repair fallback)
        let parsed: Partial<ExtractedConcepts> = {};
        const responseContent = (response as { content: string }).content;

        if (typeof responseContent === 'string' && responseContent.trim() !== '') {
            const cleanedContent = stripMarkdownWrappers(responseContent);
            try {
                parsed = JSON.parse(cleanedContent);
            } catch (initialError) {
                console.warn("[ExtractorAgent] Initial JSON parsing of cleaned content failed. Attempting repair on original content.", String(initialError));
                try {
                    const repairedJsonString = jsonrepair(responseContent); // Repair original content
                    parsed = JSON.parse(repairedJsonString);
                } catch (repairError) {
                    console.error("[ExtractorAgent] JSON repair also failed. Proceeding with empty data.", String(repairError));
                    // Ensure parsed is an object even after failed repair attempt
                    if (typeof parsed !== 'object' || parsed === null) {
                        parsed = {};
                    }
                }
            }
        } else {
            console.warn("[ExtractorAgent] LLM response content is not a parsable string or is empty. Proceeding with empty data.");
            // parsed remains {} as initialized
        }

        // Ensure parsed is an object after all attempts
        if (typeof parsed !== 'object' || parsed === null) {
            parsed = {};
        }

        // Ensure array properties and string content
        const principles = Array.isArray(parsed.principles) ? parsed.principles as string[] : [];
        const methods = Array.isArray(parsed.methods) ? parsed.methods as string[] : [];
        const frameworks = Array.isArray(parsed.frameworks) ? parsed.frameworks as string[] : [];
        const theories = Array.isArray(parsed.theories) ? parsed.theories as string[] : [];

        // Handle the 'notes' field in a type-safe way.
        // The prompt to the LLM (promptForSystem) currently does not explicitly ask for 'notes'.
        // Thus, 'parsed.notes' will likely be undefined.
        // We default 'notes' to an empty string to ensure the returned object
        // can satisfy an 'ExtractedConcepts' type that might require/include a 'notes: string' field.
        const notesValue: string = (parsed && typeof parsed.notes === 'string') ? parsed.notes : "";

        // Construct and return the final ExtractedConcepts object.
        // The 'as ExtractedConcepts' cast asserts that this structure matches the type definition.
        return {
            principles,
            methods,
            frameworks,
            theories,
            notes: notesValue,
        } as ExtractedConcepts;
    }
}

// Example Usage (for testing - can be removed or commented out for production)
/*
async function testExtractorAgent() {
    console.log("--- Testing ExtractorAgent ---");

    // Mock DOMAIN_SCHEMA.fields for the test if not importing the actual one
    // This depends on how DomainSchema.ts is structured and if it's available here.
    // For a standalone test, you might need to define a simplified version:
    // global.DOMAIN_SCHEMA = { 
    //    fields: ["principles", "methods", "frameworks", "theories"],
    //    recoveryKeywords: {
    //        principles: ["core principle"],
    //        methods: ["technique"]
    //    }
    // };


    const sampleChunks = [
        "The first part of the document discusses the core principles of agile development. It mentions Scrum as a framework.",
        "The second part elaborates on methods like pair programming and test-driven development. It also touches upon complexity theory.",
        "Finally, it provides some concluding notes and observations about the application of these concepts in large enterprises."
    ];

    try {
        // Ensure DOMAIN_SCHEMA is available if your functions depend on it directly for iteration
        // If ExtractorAgent uses an imported DOMAIN_SCHEMA, this test needs to run in an environment where it's resolved.
        if (!DOMAIN_SCHEMA || !DOMAIN_SCHEMA.fields) {
             console.error("DOMAIN_SCHEMA is not loaded. Test might not run as expected.");
             // Mock it for the test if necessary:
             // (globalThis as any).DOMAIN_SCHEMA = { fields: ['principles', 'methods', 'frameworks', 'theories'], recoveryKeywords: {}, notes: '' };
        }
        const concepts = await ExtractorAgent.extract(sampleChunks);
        console.log("Extracted Concepts:", JSON.stringify(concepts, null, 2));
    } catch (error) {
        console.error("Error during ExtractorAgent test:", error);
    }
}

// To run the test (ensure DOMAIN_SCHEMA is properly accessible or mocked):
// testExtractorAgent();
*/ 