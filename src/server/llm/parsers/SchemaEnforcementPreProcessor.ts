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
    console.log("[PATCH CHECK] SchemaEnforcementPreProcessor.enforceSchemaCompliance ACTIVE - vNEW");
    console.log('[DEBUG] enforceSchemaCompliance received rawParsed:', JSON.stringify(rawParsed));
    const output: SanitizedLLMPartial = {};

    // KNOWN_CONCEPT_FIELDS from LLMExtractionSanitizer.ts, ensure this list is consistent
    // For now, using the ones specified in the blueprint.
    const fieldsToProcess: (keyof SanitizedLLMPartial)[] = ["principles", "methods", "frameworks", "theories"];

    for (const field of fieldsToProcess) {
        const rawFieldVal = rawParsed?.[field];
        console.log(`[DEBUG] Processing field: ${field}`, 'rawFieldVal:', rawFieldVal ? JSON.stringify(rawFieldVal).substring(0, 200) + "..." : rawFieldVal);

        let processedArray: unknown[] = []; // Default to empty array

        if (Array.isArray(rawFieldVal)) {
            console.log(`[DEBUG] Field ${field} is array. Items detail:`);
            rawFieldVal.forEach((item: unknown, index: number) => {
                console.log(`[DEBUG]   Item ${index} for field ${field}: (type: ${typeof item}) (ctor: ${item?.constructor?.name}) | Value: ${String(item).substring(0, 100)}`);
            });
            processedArray = rawFieldVal.map((item: unknown) => {
                if (typeof item === "string") {
                    // If the string is literally "[object Object]", replace it with a defined placeholder.
                    if (item === "[object Object]") {
                        console.warn(`[SchemaEnforcementPreProcessor] Field item was literal string \"[object Object]\". Replacing.`);
                        return "[LLM Returned Object String]"; // Specific placeholder
                    }
                    return item; // It's a string, but not "[object Object]"
                }
                // Handle null or undefined explicitly first
                if (item === null || item === undefined) {
                    return "[No Value]"; // As per new requirement
                }
                if (typeof item === "object") { // item is not null here due to the check above
                    const itemAsRecord = item as Record<string, unknown>; // item is known to be an object
                    if (typeof itemAsRecord.value === "string") return itemAsRecord.value;
                    if (typeof itemAsRecord.name === "string") return itemAsRecord.name;
                    if (typeof itemAsRecord.text === "string") return itemAsRecord.text;
                    if (typeof itemAsRecord.label === "string") return itemAsRecord.label;
                    if (typeof itemAsRecord.description === "string") return itemAsRecord.description;

                    // Guarded stringify for other objects - this is the new fallback for objects
                    try {
                        const jsonStr = JSON.stringify(item);
                        if (jsonStr === '{}' || jsonStr === '[object Object]') {
                            console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" item (object) stringified to generic/empty. Original:`, item);
                            return "[Malformed Object Detected]";
                        }
                        return jsonStr;
                    } catch (e) {
                        console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" item (object) failed JSON.stringify. Original:`, item, 'Error:', e);
                        return "[Unstringifiable Object]";
                    }
                }
                // Final fallback for non-string, non-null/undefined, non-object primitives (e.g., numbers, booleans)
                return String(item);
            });
        } else {
            // If the field from rawParsed is not an array (e.g., undefined, null, or other type),
            // default it to an empty array in the output.
            processedArray = [];
        }

        // Section 4️⃣ Additional Safeguard: Final pass to ensure all items are strings
        output[field] = processedArray.map(val => {
            if (typeof val === "string") {
                // Also check here if a string somehow became "[object Object]" after initial processing
                return val === "[object Object]" ? "[Invalid String Value Post-Processing]" : val;
            }
            // If, after all processing, an item is still not a string (e.g., an unhandled object type slipped through, 
            // or a complex scenario not caught by specific object checks or stringify attempts),
            // this ensures it becomes a defined placeholder string.
            console.warn(`[SchemaEnforcementPreProcessor] Field "${field}" item was not a string after initial processing. Type: ${typeof val}. Value:`, val);
            return "[Unrecognized Object: Flattening Failed]"; // User-specified placeholder
        });
    }

    return output;
} 