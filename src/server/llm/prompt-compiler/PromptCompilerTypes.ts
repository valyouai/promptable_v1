import { TransferKernelConceptSet } from "@/server/llm/prompt-generator/PromptGeneratorTypes";
import { PersonaTransferProfile } from "@/server/llm/persona-transfer/PersonaTransferTypes";
import { TraceableConcept } from "@/types";

export interface PromptCompilerInput {
    persona: string;
    domain: string;
    conceptSet: TransferKernelConceptSet;
    personaProfile: PersonaTransferProfile;
}

export interface CompiledPromptOutput {
    fullSystemPrompt: string;
    traceMap: {
        principles: TraceableConcept[];
        methods: TraceableConcept[];
        frameworks: TraceableConcept[];
        theories: TraceableConcept[];
    };
} 