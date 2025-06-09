import { TraceableConcept } from "@/types";

export interface TransferKernelConceptSet {
    personaPrinciples: TraceableConcept[];
    personaMethods: TraceableConcept[];
    personaFrameworks: TraceableConcept[];
    personaTheories: TraceableConcept[];
}

export interface PromptGeneratorInput {
    persona: string;
    domain: string;
    conceptSet: TransferKernelConceptSet;
}

export interface SystemPromptOutput {
    fullSystemPrompt: string;
} 