import { ExtractionContract } from "./schema/ExtractionPromptContract";

/**
 * Verifies that the output from an LLM extraction task strictly conforms to the ExtractionContract.
 * This verifier ensures that all required fields are present, are arrays, and that these arrays
 * contain only string items.
 * 
 * It is intended to be used immediately after parsing the LLM's JSON response and before
 * the data enters the main sanitization or an_extraction_pipelines.
 */
export class ExtractionOutputVerifier {
    /**
     * Verifies the structure and type integrity of the parsed LLM output.
     * 
     * @param output - The parsed JSON object from the LLM response.
     * @returns The output cast to ExtractionContract if verification passes.
     * @throws Error if verification fails, detailing the specific contract violation.
     */
    static verify(output: unknown): ExtractionContract {
        if (typeof output !== 'object' || output === null) {
            throw new Error(`[ExtractionOutputVerifier] Output must be an object. Received: ${typeof output}`);
        }

        const outputRecord = output as Record<string, unknown>;

        const fields: (keyof ExtractionContract)[] = ["principles", "methods", "frameworks", "theories"];

        for (const field of fields) {
            if (!Object.prototype.hasOwnProperty.call(outputRecord, field) || !Array.isArray(outputRecord[field])) {
                throw new Error(`[ExtractionOutputVerifier] Field '${String(field)}' must be an array and present. Found: ${JSON.stringify(outputRecord[field])}`);
            }

            const fieldArray = outputRecord[field] as unknown[];
            for (let i = 0; i < fieldArray.length; i++) {
                const item = fieldArray[i];
                if (typeof item !== "string") {
                    throw new Error(`[ExtractionOutputVerifier] Field '${String(field)}' contains a non-string value at index ${i}. Value: ${JSON.stringify(item)} (Type: ${typeof item})`);
                }
            }
        }

        return outputRecord as unknown as ExtractionContract;
    }
} 