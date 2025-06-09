import { FrameAdaptedConcepts } from "@/server/llm/frame-semantic/FrameSemanticTypes";
import { TraceableConcept } from "@/types";

export type OntologyDomain = "literature" | "education" | "business";

export interface OntologyScaffoldInput {
    frameAdaptedConcepts: FrameAdaptedConcepts;
    domain: OntologyDomain;
    persona: string;
}

export interface OntologyMappedConcepts {
    ontologyPrinciples: TraceableConcept[];
    ontologyMethods: TraceableConcept[];
    ontologyFrameworks: TraceableConcept[];
    ontologyTheories: TraceableConcept[];
} 