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

        // New logic: iterate through each item in the array
        let hedgingFoundInAnyItem = false;
        let allItemsClearSummary = "All items appear clear. Items: ";

        for (const item of fieldValue) {
            const lowerItem = item.toLowerCase();
            const hasHedging = AMBIGUITY_MARKERS.some(marker => lowerItem.includes(marker));
            if (hasHedging) {
                hedgingFoundInAnyItem = true;
                // Provide more specific reasoning if needed, e.g., which item and marker
                // For now, a general reasoning for the field is fine.
                break; // Found hedging, no need to check further for this field
            }
            allItemsClearSummary += `'${item.substring(0, 20)}...' `;
        }

        if (hedgingFoundInAnyItem) {
            return {
                isAmbiguous: true,
                score: 0.6, // Adjusted score for hedging in one of potentially multiple items
                reasoning: "Hedging phrase detected in at least one value within the field array."
            };
        }

        // If loop completes and no hedging found in any item
        return {
            isAmbiguous: false,
            score: 0.0,
            reasoning: fieldValue.length === 1 ? "Single clear value present" : `Multiple clear values present. ${allItemsClearSummary.trim()}`
        };
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