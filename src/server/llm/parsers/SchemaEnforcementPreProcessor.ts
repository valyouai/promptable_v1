// import { jsonrepair } from 'jsonrepair'; // Removed unused import

export type SanitizedLLMPartial = {
    principles?: unknown[];
    methods?: unknown[];
    frameworks?: unknown[];
    theories?: unknown[];
    // other fields from SanitizedLLMOutput could be added here if the schema grows
};

/**
 * Enforces schema compliance on a parsed LLM output object.
 * The primary goal is to ensure that known concept fields (e.g., principles, methods)
 * are arrays containing only strings. This function is a critical defense layer against
 * LLM outputs that may not strictly adhere to the requested JSON schema, particularly
 * regarding the types of items within arrays (e.g., LLM returning objects instead of strings).
 *
 * Why object flattening logic exists:
 * LLMs, despite prompting for specific JSON structures (like arrays of strings),
 * may occasionally return arrays containing objects (e.g., `principles: [ { "value": "P1" } ]`)
 * instead of the desired flat strings (e.g., `principles: [ "P1" ]`).
 * This function explicitly checks for common object patterns (e.g., objects with a `value`,
 * `name`, `text`, `label`, or `description` key) and attempts to flatten them. If direct
 * flattening isn't possible, it resorts to `JSON.stringify()` for other object structures
 * or defined placeholders for errors/malformations. This ensures that subsequent
 * processing stages receive predictable string arrays, preventing type errors and maintaining
 * data integrity downstream.
 *
 * This pre-processor acts *before* `LLMExtractionSanitizer.coerceArrayToStrings()`, with the latter
 * now serving as a final strict verifier that its input is indeed `string[]`.
 */
export function enforceSchemaCompliance(rawParsed: Record<string, unknown> | null | undefined): SanitizedLLMPartial {
    // console.log("[PATCH CHECK] SchemaEnforcementPreProcessor.enforceSchemaCompliance ACTIVE - vNEW"); // Removed
    // console.log('[DEBUG] enforceSchemaCompliance received rawParsed:', JSON.stringify(rawParsed)); // Removed
    const output: SanitizedLLMPartial = {};
    const fieldsToProcess: (keyof SanitizedLLMPartial)[] = ["principles", "methods", "frameworks", "theories"];

    for (const field of fieldsToProcess) {
        const rawFieldVal = rawParsed?.[field];
        // console.log(`[DEBUG] Processing field: ${field}`, 'rawFieldVal:', ...); // Removed

        let processedArray: unknown[] = [];
        if (Array.isArray(rawFieldVal)) {
            // console.log(`[DEBUG] Field ${field} is array. Items detail:`); // Removed
            // rawFieldVal.forEach(... console.log(...)); // Removed item detail loop
            processedArray = rawFieldVal.map((item: unknown) => {
                if (typeof item === "string") {
                    if (item === "[object Object]") {
                        // Keep this specific warning as it indicates direct LLM output of "[object Object]"
                        console.warn(`[SchemaEnforcementPreProcessor] Field item was literal string "[object Object]". Replacing with placeholder.`);
                        return "[LLM Returned Object String]";
                    }
                    return item;
                }
                if (item === null || item === undefined) {
                    return "[No Value]";
                }
                if (typeof item === "object") {
                    const itemAsRecord = item as Record<string, unknown>;
                    if (typeof itemAsRecord.value === "string") return itemAsRecord.value;
                    if (typeof itemAsRecord.name === "string") return itemAsRecord.name;
                    if (typeof itemAsRecord.text === "string") return itemAsRecord.text;
                    if (typeof itemAsRecord.label === "string") return itemAsRecord.label;
                    if (typeof itemAsRecord.description === "string") return itemAsRecord.description;
                    try {
                        const jsonStr = JSON.stringify(item);
                        if (jsonStr === '{}') {
                            // Keep this warn: LLM returned an empty object for an expected string item
                            console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" contained an empty object {}. Replacing with placeholder.`);
                            return "[Malformed Object Detected]";
                        }
                        // LLM returned a complex object where a string was expected. Return its stringified JSON.
                        // This might still be undesirable data for a TraceableConcept.value later on.
                        console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" contained a complex object. Returning its stringified JSON: ${jsonStr.substring(0, 100)}...`);
                        return jsonStr;
                    } catch (e) {
                        console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" item (object) failed JSON.stringify. Original: ${String(item).substring(0, 100)}... Error: ${e}`);
                        return "[Unstringifiable Object]";
                    }
                }
                // This means item is not string, not null/undefined, not object (e.g. number, boolean)
                // Keep this warn: LLM returned an unexpected primitive type for an expected string item.
                console.warn(`[SchemaEnforcementPreProcessor] Item in field "${field}" is an unexpected primitive. Type: ${typeof item}. Coercing with String(). Value: ${String(item)}`);
                return String(item);
            });
        } else {
            processedArray = [];
        }

        output[field] = processedArray.map(val => {
            if (typeof val === "string") {
                // This final check for "[object Object]" should ideally not be hit if above logic is perfect
                // and other types (numbers, booleans) don't stringify to this.
                if (val === "[object Object]") {
                    console.warn(`[SchemaEnforcementPreProcessor] Final Check: Field item was literal string "[object Object]" after coercions. Replacing.`);
                    return "[Invalid String Value Post-Processing]";
                }
                return val;
            }
            // This indicates a failure in the mapping above to produce only strings in processedArray
            console.warn(`[SchemaEnforcementPreProcessor] Final Check: Field "${field}" item was not a string after initial processing. Type: ${typeof val}. Value: ${String(val).substring(0, 100)}...`);
            return "[Unrecognized Data Type Post-Processing]";
        });
    }
    return output;
} 