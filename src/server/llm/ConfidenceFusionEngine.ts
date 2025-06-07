import type { AmbiguityScore } from './AmbiguityDetectorAgent';
import type { DependencyInsight } from './DependencyModel';
import type { ExtractedConcepts } from '../../../types';
import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema';

export interface FieldConfidence {
    field: DomainField;
    score: number; // Typically 0.0 to 1.0
    contributingSignals: {
        type: 'ambiguity' | 'dependency' | 'presence' | 'reinforcement';
        details: string;
        value: number; // The raw value of the signal component
    }[];
}

export interface UnifiedConfidenceResult {
    overallConfidence: number; // Aggregated confidence for the whole extraction
    fieldConfidences: FieldConfidence[];
}

interface FusionInput {
    concepts: ExtractedConcepts;
    ambiguityScores: AmbiguityScore[];
    // Insights per field: e.g. { principles: [DependencyInsight for principles], ... }
    dependencyInsights?: Partial<Record<DomainField, DependencyInsight[]>>;
    // Future signals, e.g., reinforcement outcomes
    // reinforcementFeedback?: ReinforcementOutput;
}

export class ConfidenceFusionEngine {
    // Base confidence if a field has content and no negative signals
    private static readonly BASE_CONFIDENCE_PRESENT = 0.8;
    private static readonly BASE_CONFIDENCE_ABSENT = 0.5; // Neutral confidence for absent but non-critical fields

    // Penalties/Bonuses (examples, to be tuned)
    private static readonly AMBIGUITY_PENALTY_FACTOR = 0.5; // Max penalty from ambiguity
    // private static readonly DEPENDENCY_BONUS_FACTOR = 0.1; // Max bonus from strong dependencies

    public static fuseSignals(input: FusionInput): UnifiedConfidenceResult {
        const { concepts, ambiguityScores, dependencyInsights } = input;
        const fieldConfidences: FieldConfidence[] = [];
        let totalScoreSum = 0;
        let scoredFieldsCount = 0;

        for (const field of DOMAIN_SCHEMA.fields) {
            const fieldKey = field as DomainField;
            const conceptData = concepts[fieldKey];
            const hasContent = Array.isArray(conceptData) ? conceptData.length > 0 : !!conceptData;

            let fieldScore = hasContent ? this.BASE_CONFIDENCE_PRESENT : this.BASE_CONFIDENCE_ABSENT;
            const signals: FieldConfidence['contributingSignals'] = [];

            if (hasContent) {
                signals.push({ type: 'presence', details: 'Field has content', value: this.BASE_CONFIDENCE_PRESENT });
            } else {
                signals.push({ type: 'presence', details: 'Field is empty', value: this.BASE_CONFIDENCE_ABSENT });
            }

            // 1. Factor in Ambiguity Scores
            const relevantAmbiguities = ambiguityScores.filter(a => a.field === fieldKey);
            if (relevantAmbiguities.length > 0) {
                // Simple approach: average ambiguity scores for the field and apply penalty
                // Ambiguity scores are 0-1 (0=clear, 1=ambiguous). We want to penalize higher ambiguity.
                const avgAmbiguity = relevantAmbiguities.reduce((sum, a) => sum + a.score, 0) / relevantAmbiguities.length;
                const penalty = avgAmbiguity * this.AMBIGUITY_PENALTY_FACTOR;
                fieldScore -= penalty;
                signals.push({
                    type: 'ambiguity',
                    details: `Avg ambiguity ${avgAmbiguity.toFixed(2)} resulted in -${penalty.toFixed(2)} penalty`,
                    value: -penalty
                });
            }

            // 2. Factor in Dependency Insights (Placeholder)
            if (dependencyInsights && dependencyInsights[fieldKey]) {
                const fieldDeps = dependencyInsights[fieldKey] || [];
                if (fieldDeps.length > 0) {
                    // Example: Add a small bonus if strong dependencies are present and also have content
                    // This logic would need to be more sophisticated, e.g., checking confidence of dependent fields.
                    // For now, just a note.
                    signals.push({ type: 'dependency', details: `Field has ${fieldDeps.length} defined dependencies (logic pending)`, value: 0 });
                }
            }

            // 3. Future: Factor in Reinforcement Agent feedback

            fieldScore = Math.max(0, Math.min(1, fieldScore)); // Clamp score between 0 and 1

            fieldConfidences.push({
                field: fieldKey,
                score: parseFloat(fieldScore.toFixed(2)), // Keep it to 2 decimal places
                contributingSignals: signals
            });

            totalScoreSum += fieldScore;
            scoredFieldsCount++;
        }

        const overallConfidence = scoredFieldsCount > 0 ? totalScoreSum / scoredFieldsCount : 0;

        return {
            overallConfidence: parseFloat(overallConfidence.toFixed(2)),
            fieldConfidences
        };
    }
}

// Example Usage (for testing - remove or comment out for production)
/*
const exampleInput: FusionInput = {
    concepts: {
        principles: ["Adaptation", "Robustness"],
        methods: ["RL"],
        frameworks: [], // Empty
        theories: ["Game Theory"]
    },
    ambiguityScores: [
        { field: "principles", term: "Adaptation", score: 0.1, suggestion: "Clarify context A" },
        { field: "methods", term: "RL", score: 0.7, suggestion: "Specify which RL algorithm" }
    ],
    dependencyInsights: {
        principles: [{ field: "methods", strength: 2 }],
        methods: [{ field: "principles", strength: 2 }, { field: "theories", strength: 1 }],
        theories: [{ field: "methods", strength: 1 }]
    }
};

const result = ConfidenceFusionEngine.fuseSignals(exampleInput);
console.log("--- Confidence Fusion Result ---");
console.dir(result, { depth: null });

const exampleInputNoAmbiguity: FusionInput = {
    concepts: {
        principles: ["Modularity"],
        methods: ["ABM"],
        frameworks: [], 
        theories: []
    },
    ambiguityScores: [],
    dependencyInsights: {
        principles: [{ field: "methods", strength: 1 }],
        methods: [{ field: "principles", strength: 1 }]
    }
};
const result2 = ConfidenceFusionEngine.fuseSignals(exampleInputNoAmbiguity);
console.log("--- Confidence Fusion Result (No Ambiguity) ---");
console.dir(result2, { depth: null });
*/ 