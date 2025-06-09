import type { ExtractedConcepts, TraceableConcept } from '@/types'; // Added TraceableConcept

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
        const conceptKeys: (keyof ExtractedConcepts)[] = ["principles", "methods", "frameworks", "theories"];

        for (const key of conceptKeys) {
            const result: AmbiguityCheckResult = this.isFieldAmbiguous(concepts[key]);

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
     * Helper function to determine if a field (array of strings or TraceableConcepts) is ambiguous.
     * Updated to expect TraceableConcept[] as per ExtractedConcepts type.
     */
    private static isFieldAmbiguous(fieldValue: TraceableConcept[] | undefined): AmbiguityCheckResult {
        if (!fieldValue || fieldValue.length === 0) {
            return { isAmbiguous: true, score: 1.0, reasoning: "Field empty" };
        }

        let hedgingFoundInAnyItem = false;
        let allItemsClearSummary = "All items appear clear. Items: ";

        for (const concept of fieldValue) {
            const lowerItem = concept.value.toLowerCase();
            const hasHedging = AMBIGUITY_MARKERS.some(marker => lowerItem.includes(marker));
            if (hasHedging) {
                hedgingFoundInAnyItem = true;
                break;
            }
            allItemsClearSummary += `'${concept.value.substring(0, 20)}...' `;
        }

        if (hedgingFoundInAnyItem) {
            return {
                isAmbiguous: true,
                score: 0.6,
                reasoning: "Hedging phrase detected in at least one value within the field array."
            };
        }

        return {
            isAmbiguous: false,
            score: 0.0,
            reasoning: fieldValue.length === 1 ? "Single clear value present" : `Multiple clear values present. ${allItemsClearSummary.trim()}`
        };
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