import type { AmbiguityScore } from './AmbiguityDetectorAgent';
import type { DependencyInsight } from './DependencyModel';
import type { ExtractedConcepts } from '@/types';
import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema';

// Added type definitions as per Phase 13B Plan
export interface ReinforcementFeedback {
    field: DomainField;
    recovered: boolean;
}

export interface FieldConfidence {
    field: DomainField;
    score: number;
    contributingSignals: {
        type: 'base' | 'ambiguity' | 'dependency' | 'reinforcement' | 'presence'; // Added 'base' for clarity
        details: string;
        value: number;
    }[];
}

export interface UnifiedConfidenceResult {
    overallConfidence: number;
    fieldConfidences: FieldConfidence[];
    fusionLog?: LoggedFusionSignal[]; // Added fusionLog to output
}

// Updated FuseSignalsInput as per Phase 13B Plan
export interface FuseSignalsInput {
    concepts: ExtractedConcepts;
    ambiguityScores: AmbiguityScore[];
    dependencyInsights?: Partial<Record<DomainField, DependencyInsight[]>>;
    reinforcementSignals?: ReinforcementFeedback[]; // Using new ReinforcementFeedback type
}

// Define calibration constants as per Phase 13B Plan
const BASE_CONFIDENCE_PRESENT = 0.8;
const BASE_CONFIDENCE_ABSENT = 0.5;
// AMBIGUITY_PENALTY_FACTOR was 0.25 in previous step, plan says 0.5. Using 0.5 as per current plan.
const AMBIGUITY_PENALTY_FACTOR = 0.5;
const DEPENDENCY_BONUS_FACTOR = 0.05;
const REINFORCEMENT_BONUS_FACTOR = 0.05;

// Interface for detailed logging per field
interface LoggedFusionSignal {
    field: DomainField;
    baseScore: number;
    ambiguityPenalty: number;
    dependencyBonus: number;
    reinforcementBonus: number;
    finalFieldScore: number;
}

export class ConfidenceFusionEngine {
    // Constants moved outside the class to be module-level consts as per the plan's structure
    // The class structure is kept if other static methods or properties are planned for it.
    // If fuseSignals is the only method, the class wrapper might be optional.

    public static fuseSignals(input: FuseSignalsInput): UnifiedConfidenceResult {
        const fusionLog: LoggedFusionSignal[] = [];
        const { concepts, ambiguityScores, dependencyInsights, reinforcementSignals } = input;
        const fieldConfidences: FieldConfidence[] = [];
        let totalScoreSum = 0; // This will sum the *rounded* scores

        // Iterate over DOMAIN_SCHEMA.fields to ensure all schema-defined fields are considered,
        // even if not present in concepts (they would be treated as absent).
        for (const field of DOMAIN_SCHEMA.fields as readonly DomainField[]) {
            const fieldKey = field;
            const conceptArray = concepts[fieldKey];
            const hasContent = Array.isArray(conceptArray) && conceptArray.length > 0;

            let fieldScoreUnrounded = hasContent ? BASE_CONFIDENCE_PRESENT : BASE_CONFIDENCE_ABSENT;
            const baseScore = fieldScoreUnrounded; // Log the unrounded base for precision in log

            const currentSignalsLogic: { type: FieldConfidence['contributingSignals'][number]['type'], value: number, details: string }[] = [
                { type: 'base', value: baseScore, details: hasContent ? 'Content present' : 'Content absent' }
            ];

            const fieldAmbiguities = ambiguityScores.filter(a => a.field === fieldKey);
            const avgAmbiguity = fieldAmbiguities.reduce((sum, a) => sum + a.score, 0) / (fieldAmbiguities.length || 1);
            const ambiguityPenalty = avgAmbiguity * AMBIGUITY_PENALTY_FACTOR;
            fieldScoreUnrounded -= ambiguityPenalty;
            currentSignalsLogic.push({ type: 'ambiguity', value: -ambiguityPenalty, details: `Avg ambiguity ${avgAmbiguity.toFixed(3)} (Factor: ${AMBIGUITY_PENALTY_FACTOR})` });

            const relatedDependencies = dependencyInsights?.[fieldKey] || [];

            // Safecast concepts to a string-indexed map for robust lookup in filter
            const conceptsMap: Record<string, string[] | undefined> = {};
            for (const key in concepts) {
                if (Object.prototype.hasOwnProperty.call(concepts, key) && DOMAIN_SCHEMA.isValidField(key)) {
                    const conceptValue = concepts[key as DomainField];
                    if (Array.isArray(conceptValue)) {
                        conceptsMap[key] = conceptValue as string[] | undefined;
                    }
                }
            }

            const activeDependencyCount = relatedDependencies.filter(dep => {
                const dependentConceptData = conceptsMap[dep.field];
                const isDepActive = Array.isArray(dependentConceptData) && dependentConceptData.length > 0;
                return isDepActive;
            }).length;

            const dependencyBonus = activeDependencyCount * DEPENDENCY_BONUS_FACTOR;

            let depDetails = `${activeDependencyCount} active dependencies contributed to bonus. Checked: `;
            if (relatedDependencies.length > 0) {
                relatedDependencies.forEach(dep => {
                    const depConceptData = concepts[dep.field];
                    const depHasContent = Array.isArray(depConceptData) && depConceptData.length > 0;
                    depDetails += `${dep.field}(${depHasContent ? 'active' : 'inactive'}, str:${dep.strength}); `;
                });
            } else {
                depDetails = "No defined dependencies for this field.";
            }
            fieldScoreUnrounded += dependencyBonus;
            currentSignalsLogic.push({ type: 'dependency', value: dependencyBonus, details: depDetails + ` (Bonus factor: ${DEPENDENCY_BONUS_FACTOR})` });

            const reinforcement = reinforcementSignals?.some(r => r.field === fieldKey && r.recovered);
            const reinforcementBonus = reinforcement ? REINFORCEMENT_BONUS_FACTOR : 0;
            fieldScoreUnrounded += reinforcementBonus;
            currentSignalsLogic.push({ type: 'reinforcement', value: reinforcementBonus, details: reinforcement ? `Field recovered (Bonus factor: ${REINFORCEMENT_BONUS_FACTOR})` : "No reinforcement recovery for this field." });

            // Clamp the unrounded score first
            const clampedFieldScore = Math.max(0, Math.min(1, fieldScoreUnrounded));

            // Now, round the clamped score to a consistent precision (e.g., 3 decimal places)
            // This rounded score is what will be used for summation and final reporting.
            const finalFieldScoreRounded = parseFloat(clampedFieldScore.toFixed(3));

            fusionLog.push({
                field: fieldKey,
                baseScore: baseScore, // Log unrounded for more precision if desired, or round here too
                ambiguityPenalty: -ambiguityPenalty, // Log actual penalty value
                dependencyBonus: dependencyBonus,
                reinforcementBonus: reinforcementBonus,
                finalFieldScore: finalFieldScoreRounded // Log the final rounded score
            });

            fieldConfidences.push({
                field: fieldKey,
                score: finalFieldScoreRounded, // Store the rounded score
                contributingSignals: currentSignalsLogic.map(s => ({ ...s, value: parseFloat(s.value.toFixed(3)) })) // Also round signal values for display
            });

            totalScoreSum += finalFieldScoreRounded; // Sum the rounded scores
        }

        // Handle fields in concepts that might not be in DOMAIN_SCHEMA.fields (e.g. 'notes')
        // This part ensures any other fields like 'notes' are carried over but not part of primary confidence scoring.
        for (const fieldKey in concepts) {
            if (!(DOMAIN_SCHEMA.fields as readonly string[]).includes(fieldKey)) {
                const field = fieldKey as DomainField; // Cast, assuming it might be a known non-array field
                if (!fieldConfidences.some(fc => fc.field === field)) { // Avoid duplicating if handled above by mistake
                    // For 'notes' or other non-scored fields, we assign a neutral/pass-through confidence or specific logic
                    // For now, just log their presence if they are not part of the core scored fields.
                    // console.log(`[ConfidenceFusionEngine] Field '${field}' present in concepts but not in DOMAIN_SCHEMA.fields for scoring.`);
                    // If they need to be in fieldConfidences, they need a score and signals.
                    // For simplicity, Phase 13B focuses on schema fields for structured scoring.
                }
            }
        }

        const overallConfidenceUnrounded = fieldConfidences.length > 0 ? totalScoreSum / fieldConfidences.length : 0;
        // Round the final overallConfidence as well
        const overallConfidenceRounded = parseFloat(overallConfidenceUnrounded.toFixed(3));

        return {
            overallConfidence: overallConfidenceRounded,
            fieldConfidences,
            fusionLog
        };
    }
}

// Example Usage (adjusted for Phase 13B)
/*
async function testConfidenceFusionEngine() {
    console.log("--- Testing ConfidenceFusionEngine (Phase 13B) ---");

    const exampleConcepts: ExtractedConcepts = {
        principles: ["Adaptation", "Robustness"],
        methods: ["RL"],
        frameworks: [], // Empty
        theories: ["Game Theory"],
        notes: "This is a test note."
    };

    const exampleAmbiguityScores: AmbiguityScore[] = [
        { field: "principles", score: 0.1, reasoning: "Minor ambiguity" },
        { field: "methods", score: 0.8, reasoning: "Highly ambiguous" }, // Increased ambiguity for methods
        { field: "frameworks", score: 1.0, reasoning: "Field empty" } // Ambiguity for empty field
    ];

    const exampleDependencyInsights: Partial<Record<DomainField, DependencyInsight[]>> = {
        principles: [{ field: "methods", strength: 2 }, { field: "theories", strength: 1 }],
        methods: [{ field: "principles", strength: 2 }, { field: "theories", strength: 1 }],
        theories: [{ field: "methods", strength: 1 }]
    };

    const exampleReinforcementSignals: ReinforcementFeedback[] = [
        { field: "methods", recovered: true }, // Methods was recovered
        { field: "frameworks", recovered: false } // Frameworks recovery was attempted but failed (or not applicable)
    ];

    const fusionInput1: FuseSignalsInput = {
        concepts: exampleConcepts,
        ambiguityScores: exampleAmbiguityScores,
        dependencyInsights: exampleDependencyInsights,
        reinforcementSignals: exampleReinforcementSignals
    };

    const result1 = ConfidenceFusionEngine.fuseSignals(fusionInput1);
    console.log("\n--- Confidence Fusion Result 1 (With Reinforcement & Dependencies) ---");
    console.dir(result1, { depth: null });

    const fusionInput2: FuseSignalsInput = {
        concepts: {
            principles: ["Clarity"],
            methods: ["Formal Verification"],
            frameworks: ["Coq"],
            theories: ["Type Theory"],
            notes: "All clear."
        },
        ambiguityScores: [
            {field: "principles", score: 0, reasoning: "clear"},
            {field: "methods", score: 0, reasoning: "clear"},
            {field: "frameworks", score: 0, reasoning: "clear"},
            {field: "theories", score: 0, reasoning: "clear"},
        ],
        dependencyInsights: {
            principles: [{field: "methods", strength: 3}],
            methods: [{field: "frameworks", strength: 2}]
        },
        reinforcementSignals: [] // No reinforcement actions taken
    };
    const result2 = ConfidenceFusionEngine.fuseSignals(fusionInput2);
    console.log("\n--- Confidence Fusion Result 2 (All Clear, No Reinforcement) ---");
    console.dir(result2, { depth: null });

}
// testConfidenceFusionEngine();
*/ 