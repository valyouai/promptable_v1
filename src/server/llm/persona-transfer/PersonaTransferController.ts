import { PersonaTransferInput, PersonaTransferOutput } from "./PersonaTransferTypes";
import { PersonaTransferProfiles } from "./PersonaTransferProfiles";
import { TraceableConcept } from "@/types";

export class PersonaTransferController {
    static adapt(input: PersonaTransferInput): PersonaTransferOutput {
        console.log("--- Persona Transfer Controller Activated ---");
        console.log("Ontology Concepts:", input.ontologyConcepts);
        console.log("Persona:", input.persona);

        const profile = PersonaTransferProfiles[input.persona] || PersonaTransferProfiles["researcher"]; // Default to researcher if persona not found

        const adjust = (
            concepts: ReadonlyArray<TraceableConcept>,
            factor: number
        ): TraceableConcept[] => {
            return concepts.map((originalConcept: TraceableConcept) => {
                const baseValue = originalConcept.value;
                let personaAdaptedValue = `${baseValue} (balanced)`;

                if (factor >= 0.8) {
                    personaAdaptedValue = `${baseValue} (generalized)`;
                } else if (factor <= 0.2) {
                    personaAdaptedValue = `${baseValue} (precise)`;
                }

                return {
                    ...originalConcept,
                    value: personaAdaptedValue,
                };
            });
        };

        return {
            principles: adjust(input.ontologyConcepts.ontologyPrinciples, profile.domainAdaptationFlexibility).map((tc: TraceableConcept) => tc.value),
            methods: adjust(input.ontologyConcepts.ontologyMethods, profile.semanticBridgeAggressiveness).map((tc: TraceableConcept) => tc.value),
            frameworks: adjust(input.ontologyConcepts.ontologyFrameworks, profile.semanticBridgeAggressiveness).map((tc: TraceableConcept) => tc.value),
            theories: adjust(input.ontologyConcepts.ontologyTheories, profile.translationConservativeness).map((tc: TraceableConcept) => tc.value),
        };
    }
} 