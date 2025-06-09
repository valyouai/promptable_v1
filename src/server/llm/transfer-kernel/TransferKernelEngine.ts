import { ExtractedConcepts, PersonaType } from "@/types";
import { SMELiteEngine } from "../sme-lite/SMELiteEngine";
import { FrameSemanticTranslator } from "../frame-semantic/FrameSemanticTranslator";
import { OntologyScaffoldEngine } from "../ontology-scaffold/OntologyScaffoldEngine";
import { OntologyDomain } from "../ontology-scaffold/OntologyScaffoldTypes";
import { PersonaTransferController } from "../persona-transfer/PersonaTransferController";
import { PersonaTransferOutput } from "../persona-transfer/PersonaTransferTypes";

export class TransferKernelEngine {
    static runTransfer(
        initialConcepts: ExtractedConcepts, // Concepts from the main extraction pipeline (e.g., extractionResultWithCorrection.finalConcepts)
        persona: PersonaType,
        domain: OntologyDomain // Domain explicitly passed, not derived from persona within this engine
    ): PersonaTransferOutput {
        console.log("--- [TransferKernelEngine] Activated ---");
        console.log("[TransferKernelEngine] Initial Concepts:", initialConcepts);
        console.log("[TransferKernelEngine] Persona:", persona);
        console.log("[TransferKernelEngine] Domain:", domain);

        // Stage 1: SME-Lite Engine
        const smeLiteInput = {
            finalConcepts: initialConcepts, // Pass the initial concepts
            persona,
        };
        const smeLiteOutput = SMELiteEngine.map(smeLiteInput);
        console.log("[TransferKernelEngine] SME-Lite Output:", smeLiteOutput);

        // Stage 2: Frame-Semantic Translator
        const frameSemanticInput = {
            mappedConcepts: smeLiteOutput,
            persona,
        };
        const frameSemanticOutput = FrameSemanticTranslator.translate(frameSemanticInput);
        console.log("[TransferKernelEngine] Frame-Semantic Output:", frameSemanticOutput);

        // Stage 3: Ontology Scaffold Engine
        const ontologyInput = {
            frameAdaptedConcepts: frameSemanticOutput,
            domain, // Use the explicitly passed domain
            persona,
        };
        const ontologyOutput = OntologyScaffoldEngine.map(ontologyInput);
        console.log("[TransferKernelEngine] Ontology Scaffold Output:", ontologyOutput);

        // Stage 4: Persona Transfer Controller
        const personaTransferInput = {
            ontologyConcepts: ontologyOutput,
            persona,
        };
        const personaTransferOutput = PersonaTransferController.adapt(personaTransferInput);
        console.log("[TransferKernelEngine] Persona Transfer Output (Final from Controller):", personaTransferOutput);

        return personaTransferOutput;
    }
} 