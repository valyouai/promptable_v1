import { OntologyMappedConcepts } from "@/server/llm/ontology-scaffold/OntologyScaffoldTypes";
// import { TraceableConcept } from "@/types"; // Removed unused import

export interface PersonaTransferInput {
    ontologyConcepts: OntologyMappedConcepts;
    persona: string;
}

export interface PersonaTransferOutput {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
}

export interface PersonaTransferProfile {
    domainAdaptationFlexibility: number;
    semanticBridgeAggressiveness: number;
    translationConservativeness: number;
} 