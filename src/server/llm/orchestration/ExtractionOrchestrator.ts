import { normalizeToTraceableConcept } from "@/server/llm/utils/TraceableConceptNormalizer";
import { TransferKernelConceptSet } from "@/server/llm/prompt-generator/PromptGeneratorTypes";
import { FusionPolicyEngine } from "../fusion-policy/FusionPolicyEngine";
import { WeightMatrixEngine } from "../fusion-policy/WeightMatrixEngine";
import type { ExtractionRequest, ExtractionResult, ExtractedConcepts, PersonaType, TraceableConcept } from '@/types';
import { TransferKernelEngine } from '@/server/llm/transfer-kernel/TransferKernelEngine';
import { OntologyDomain } from "../ontology-scaffold/OntologyScaffoldTypes";

export class ExtractionOrchestrator {
    public static async runExtraction(request: ExtractionRequest): Promise<ExtractionResult> {
        const persona: PersonaType = request.persona;
        const processingLog: string[] = [];

        // Placeholder for initialConcepts and domain, these would typically come from the request or earlier in the pipeline
        const initialConcepts: ExtractedConcepts = { principles: [], methods: [], frameworks: [], theories: [] };
        const domain: OntologyDomain = "literature";

        const personaTransferOutput = TransferKernelEngine.runTransfer(initialConcepts, persona, domain);

        const normalizedConceptSet: TransferKernelConceptSet = {
            personaPrinciples: normalizeToTraceableConcept(personaTransferOutput.principles),
            personaMethods: normalizeToTraceableConcept(personaTransferOutput.methods),
            personaFrameworks: normalizeToTraceableConcept(personaTransferOutput.frameworks),
            personaTheories: normalizeToTraceableConcept(personaTransferOutput.theories),
        };
        processingLog.push('Concept set normalized to TraceableConcepts.');

        // --- BEGIN PHASE 25: Persona-Adaptive WeightMatrix Amplification ---

        const flatConceptSet: Record<string, string[]> = {
            principles: normalizedConceptSet.personaPrinciples.map((c: TraceableConcept) => c.value),
            methods: normalizedConceptSet.personaMethods.map((c: TraceableConcept) => c.value),
            frameworks: normalizedConceptSet.personaFrameworks.map((c: TraceableConcept) => c.value),
            theories: normalizedConceptSet.personaTheories.map((c: TraceableConcept) => c.value),
        };

        const weightedStrings = WeightMatrixEngine.applyWeights(persona, flatConceptSet);

        const weightedConceptSet: ExtractedConcepts = {
            principles: weightedStrings.principles.map((value: string) => ({ value, source: "WeightMatrix" }) as TraceableConcept),
            methods: weightedStrings.methods.map((value: string) => ({ value, source: "WeightMatrix" }) as TraceableConcept),
            frameworks: weightedStrings.frameworks.map((value: string) => ({ value, source: "WeightMatrix" }) as TraceableConcept),
            theories: weightedStrings.theories.map((value: string) => ({ value, source: "WeightMatrix" }) as TraceableConcept),
        };

        // --- END PHASE 25 ---

        const fusionPolicyAdjustedConceptSet: ExtractedConcepts = FusionPolicyEngine.applyPolicy(weightedConceptSet);

        const finalConcepts: ExtractedConcepts = {
            principles: (fusionPolicyAdjustedConceptSet.principles || []).map((tc: TraceableConcept) => ({ value: tc.value, source: tc.source, score: tc.score }) as TraceableConcept),
            methods: (fusionPolicyAdjustedConceptSet.methods || []).map((tc: TraceableConcept) => ({ value: tc.value, source: tc.source, score: tc.score }) as TraceableConcept),
            frameworks: (fusionPolicyAdjustedConceptSet.frameworks || []).map((tc: TraceableConcept) => ({ value: tc.value, source: tc.source, score: tc.score }) as TraceableConcept),
            theories: (fusionPolicyAdjustedConceptSet.theories || []).map((tc: TraceableConcept) => ({ value: tc.value, source: tc.source, score: tc.score }) as TraceableConcept),
        };

        return {
            finalConcepts: finalConcepts,
            processingLog: processingLog,
        };
    }
}
