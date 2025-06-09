import type { ExtractedConcepts, TraceableConcept } from '@/types';
// DOMAIN_SCHEMA import removed as it's not used in the new extract method.
import { LLMAdapterRouter } from './LLMAdapterRouter';
import { LLMExtractionSanitizer, SanitizedLLMOutput, stripMarkdownWrappers } from './parsers/LLMExtractionSanitizer';
// import type OpenAI from 'openai'; // Keep for ChatCompletionMessageParam type if DeepSeekAdapter reuses it -> Removing as changing messages type

export class ExtractorAgent {
    public static async extract(chunkText: string): Promise<ExtractedConcepts> {
        // console.log("[PATCH CHECK] ExtractorAgent.extract ACTIVE - vNEW"); // Removed

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
        let parsed: SanitizedLLMOutput;
        const responseContent = (response as { content: string }).content;
        // console.log('[DEBUG] Raw LLM response for ExtractorAgent:', ...); // Removed

        if (typeof responseContent === 'string' && responseContent.trim() !== '') {
            const cleanedContent = stripMarkdownWrappers(responseContent);
            parsed = LLMExtractionSanitizer.sanitize(cleanedContent);
        } else {
            console.warn("[ExtractorAgent] LLM response content is not a parsable string or is empty. Proceeding with empty sanitized data.");
            parsed = LLMExtractionSanitizer.sanitize("");
        }

        // The 'parsed' object now directly comes from the sanitizer and conforms to SanitizedLLMOutput,
        // where each concept field (principles, methods, etc.) is already a string[].

        // The existing forceStringArray can act as a final check or be simplified.
        // For now, its current filtering logic is safe for already string arrays.
        const forceStringArray = (arrCandidate: string[] | undefined): string[] => {
            if (Array.isArray(arrCandidate)) {
                // Since arrCandidate is now string[] from SanitizedLLMOutput,
                // this filter is technically redundant but harmless.
                // It also handles a potential undefined if a field was missing entirely pre-sanitization (though sanitizer ensures fields).
                return arrCandidate.filter(item => typeof item === 'string');
            }
            return [];
        };

        // Use the fields from the sanitized 'parsed' object
        const principlesStrings: string[] = forceStringArray(parsed.principles);
        const methodsStrings: string[] = forceStringArray(parsed.methods);
        const frameworksStrings: string[] = forceStringArray(parsed.frameworks);
        const theoriesStrings: string[] = forceStringArray(parsed.theories);

        // AGGRESSIVE FINAL STRING CLEANUP before creating TraceableConcepts
        const finalClean = (s: string): string => {
            // console.log("[PATCH CHECK] ExtractorAgent.finalClean ACTIVE - vNEW"); // Removed
            if (s === "[object Object]") {
                // Keep this warn as it means LLMExtractionSanitizer failed to prevent "[object Object]"
                console.warn(`[ExtractorAgent] finalClean: Aggressively replacing literal string "[object Object]".`);
                return "[Invalid Extracted String]";
            }
            return s;
        };

        // Helper to transform a string value to a TraceableConcept
        const toTraceableConcept = (value: string): TraceableConcept => ({
            value: finalClean(value), // Apply final clean here
            source: 'ExtractorAgent',
            score: 1.0, // Default score, as this agent primarily extracts, not scores.
        });

        // Transform string arrays to TraceableConcept arrays
        const principles: TraceableConcept[] = principlesStrings.map(toTraceableConcept);
        const methods: TraceableConcept[] = methodsStrings.map(toTraceableConcept);
        const frameworks: TraceableConcept[] = frameworksStrings.map(toTraceableConcept);
        const theories: TraceableConcept[] = theoriesStrings.map(toTraceableConcept);

        // 'notes' field handling is removed as per instructions, assuming ExtractedConcepts type no longer includes it.
        // const notesValue: string = (parsed && typeof parsed.notes === 'string') ? parsed.notes : "";

        // Construct and return the final ExtractedConcepts object.
        return {
            principles,
            methods,
            frameworks,
            theories,
            // notes: notesValue, // Removed notes
        }; // The 'as ExtractedConcepts' cast is removed as the structure should now directly match.
        // If type errors arise, it might need to be reinstated or the ExtractedConcepts type checked.
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