import { SMELiteInput, SMEMappedConcepts } from "./SMELiteTypes";
import { TraceableConcept } from "@/types";

export class SMELiteEngine {
    static map(input: SMELiteInput): SMEMappedConcepts {
        // 🧪 DEBUG HEADER
        console.log("--- SME-Lite Mapping Activated ---");
        console.log("Input Concepts:", input.finalConcepts);
        console.log("Persona:", input.persona);

        // Helper to transform an array of mixed TraceableConcepts/strings into an array of strings
        const safeMapToStringArray = (conceptsInput: ReadonlyArray<TraceableConcept | string> | undefined): string[] => {
            if (!conceptsInput || !Array.isArray(conceptsInput)) {
                return [];
            }
            return conceptsInput.map(concept => {
                if (typeof concept === 'string') {
                    return concept; // It's already a string
                }
                // Assumes 'concept' is a TraceableConcept if not a string
                if (concept && typeof concept.value === 'string') {
                    return concept.value;
                }
                // Fallback for unexpected structures.
                // This logs a warning and returns a placeholder to avoid downstream errors.
                console.warn(`[SMELiteEngine] Unexpected concept structure encountered during mapping: ${JSON.stringify(concept)}`);
                return `[Malformed Concept Data]`;
            });
        };

        // The input fields (e.g., input.finalConcepts.principles) are typed as TraceableConcept[].
        // However, due to observed runtime data, they might contain strings.
        // The 'as (TraceableConcept | string)[]' cast acknowledges this possibility for the helper.
        return {
            mappedPrinciples: safeMapToStringArray(input.finalConcepts.principles as (TraceableConcept | string)[] | undefined),
            mappedMethods: safeMapToStringArray(input.finalConcepts.methods as (TraceableConcept | string)[] | undefined),
            mappedFrameworks: safeMapToStringArray(input.finalConcepts.frameworks as (TraceableConcept | string)[] | undefined),
            mappedTheories: safeMapToStringArray(input.finalConcepts.theories as (TraceableConcept | string)[] | undefined),
        };
    }
} 