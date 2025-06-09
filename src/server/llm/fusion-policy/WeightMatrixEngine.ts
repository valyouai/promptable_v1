// import { TransferKernelConceptSet } from "../prompt-generator/PromptGeneratorTypes"; // To be removed
import { TraceableConcept, PersonaType, ExtractedConcepts } from "../../../types";
import { PersonaWeightProfiles } from "@/server/llm/personas/PersonaWeightProfiles";

// Define a type for the individual profile
type WeightProfile = Record<keyof ExtractedConcepts, number>;

// Phase 26.D: Persona-specific weighting profiles
const personaWeightProfiles: Record<PersonaType, WeightProfile> & { default: WeightProfile } = {
    creator: {
        principles: 1.5,
        methods: 1.2,
        frameworks: 1.0,
        theories: 0.8,
    },
    educator: {
        principles: 1.2,
        methods: 1.5,
        frameworks: 1.0,
        theories: 1.0,
    },
    researcher: {
        principles: 1.0,
        methods: 1.0,
        frameworks: 1.5,
        theories: 1.2,
    },
    // Default or fallback weights if needed
    default: {
        principles: 1.0,
        methods: 1.0,
        frameworks: 1.0,
        theories: 1.0,
    },
};

export interface WeightedTraceableConcept extends TraceableConcept {
    originalScore?: number; // To preserve any pre-existing score
    weight: number;
    weightedScore: number;
    weightProfile?: PersonaType; // Optional breadcrumb for audit trail
}

export interface WeightedConceptSet extends ExtractedConcepts {
    principles: WeightedTraceableConcept[];
    methods: WeightedTraceableConcept[];
    frameworks: WeightedTraceableConcept[];
    theories: WeightedTraceableConcept[];
}

export class WeightMatrixEngine {
    static applyWeights(
        persona: string,
        conceptSet: Record<string, string[]>
    ): Record<string, string[]> {
        const profile = PersonaWeightProfiles.find((p) => p.persona === persona);
        if (!profile) return conceptSet; // Failsafe: no weighting applied if persona missing

        const weightedConceptSet: Record<string, string[]> = {};

        for (const field of ["principles", "methods", "frameworks", "theories"]) {
            const fieldWeight = profile.weights[field as keyof typeof profile.weights];
            const originalValues = conceptSet[field] ?? [];

            // Ensure fieldWeight is treated as a number for Math.round and Math.max
            const numFieldWeight = Number(fieldWeight);

            weightedConceptSet[field] = originalValues.flatMap((value) =>
                // Ensure at least one copy, even if weight is < 1 but > 0. Math.round(0.8) is 1.
                // If fieldWeight is 0, it should result in 0 copies if flatMap handles empty arrays correctly from fill(0).
                // Math.max(1, Math.round(numFieldWeight)) was the original logic, which means a weight of 0.3 (rounds to 0) would become 1.
                // If the intent is for weights < 0.5 (that round to 0) to truly remove/reduce concepts, this needs adjustment.
                // The current logic Math.max(1, Math.round(numFieldWeight)) means concepts are *at least* preserved or amplified.
                // If a weight like 0.8 (for 'theories' in 'creator') is meant to reduce likelihood, this logic needs review.
                // For now, sticking to the provided logic which emphasizes amplification/preservation.
                Array(Math.max(1, Math.round(numFieldWeight))).fill(value)
            );
        }

        return weightedConceptSet;
    }

    static weighSpecificConcepts(
        concepts: TraceableConcept[],
        persona: PersonaType,
        category: keyof ExtractedConcepts
    ): WeightedTraceableConcept[] {
        if (!concepts || concepts.length === 0) return [];

        const weights: WeightProfile = personaWeightProfiles[persona] || personaWeightProfiles.default;
        const categoryWeight = weights[category];

        return concepts.map(concept => {
            const originalScore = concept.score ?? 1.0;
            return {
                ...concept,
                originalScore: concept.score,
                weight: categoryWeight,
                weightedScore: originalScore * categoryWeight,
                weightProfile: persona, // Refinement 4: Future-Proofing Hook
            };
        });
    }
} 