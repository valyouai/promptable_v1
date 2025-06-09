import { jsonrepair } from 'jsonrepair';
import { enforceSchemaCompliance, type SanitizedLLMPartial } from './SchemaEnforcementPreProcessor';

// Define the expected structure of the sanitized output
export interface SanitizedLLMOutput {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
    // Add other fields if the schema evolves, e.g., notes
}

const KNOWN_CONCEPT_FIELDS: (keyof SanitizedLLMOutput)[] = ['principles', 'methods', 'frameworks', 'theories'];

/**
 * Strictly verifies that all items in an array are strings.
 * This function assumes that upstream processing (SchemaEnforcementPreProcessor)
 * has already performed all necessary coercions and flattening.
 */
const coerceArrayToStrings = (input: unknown, fieldName: string): string[] => {
    // The calling context in sanitize() already ensures `input` is an array (newly `Array.isArray(fieldData) ? fieldData : []`)
    // So, the initial Array.isArray(input) check here is somewhat redundant but harmless for robustness.
    if (!Array.isArray(input)) {
        // This case should ideally not be hit if called from sanitize() post-Phase 27.B SchemaEnforcementPreProcessor,
        // as enforceSchemaCompliance defaults fields to [].
        // Logging a warning if it ever happens with non-null/undefined unexpected types.
        if (input !== undefined && input !== null) {
            console.warn(`[LLMExtractionSanitizer] Field "${fieldName}" was expected to be an array by coerceArrayToStrings, but received ${typeof input}. Defaulting to empty array.`);
        }
        return [];
    }

    return input.map((item, index) => {
        if (typeof item === 'string') {
            return item;
        }
        // If item is not a string here, it's a strict schema violation.
        const errorMessage = `[LLMExtractionSanitizer] Strict schema violation in field "${fieldName}" at index ${index}. Expected string, but received ${typeof item}. Value: ${JSON.stringify(item)}. This indicates an issue in the upstream SchemaEnforcementPreProcessor or unexpected data type.`;
        console.error(errorMessage);
        // Consider if re-throwing is the best strategy or if returning a placeholder is safer for production stability,
        // depending on how the overall system should handle such unexpected errors.
        // For now, per instruction "Raise exception if non-string detected", we throw.
        throw new Error(errorMessage);
    });
};

export class LLMExtractionSanitizer {
    /**
     * Sanitizes raw LLM string output to ensure concept fields contain arrays of strings.
     * @param rawLLMOutput The raw string response from the LLM.
     * @returns A SanitizedLLMOutput object.
     */
    public static sanitize(rawLLMOutput: string): SanitizedLLMOutput {
        let parsed: Record<string, unknown> = {};

        if (typeof rawLLMOutput !== 'string' || rawLLMOutput.trim() === '') {
            console.warn('[LLMExtractionSanitizer] Raw LLM output is not a string or is empty. Returning empty sanitized structure.');
        } else {
            try {
                const parsedOutput = JSON.parse(rawLLMOutput);
                if (typeof parsedOutput === 'object' && parsedOutput !== null) {
                    parsed = parsedOutput as Record<string, unknown>;
                } else {
                    console.warn('[LLMExtractionSanitizer] Initial JSON.parse did not yield an object. Proceeding with empty data.');
                }
            } catch (e) {
                console.warn(`[LLMExtractionSanitizer] Initial JSON.parse failed. Attempting repair. Error: ${e}`);
                try {
                    const repairedJsonString = jsonrepair(rawLLMOutput);
                    const parsedRepairedOutput = JSON.parse(repairedJsonString);
                    if (typeof parsedRepairedOutput === 'object' && parsedRepairedOutput !== null) {
                        parsed = parsedRepairedOutput as Record<string, unknown>;
                        console.log('[LLMExtractionSanitizer] JSON repair successful.');
                    } else {
                        console.warn('[LLMExtractionSanitizer] Repaired JSON.parse did not yield an object. Proceeding with empty data.');
                    }
                } catch (repairError) {
                    console.error(`[LLMExtractionSanitizer] JSON repair also failed. Returning empty sanitized structure. Repair Error: ${repairError}`);
                }
            }
        }

        // PHASE 27.B: Schema Enforcement Pre-Processor
        // Call enforceSchemaCompliance AFTER successful parsing/repair, BEFORE coerceArrayToStrings
        const enforcedSchemaData: SanitizedLLMPartial = enforceSchemaCompliance(parsed);

        const normalizedOutput: Partial<SanitizedLLMOutput> = {};

        // Use KNOWN_CONCEPT_FIELDS to iterate and populate normalizedOutput
        // Ensure that we pass an array (even if empty) to coerceArrayToStrings
        for (const field of KNOWN_CONCEPT_FIELDS) {
            const fieldData = enforcedSchemaData[field as keyof SanitizedLLMPartial];
            normalizedOutput[field] = coerceArrayToStrings(Array.isArray(fieldData) ? fieldData : [], field);
        }

        const finalOutput: SanitizedLLMOutput = {
            principles: normalizedOutput.principles || [],
            methods: normalizedOutput.methods || [],
            frameworks: normalizedOutput.frameworks || [],
            theories: normalizedOutput.theories || [],
            ...normalizedOutput,
        };

        return finalOutput;
    }
}

export function stripMarkdownWrappers(jsonString: string): string {
    let processedString = jsonString.trim();

    // 1️⃣ First, globally strip ALL markdown code blocks (no anchors, global flag)
    const markdownRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    processedString = processedString.replace(markdownRegex, (_, innerContent) => innerContent.trim());

    // 2️⃣ Then, locate the outermost JSON object safely
    const firstCurly = processedString.indexOf('{');
    const lastCurly = processedString.lastIndexOf('}');

    // Guard clause for invalid JSON structure
    if (firstCurly === -1 || lastCurly === -1 || lastCurly <= firstCurly) {
        // If no valid JSON object structure is found after markdown stripping,
        // return an empty string or handle as an error as appropriate.
        // console.warn("[stripMarkdownWrappers] No valid JSON object found after markdown stripping. Original:", jsonString, "Processed:", processedString);
        return "";
    }

    processedString = processedString.substring(firstCurly, lastCurly + 1);

    // Final trim to ensure no leading/trailing whitespace around the JSON object.
    return processedString.trim();
}

// Example Usage (for testing purposes):
/*
const testSanitizer = () => {
    console.log("--- Testing LLMExtractionSanitizer ---");

    const compliantInput = '{ "principles": ["P1", "P2"], "methods": ["M1"], "frameworks": [], "theories": ["T1"] }';
    const nonCompliantObjects = '{ "principles": [{"value": "P1_obj"}, "P2_str", {"name": "P3_name_obj"}], "methods": [123, {"text": "M1_text_obj"}], "frameworks": null, "theories": [undefined, {"random": "data"}] }';
    const malformedJson = '{ "principles": ["P1", "P2], "methods": ["M1"] }'; // Missing quote
    const emptyJson = '{}';
    const nonJsonString = "This is not JSON.";

    console.log("\\nInput: Compliant JSON String");
    console.log("Output:", LLMExtractionSanitizer.sanitize(compliantInput));

    console.log("\\nInput: Non-compliant (objects in arrays)");
    console.log("Output:", LLMExtractionSanitizer.sanitize(nonCompliantObjects));
    
    console.log("\\nInput: Malformed JSON (requires repair)");
    console.log("Output:", LLMExtractionSanitizer.sanitize(malformedJson));

    console.log("\\nInput: Empty JSON");
    console.log("Output:", LLMExtractionSanitizer.sanitize(emptyJson));

    console.log("\\nInput: Non-JSON String");
    console.log("Output:", LLMExtractionSanitizer.sanitize(nonJsonString));

    console.log("\\nInput: Empty String");
    console.log("Output:", LLMExtractionSanitizer.sanitize(""));

    console.log("\\nInput: String with only whitespace");
    console.log("Output:", LLMExtractionSanitizer.sanitize("   "));
};

// testSanitizer(); 
*/ 