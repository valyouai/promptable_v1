import type { ExtractedConcepts } from '@/types'; // Assuming ExtractedConcepts type is available

export interface AmbiguityScore {
    field: keyof ExtractedConcepts;
    score: number; // 0.0 (clear) to 1.0 (highly ambiguous)
    reasoning: string;
}

const AMBIGUITY_MARKERS: string[] = [
    "unknown", "n/a", "unspecified", "uncertain",
    "possibly", "may", "might", "could", "likely",
    "unclear", "tbd", "pending", "not explicitly mentioned"
].map(marker => marker.toLowerCase());

interface AmbiguityCheckResult {
    isAmbiguous: boolean;
    score: number;
    reasoning: string;
}

export class AmbiguityDetectorAgent {
    /**
     * Analyzes extracted concepts for ambiguities based on predefined rules.
     *
     * @param concepts The extracted concepts to analyze.
     * @returns An array of AmbiguityScore objects for fields with detected ambiguity.
     */
    public static detectAmbiguities(concepts: ExtractedConcepts): AmbiguityScore[] {
        const scores: AmbiguityScore[] = [];
        const conceptKeys: (keyof ExtractedConcepts)[] = ["principles", "methods", "frameworks", "theories", "notes"];

        for (const key of conceptKeys) {
            let result: AmbiguityCheckResult;
            const value = concepts[key];

            if (key === "notes") {
                result = this.isNotesAmbiguous(value as string | undefined);
            } else {
                result = this.isFieldAmbiguous(value as string[] | undefined);
            }

            if (result.isAmbiguous) {
                scores.push({
                    field: key,
                    score: result.score,
                    reasoning: result.reasoning
                });
            } else if (result.score === 0.0) { // Optionally log clear fields if needed for verbosity, or only push if ambiguous
                // For now, only push if ambiguous as per current AmbiguityScore[] design
                // If we want to report 0.0 scores, the calling logic/interface might need adjustment
                // console.log(`Field '${key}' is clear. Score: 0.0, Reasoning: ${result.reasoning}`);
            }
        }
        return scores;
    }

    /**
     * Helper function to determine if a field (array of strings) is ambiguous.
     */
    private static isFieldAmbiguous(fieldValue: string[] | undefined): AmbiguityCheckResult {
        if (!fieldValue || fieldValue.length === 0) {
            return { isAmbiguous: true, score: 1.0, reasoning: "Field empty" };
        }

        if (fieldValue.length === 1) {
            const singleValue = fieldValue[0].toLowerCase();
            const hasHedging = AMBIGUITY_MARKERS.some(marker => singleValue.includes(marker));
            if (hasHedging) {
                return { isAmbiguous: true, score: 0.75, reasoning: "Hedging phrase detected in singleton value" };
            }
            // Single, non-empty, non-hedged value is considered clear for an array field element
            // If it should be ambiguous just for being a singleton without hedging, the rules would need to specify that.
            // For now, a single clear item is just score 0 with specific reasoning.
            return { isAmbiguous: false, score: 0.0, reasoning: "Single clear value present" };
        }

        // For multiple values, we assume they are clear unless a more complex rule for partial hedging is added.
        // The current rules are: Empty (1.0), Hedging (0.75 for singleton), Multiple clean (0.0)
        // This implies multiple values are treated as 0.0 if not empty.
        return { isAmbiguous: false, score: 0.0, reasoning: "Multiple clear values present" };
    }

    /**
     * Helper function to determine if the notes field (string) is ambiguous.
     */
    private static isNotesAmbiguous(notesValue: string | undefined): AmbiguityCheckResult {
        if (!notesValue || notesValue.trim().length === 0) {
            return { isAmbiguous: true, score: 1.0, reasoning: "Field empty" };
        }

        const lowerNotes = notesValue.toLowerCase();
        const hasHedging = AMBIGUITY_MARKERS.some(marker => lowerNotes.includes(marker));

        if (hasHedging) {
            return { isAmbiguous: true, score: 0.75, reasoning: "Hedging phrase detected" };
        }

        return { isAmbiguous: false, score: 0.0, reasoning: "Clear value present" };
    }
}

// Example Usage (for testing or direct use):
// const exampleConcepts: ExtractedConcepts = {
//     principles: ["Principle 1", "possibly another one"],
//     methods: [],
//     frameworks: ["Framework X"],
//     theories: ["Maybe Theory Y"],
//     notes: "This is a bit uncertain."
// };

// const ambiguities = AmbiguityDetectorAgent.detectAmbiguities(exampleConcepts);
// console.log("Detected Ambiguities:", ambiguities); 