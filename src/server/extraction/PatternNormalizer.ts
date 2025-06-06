/**
 * Phase 4 - Pattern Normalizer
 * 
 * This module performs cleanup, flattening, and string-based
 * normalization of extracted keys. It catches minor variations
 * not covered by schema mapping, such as punctuation, casing, etc.
 */

export class PatternNormalizer {
    public static normalize(rawOutput: Record<string, any>): Record<string, any> {
        const normalizedOutput: Record<string, any> = {};

        for (const [key, value] of Object.entries(rawOutput)) {
            const cleanedKey = this.normalizeKey(key);
            normalizedOutput[cleanedKey] = value;
        }

        return normalizedOutput;
    }

    private static normalizeKey(key: string): string {
        let normalized = key.trim();

        // Normalize common punctuation inconsistencies
        normalized = normalized.replace(/[:\-–—]/g, '');
        normalized = normalized.replace(/\s+/g, ' ');

        // Capitalize first letter of each word (title case)
        normalized = normalized.replace(
            /\w\S*/g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
        );

        return normalized;
    }
} 