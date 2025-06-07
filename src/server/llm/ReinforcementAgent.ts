import type { ExtractedConcepts } from '@/types';
import type { AmbiguityScore } from './AmbiguityDetectorAgent'; // Assuming this path is correct

/**
 * Input for the ReinforcementAgent.
 */
export interface ReinforcementInput {
    originalConcepts: ExtractedConcepts;
    ambiguityScores: AmbiguityScore[];
    fullDocumentText: string;
    // Potentially add other contextual information if needed in the future, e.g., persona, specific fields to focus on.
}

const DOMAIN_KEYWORDS = {
    principles: ["adaptation", "self-organization", "modularity", "robustness"],
    methods: ["agent-based modeling", "reinforcement learning", "genetic algorithm"],
    frameworks: ["multi-agent system", "actor model", "cellular automata"],
    theories: ["game theory", "network theory", "complexity theory"]
};

type ConceptKey = keyof typeof DOMAIN_KEYWORDS;

/**
 * Output from the ReinforcementAgent.
 * For now, it returns a full ExtractedConcepts object, which might be identical
 * to the original if no changes were made, or a refined version.
 */
export interface ReinforcementOutput {
    refinedConcepts: ExtractedConcepts;
    confidenceScore?: number; // Optional: Agent's confidence in the refinement
    refinementSummary?: string; // Optional: Brief summary of changes made
}

export class ReinforcementAgent {
    /**
     * Performs a contextual re-analysis of extracted concepts to resolve ambiguities
     * and improve accuracy based on the full document text.
     *
     * This is a placeholder for the full agent logic which, in a complete system,
     * might involve LLM calls for deeper understanding and refinement.
     * For Phase 10C scaffolding, it will implement basic passthrough or mock logic.
     *
     * @param input The input containing original concepts, ambiguity scores, and document text.
     * @returns The refined concepts and a summary of the reinforcement process.
     */
    public static async refineConcepts(input: ReinforcementInput): Promise<ReinforcementOutput> {
        console.log('[ReinforcementAgent] Received input for refinement:', {
            ambiguityScores: input.ambiguityScores,
            originalConceptKeys: Object.keys(input.originalConcepts)
        });

        const refinedConcepts = JSON.parse(JSON.stringify(input.originalConcepts)) as ExtractedConcepts; // Deep clone
        let refinementSummary = "Initial review pass. No specific reinforcement logic applied beyond basic check.";
        let confidenceScore = 0.5; // Default placeholder confidence
        let recoveryOccurred = false;
        const recoveryNotes: string[] = [];

        for (const key in DOMAIN_KEYWORDS) {
            const conceptKey = key as ConceptKey;
            const ambiguity = input.ambiguityScores.find(s => s.field === conceptKey);

            if (ambiguity && ambiguity.score >= 1.0) {
                console.log(`[ReinforcementAgent] Attempting keyword recovery for empty field: ${conceptKey}`);
                const keywordsToSearch = DOMAIN_KEYWORDS[conceptKey];
                const foundKeywords: string[] = [];

                if (input.fullDocumentText && keywordsToSearch) {
                    for (const keyword of keywordsToSearch) {
                        // Case-insensitive search
                        if (input.fullDocumentText.toLowerCase().includes(keyword.toLowerCase())) {
                            foundKeywords.push(keyword);
                        }
                    }
                }

                if (foundKeywords.length > 0) {
                    // Ensure the field exists and is an array in refinedConcepts
                    if (!refinedConcepts[conceptKey] || !Array.isArray(refinedConcepts[conceptKey])) {
                        (refinedConcepts[conceptKey] as string[]) = [];
                    }

                    const existingValues = new Set((refinedConcepts[conceptKey] as string[]).map(v => v.toLowerCase()));
                    const newKeywords = foundKeywords.filter(kw => !existingValues.has(kw.toLowerCase()));

                    if (newKeywords.length > 0) {
                        (refinedConcepts[conceptKey] as string[]).push(...newKeywords);
                        recoveryOccurred = true;
                        const recoveryMessage = `Recovered [${newKeywords.join(', ')}] for field '${conceptKey}' via document keyword scan.`;
                        recoveryNotes.push(recoveryMessage);
                        console.log(`[ReinforcementAgent] ${recoveryMessage}`);
                    } else {
                        console.log(`[ReinforcementAgent] Keywords for '${conceptKey}' already present or no new keywords found.`);
                    }
                } else {
                    console.log(`[ReinforcementAgent] No keywords found for '${conceptKey}' in document text.`);
                }
            }
        }

        const highAmbiguityExistsOverall = input.ambiguityScores.some(s => s.score >= 0.75);

        if (recoveryOccurred) {
            confidenceScore = 0.65;
            refinementSummary = recoveryNotes.join(" ");
            if (refinedConcepts.notes) {
                refinedConcepts.notes += " " + recoveryNotes.join(" ");
            } else {
                refinedConcepts.notes = recoveryNotes.join(" ");
            }
        } else if (highAmbiguityExistsOverall) {
            const currentNotes = refinedConcepts.notes || "";
            const ambiguityNote = "[ReinforcementAgent Note: High ambiguity detected in initial extraction; further review advised.]";
            if (!currentNotes.includes(ambiguityNote)) {
                refinedConcepts.notes =
                    currentNotes +
                    (currentNotes ? " " : "") +
                    ambiguityNote;
            }
            refinementSummary = "High ambiguity detected. No keywords recovered. Added a note to the concepts. Full contextual re-analysis pending full agent implementation.";
            confidenceScore = 0.3; // Lower confidence due to detected high ambiguity and no recovery
            console.log('[ReinforcementAgent] High ambiguity detected, no keywords recovered. Mock refinement applied.');
        } else {
            refinementSummary = "No high ambiguity detected and no keywords recovered. Concepts passed through without mock modification.";
            confidenceScore = 0.8; // Higher confidence if no significant ambiguity and no recovery needed/performed
            console.log('[ReinforcementAgent] No high ambiguity and no recovery. Concepts passed through.');
        }

        return {
            refinedConcepts,
            confidenceScore,
            refinementSummary
        };
    }
}

// Example Usage (for testing or direct use - to be adapted when integrated into simulator):
// async function testReinforcement() {
//     const mockInput: ReinforcementInput = {
//         originalConcepts: {
//             principles: ["Possibly Principle A"],
//             methods: [], // Empty, should trigger recovery
//             frameworks: ["Framework X"],
//             theories: [], // Empty, should trigger recovery
//             notes: "Initial notes."
//         },
//         ambiguityScores: [
//             { field: "principles", score: 0.75, reasoning: "Hedging detected" },
//             { field: "methods", score: 1.0, reasoning: "Field empty" },
//             { field: "theories", score: 1.0, reasoning: "Field empty" }
//         ],
//         fullDocumentText: "This is the full document text. Principle A is discussed. It uses agent-based modeling and some genetic algorithm. The underlying theory is complexity theory."
//     };
//     const output = await ReinforcementAgent.refineConcepts(mockInput);
//     console.log("Reinforcement Agent Output:", output);
// }
// testReinforcement(); 