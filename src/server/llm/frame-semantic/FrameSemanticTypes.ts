import { SMEMappedConcepts } from "@/server/llm/sme-lite/SMELiteTypes";
import { TraceableConcept } from "@/types";

export interface FrameSemanticInput {
    mappedConcepts: SMEMappedConcepts;
    persona: string;
}

export interface FrameAdaptedConcepts {
    adaptedPrinciples: TraceableConcept[];
    adaptedMethods: TraceableConcept[];
    adaptedFrameworks: TraceableConcept[];
    adaptedTheories: TraceableConcept[];
} 