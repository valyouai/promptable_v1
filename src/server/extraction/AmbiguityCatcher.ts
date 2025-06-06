/**
 * Phase 4B - Ambiguity Catcher
 *
 * This module performs basic heuristics to detect possible ambiguities
 * or missing extractions within the normalized concepts object.
 */

export type AmbiguityWarning = {
    field: string;
    issue: string;
};

export class AmbiguityCatcher {
    private static readonly minimumThresholds: Record<string, number> = {
        'Research Objective': 1,
        'Methods': 1,
        'Dataset(s)': 1,
        'Key Findings': 1,
        'Limitations': 1,
        'Future Work': 1,
        'Applications': 1,
        'Citations': 0, // allow empty
        'Keywords': 0   // allow empty
    };

    public static detectAmbiguities(output: Record<string, unknown>): AmbiguityWarning[] {
        const warnings: AmbiguityWarning[] = [];

        for (const [field, minCount] of Object.entries(this.minimumThresholds)) {
            const value = output[field];

            if (!value || (typeof value === 'string' && value.trim() === '')) {
                if (minCount > 0) {
                    warnings.push({ field, issue: 'Field missing or empty.' });
                }
            }
        }

        return warnings;
    }
} 