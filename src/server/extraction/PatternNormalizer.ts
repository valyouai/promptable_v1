/**
 * Phase 4 - Pattern Normalizer
 * 
 * This module performs cleanup, flattening, and string-based
 * normalization of extracted keys. It catches minor variations
 * not covered by schema mapping, such as punctuation, casing, etc.
 */

import type { ExtractedConcepts } from "@/types"; // Might be useful later for strict typing

// Alias map: maps various key phrasings (lowercase, spaces for separators) to canonical keys.
const ALIAS_MAP: Record<string, string> = {
    // principles
    "principle": "principles",
    "principles": "principles",
    "key principles": "principles",
    "key principle": "principles",
    "primary ideas": "principles",
    "primary idea": "principles",
    "core ideas": "principles",
    "main ideas": "principles",
    "concept": "principles",
    "concepts": "principles",
    "main concepts": "principles",
    "key concepts": "principles",

    // methods
    "method": "methods",
    "methods": "methods",
    "methodologies": "methods",
    "methodology": "methods",
    "key methods": "methods",
    "key method": "methods",
    "experimental methods": "methods",
    "approaches": "methods",
    "approach": "methods",
    "techniques": "methods",
    "technique": "methods",
    "tools": "methods",

    // frameworks
    "framework": "frameworks",
    "frameworks": "frameworks",
    "system framework": "frameworks",
    "conceptual framework": "frameworks",
    "models": "frameworks",
    "model": "frameworks",
    "modeling approaches": "frameworks",

    // theories
    "theory": "theories",
    "theories": "theories",
    "underlying theories": "theories",
    "underlying theory": "theories",
    "theoretical basis": "theories",
    "supporting theories": "theories",
    "theoretical concepts": "theories",
    "relevant theories": "theories",

    // notes - if we want to alias keys to 'notes'
    // "summary": "notes",
    // "additional notes": "notes",
    // "note": "notes",
};

// Define canonical keys that are expected to be arrays of strings in the final output.
const CANONICAL_ARRAY_KEYS = ["principles", "methods", "frameworks", "theories"];

// Common strings that represent empty or non-applicable values (case-insensitive).
const EMPTY_VALUE_MARKERS = ["n/a", "na", "none", "null", "nil", "not applicable", "not specified", "not mentioned", "not explicitly mentioned", "-", ""];

export class PatternNormalizer {
    /**
     * Normalizes a key string for lookup purposes.
     * Converts to lowercase, replaces underscores/hyphens with spaces, and trims excess whitespace.
     * @param key The original key string.
     * @returns Normalized key string for lookup.
     */
    private static normalizeKeyForLookup(key: string): string {
        return key.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim();
    }

    private static _cleanStringForEmptyCheck(s: string): string {
        // Trim, convert to lower case, and remove common trailing punctuation.
        return s.trim().replace(/[.,;:]+$/, "").toLowerCase();
    }

    private static _processAndAddValueToCanonicalArray(
        value: unknown,
        targetCanonicalKey: string,
        collectedArrays: Record<string, string[]>
    ) {
        if (value === null || value === undefined) {
            return;
        }

        const originalStrValue = String(value).trim();

        if (originalStrValue.length === 0) {
            return;
        }

        // Use the cleaned string for the initial empty check
        const cleanedInitialStrForEmptyCheck = PatternNormalizer._cleanStringForEmptyCheck(originalStrValue);
        if (EMPTY_VALUE_MARKERS.includes(cleanedInitialStrForEmptyCheck)) {
            return;
        }

        // Split by one or more commas or semicolons
        const potentialSplitItems = originalStrValue.split(/[;,]+/)
            .map(part => {
                const trimmedPart = part.trim();
                if (trimmedPart.length === 0) {
                    return null; // Mark for filtering if part is empty after trim
                }
                // Check each part against empty markers after cleaning it
                const cleanedPartForEmptyCheck = PatternNormalizer._cleanStringForEmptyCheck(trimmedPart);
                if (EMPTY_VALUE_MARKERS.includes(cleanedPartForEmptyCheck)) {
                    return null; // Mark for filtering
                }
                return trimmedPart; // Return original trimmed part if valid
            })
            .filter(part => part !== null) as string[];

        if (potentialSplitItems.length > 0) {
            for (const subItem of potentialSplitItems) {
                collectedArrays[targetCanonicalKey].push(subItem);
            }
        }
    }

    /**
     * Normalizes raw extracted data by mapping aliased keys to canonical forms,
     * unifying formats (e.g., ensuring canonical fields are arrays of strings),
     * and cleaning common LLM inconsistencies (e.g., removing "N/A" values).
     *
     * @param rawData The raw data extracted, as a Record<string, unknown>.
     * @returns A new record with normalized keys and values.
     */
    public static normalize(rawData: ExtractedConcepts): ExtractedConcepts {
        // console.log('[PatternNormalizer] Input rawData:', JSON.parse(JSON.stringify(rawData)));
        const result: Partial<ExtractedConcepts> = {}; // Changed to Partial<ExtractedConcepts> for incremental build
        const collectedArrays: Record<string, string[]> = {};

        for (const key of CANONICAL_ARRAY_KEYS) {
            collectedArrays[key] = [];
        }

        let notesValue: string | undefined = undefined; // For potential 'notes' field handling

        for (const [originalKey, value] of Object.entries(rawData)) {
            const lookupKey = PatternNormalizer.normalizeKeyForLookup(originalKey);
            const mappedCanonicalKey = ALIAS_MAP[lookupKey];

            if (mappedCanonicalKey && CANONICAL_ARRAY_KEYS.includes(mappedCanonicalKey)) {
                // Key is an alias for a canonical array field
                const items = Array.isArray(value) ? value : [value];
                for (const item of items) {
                    PatternNormalizer._processAndAddValueToCanonicalArray(item, mappedCanonicalKey, collectedArrays);
                }
            } else if (!mappedCanonicalKey && CANONICAL_ARRAY_KEYS.includes(lookupKey)) {
                // Key is already a canonical array key (e.g., "principles") not via alias map
                const items = Array.isArray(value) ? value : [value];
                for (const item of items) {
                    PatternNormalizer._processAndAddValueToCanonicalArray(item, lookupKey, collectedArrays);
                }
            } else if (mappedCanonicalKey === 'notes' || (!mappedCanonicalKey && lookupKey === 'notes')) {
                // Handle 'notes' field, whether it was aliased or direct.
                // This assumes ALIAS_MAP *could* map to 'notes'.
                if (value !== null && value !== undefined) {
                    const strValue = String(value).trim();
                    if (strValue.length > 0 && !EMPTY_VALUE_MARKERS.includes(strValue.toLowerCase())) {
                        if (notesValue === undefined) {
                            notesValue = strValue;
                        } else {
                            notesValue += `\\n${strValue}`;
                            // console.warn(`[PatternNormalizer] Multiple values for 'notes'. Concatenating.`);
                        }
                    }
                }
            }
            else {
                // Neither an alias for a canonical array key, nor a direct canonical array key, nor 'notes'.
                // Carry over with original key.
                result[originalKey] = value;
            }
        }

        for (const key of CANONICAL_ARRAY_KEYS) {
            result[key] = Array.from(new Set(collectedArrays[key]));
        }

        if (notesValue !== undefined) {
            result['notes'] = notesValue;
        }

        // If 'notes' was in rawData but not processed into notesValue (e.g. it was null or empty marker string)
        // and also not carried over by the 'else' clause (e.g. because its key was 'notes' but value was null),
        // we need to ensure it's not accidentally resurrected if ExtractedConcepts expects notes?:string (undefined is fine).
        // The current logic: if rawData.notes = null, it's skipped for notesValue. If key is 'notes', the 'else' block
        // for 'other keys' is also skipped. So result.notes would be undefined, which is fine.
        // If rawData.notes = "some note", it goes into notesValue.
        // If rawData.confidence_score = 0.95, it goes into result via the 'else' block.

        // console.log('[PatternNormalizer] Output normalizedData:', JSON.parse(JSON.stringify(result)));
        return result as ExtractedConcepts; // Cast to ExtractedConcepts as the logic ensures it
    }
} 