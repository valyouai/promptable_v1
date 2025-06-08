import type { ExtractedConcepts, /* QAValidationResult, */ CognitiveKernelResult, ExtractionResult as GlobalExtractionResult, PersonaType, TraceableConcept } from '@/types';
import { SemanticChunker, type Chunk as SemanticChunk } from '@/lib/chunking/SemanticChunker';
import { ExtractorAgent } from './ExtractorAgent';
import { PatternNormalizer } from '../extraction/PatternNormalizer';
import { AmbiguityDetectorAgent } from './AmbiguityDetectorAgent';
import { DependencyModel, type DependencyInsight } from './DependencyModel';
import { ConfidenceFusionEngine } from './ConfidenceFusionEngine';
import { ReinforcementAgent } from './ReinforcementAgent';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { selfCorrectExtraction } from './SelfCorrectionController';

// 🧠 Phase 14/15: Cognitive Kernel Imports
import { OrchestrationController } from './OrchestrationController';
// 🚀 Phase 22.F: Unified Transfer Kernel Engine Import
import { TransferKernelEngine } from "./transfer-kernel/TransferKernelEngine";
import type { OntologyDomain } from "./ontology-scaffold/OntologyScaffoldTypes"; // Still needed for domain determination
// import { PromptGeneratorEngine } from "./prompt-generator/PromptGeneratorEngine"; // REMOVED FOR 23.B
import { PersonaTransferProfiles } from "./persona-transfer/PersonaTransferProfiles";
import { PersonaTransferOverrides } from "./persona-transfer/PersonaTransferOverrides";
import { PromptCompilerEngine } from "./prompt-compiler/PromptCompilerEngine";
import { VerificationAgentEngine } from "./verification-agent/VerificationAgentEngine";
import { PromptCompilerInput } from "./prompt-compiler/PromptCompilerTypes";
import { normalizeToTraceableConcept } from "@/server/llm/utils/TraceableConceptNormalizer";

// Define output shape for the original extraction part (this was local before, now explicitly named for clarity)
export class ExtractionOrchestrator {

    private static _mergeChunkConcepts(chunkConceptsList: ExtractedConcepts[]): ExtractedConcepts {
        const merged: ExtractedConcepts = {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };

        for (const chunkConcepts of chunkConceptsList) {
            if (chunkConcepts.principles) merged.principles.push(...chunkConcepts.principles);
            if (chunkConcepts.methods) merged.methods.push(...chunkConcepts.methods);
            if (chunkConcepts.frameworks) merged.frameworks.push(...chunkConcepts.frameworks);
            if (chunkConcepts.theories) merged.theories.push(...chunkConcepts.theories);
        }

        return merged;
    }

    static async runExtraction(documentText: string, persona: PersonaType): Promise<CognitiveKernelResult> {
        const processingLog: string[] = [];
        processingLog.push('Starting Extraction Pipeline...');

        const chunks: SemanticChunk[] = SemanticChunker.chunkByTokens(documentText, {
            chunkSizeTokens: 4000,
            tokenOverlap: 200
        });
        processingLog.push(`Document split into ${chunks.length} token-based chunks.`);

        const allChunkConcepts: ExtractedConcepts[] = [];
        processingLog.push(`Starting extraction for ${chunks.length} chunks...`);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            processingLog.push(`Processing chunk ${i + 1}/${chunks.length} (tokens: ${chunk.tokenCount})...`);
            try {
                const chunkConcepts = await ExtractorAgent.extract(chunk.text);
                allChunkConcepts.push(chunkConcepts);
                processingLog.push(`Extraction complete for chunk ${i + 1}.`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                processingLog.push(`Error extracting concepts from chunk ${i + 1}: ${errorMessage}. Skipping this chunk.`);
                console.error(`[ExtractionOrchestrator] Error processing chunk ${i + 1}:`, error);
                // Add a placeholder or empty concept set for the failed chunk to maintain array length if necessary for some merge strategies,
                // or simply skip as done here. For now, skipping.
            }
        }

        if (allChunkConcepts.length === 0 && chunks.length > 0) {
            processingLog.push("All chunks failed to extract concepts. Aborting further processing.");
            // Fallback to an empty structure aligned with new ExtractedConcepts
            const emptyConcepts: ExtractedConcepts = { principles: [], methods: [], frameworks: [], theories: [] }; // 'notes' field removed
            allChunkConcepts.push(emptyConcepts);
        }

        processingLog.push('Merging concepts from all processed chunks...');
        const mergedExtractedConcepts = this._mergeChunkConcepts(allChunkConcepts);
        processingLog.push('Concept merging complete.');

        const normalizedConcepts = PatternNormalizer.normalize(mergedExtractedConcepts);
        processingLog.push('Pattern normalization applied to merged concepts.');

        // Step 4: Ambiguity Detection (operates on merged, normalized concepts)
        const ambiguityScores = AmbiguityDetectorAgent.detectAmbiguities(normalizedConcepts);
        processingLog.push(`Ambiguity detection complete on merged concepts (${ambiguityScores.length} fields scored).`);

        // Step 5: Dependency Analysis (operates on merged, normalized concepts)
        const dependencyModel = new DependencyModel();
        dependencyModel.analyzeDependencies(normalizedConcepts); // This internally builds the graph

        // Correctly build the dependencyInsights map for ConfidenceFusionEngine
        const dependencyInsightsForFusion: Partial<Record<keyof ExtractedConcepts, DependencyInsight[]>> = {};
        const fieldsToAnalyze: (keyof ExtractedConcepts)[] = ['principles', 'methods', 'frameworks', 'theories'];

        for (const sourceField of fieldsToAnalyze) {
            // Updated check for TraceableConcept[]
            if (normalizedConcepts[sourceField] &&
                (Array.isArray(normalizedConcepts[sourceField]) && (normalizedConcepts[sourceField] as TraceableConcept[]).length > 0)
            ) {
                // Assuming getPotentialDependencies is part of your DomainSchema or a similar utility accessible here
                // For now, this matches the existing structure.
                const insightsArray = dependencyModel.getPotentialDependencies(sourceField as import('./DomainSchema').DomainField);
                if (insightsArray.length > 0) {
                    dependencyInsightsForFusion[sourceField] = insightsArray;
                }
            }
        }

        processingLog.push('Dependency analysis complete for merged concepts.');

        // Step 6: Confidence Fusion (operates on merged, normalized concepts)
        const confidenceResult = ConfidenceFusionEngine.fuseSignals({
            concepts: normalizedConcepts,
            ambiguityScores,
            dependencyInsights: dependencyInsightsForFusion,
        });

        processingLog.push('Confidence fusion complete for merged concepts.');

        // Step 7: Reinforcement Pass (operates on merged, normalized concepts, but with full document text)
        const reinforcementOutput = await ReinforcementAgent.refineConcepts({
            originalConcepts: normalizedConcepts, // Pass the merged and normalized concepts
            fullDocumentText: documentText,      // Pass the original full document text
            ambiguityScores,
        });

        processingLog.push('Reinforcement agent pass complete on merged concepts.');

        // Step 8: Self-Correction Loop (placeholder)
        // const selfCorrectionDetailsForGlobalResult: GlobalExtractionResult['selfCorrectionDetails'] = undefined; // Original placeholder removed

        // Step 9: QA Validation (operates on refined concepts from reinforcement, with full document text)
        const qaValidation = await ExtractionQAAgent.validate(documentText, reinforcementOutput.refinedConcepts);
        processingLog.push('QA validation complete on final concepts.');

        // Assemble the extractionResult object
        const initialExtractionResult: GlobalExtractionResult = {
            finalConcepts: reinforcementOutput.refinedConcepts,
            ambiguityScores: ambiguityScores.map(as => ({ ...as, field: as.field as keyof ExtractedConcepts })),
            overallConfidence: confidenceResult.overallConfidence,
            fieldConfidences: confidenceResult.fieldConfidences.map(fc => ({ ...fc, field: fc.field as keyof ExtractedConcepts | string })),
            processingLog,
            reinforcementDetails: reinforcementOutput.refinementSummary
                ? {
                    summary: reinforcementOutput.refinementSummary,
                    attempts: [],
                    needsFurtherReview: reinforcementOutput.confidenceScore !== undefined ? reinforcementOutput.confidenceScore < 0.7 : true,
                }
                : undefined,
            qaValidation,
        };

        // Invoke Self-Correction <--- PHASE 20 INTEGRATION
        processingLog.push('Invoking self-correction loop...');
        const selfCorrectionResultData = await selfCorrectExtraction(initialExtractionResult, documentText, persona);
        processingLog.push(`Self-correction loop complete. Passes run: ${selfCorrectionResultData.passesRun}. Final confidence after correction: ${selfCorrectionResultData.finalOverallConfidence.toFixed(2)}`);

        const extractionResultWithCorrection: GlobalExtractionResult = {
            ...initialExtractionResult,
            selfCorrectionDetails: selfCorrectionResultData,
        };

        // Phase 22.F: Invoke unified Transfer Kernel Engine
        processingLog.push('Invoking Transfer Kernel Engine...');

        // Domain for TransferKernelEngine (must be of type OntologyDomain)
        let transferKernelDomain: OntologyDomain = "literature"; // Default for TransferKernel
        if (persona === "educator") {
            transferKernelDomain = "education";
        } else if (persona === "creator") {
            transferKernelDomain = "business";
        } else if (persona === "researcher") {
            // For TransferKernel, researcher still maps to literature for its ontology alignment needs
            transferKernelDomain = "literature";
        }
        processingLog.push(`Transfer Kernel domain: ${transferKernelDomain} (Persona: ${persona})`);

        const personaTransferOutput = TransferKernelEngine.runTransfer(
            extractionResultWithCorrection.finalConcepts,
            persona,
            transferKernelDomain
        );
        processingLog.push('Transfer Kernel Engine processing complete.');
        console.log("--- Transfer Kernel Engine Output (personaTransferOutput):", personaTransferOutput);

        const personaProfile = PersonaTransferOverrides[persona] ?? PersonaTransferProfiles[persona];

        let promptCompilerDomainKey: string = "ai_art";
        if (persona === "educator") {
            promptCompilerDomainKey = "education";
        } else if (persona === "creator") {
            promptCompilerDomainKey = "business";
        } else if (persona === "researcher") {
            promptCompilerDomainKey = "medicine";
        }
        processingLog.push(`Prompt Compiler domain key: ${promptCompilerDomainKey}`);

        // PATCHED SECTION: Normalize personaTransferOutput before using it as conceptSet
        const normalizedConceptSet = {
            personaPrinciples: normalizeToTraceableConcept(personaTransferOutput.personaPrinciples as unknown as string[]),
            personaMethods: normalizeToTraceableConcept(personaTransferOutput.personaMethods as unknown as string[]),
            personaFrameworks: normalizeToTraceableConcept(personaTransferOutput.personaFrameworks as unknown as string[]),
            personaTheories: normalizeToTraceableConcept(personaTransferOutput.personaTheories as unknown as string[]),
        };

        const promptCompilerInput: PromptCompilerInput = {
            persona: persona,
            domain: promptCompilerDomainKey,
            conceptSet: normalizedConceptSet, // USE NORMALIZED VERSION
            personaProfile: personaProfile
        };
        processingLog.push('Prompt Compiler input prepared.');

        const compiledPrompt = PromptCompilerEngine.compile(promptCompilerInput);
        processingLog.push('Prompt Compiler Engine executed.');
        console.log("--- ADAPTIVE SYSTEM PROMPT ---");
        console.log(compiledPrompt.fullSystemPrompt);

        // Verification Agent Integration (Phase 23.D)
        const verificationInput = {
            systemPrompt: compiledPrompt.fullSystemPrompt,
            persona,
            domain: promptCompilerDomainKey, // Use the domain key that was passed to PromptCompiler
        };

        const verificationResult = VerificationAgentEngine.verify(verificationInput);

        processingLog.push("Verification Agent check complete.");
        console.log("--- VERIFICATION RESULT ---", verificationResult);

        if (!verificationResult.passed) {
            console.warn("⚠ VerificationAgent detected issues:", verificationResult.issues);
        }

        // Phase 22.E logic (preserved): Prepare concepts for existing Cognitive Orchestration Layer
        const conceptsForCognitiveOrchestration: ExtractedConcepts = {
            // Preserve non-core concepts (notes, research objective, etc.) from the main extraction pipeline
            ...extractionResultWithCorrection.finalConcepts,
            // Override core concepts with the fully adapted ones from the transfer pipeline
            principles: personaTransferOutput.personaPrinciples,
            methods: personaTransferOutput.personaMethods,
            frameworks: personaTransferOutput.personaFrameworks,
            theories: personaTransferOutput.personaTheories,
        };
        processingLog.push('Mapped persona-adapted concepts to ExtractedConcepts for cognitive orchestration.');
        console.log("--- Concepts for Cognitive Orchestration ---", conceptsForCognitiveOrchestration);

        // Cognitive orchestration layer post-extraction
        const cognitiveOutput = OrchestrationController.runCognitiveOrchestration(
            conceptsForCognitiveOrchestration, // Use the fully adapted concepts
            persona
        );
        processingLog.push('Phase 15 Cognitive Layer Orchestration invoked successfully.');

        const cognitiveKernelResult: CognitiveKernelResult = {
            extractionResult: extractionResultWithCorrection,
            cognitiveOutput,
            promptTraceMap: compiledPrompt.traceMap,
        };

        return cognitiveKernelResult;
    }
}

// Example usage - Ensure this is removed or commented out for production
/*
async function testOrchestrator() {
    console.log("Testing ExtractionOrchestrator with chunking...");
    // A longer sample text that would benefit from chunking
    const sampleDocumentText = `
    Part 1: Introduction to Core Concepts.
    This document delves into the foundational principles of quantum computing, including superposition and entanglement. 
    Key methods explored are quantum annealing and gate-based quantum computation. Several quantum algorithms, which can be seen as frameworks,
    such as Shor's algorithm and Grover's algorithm, are discussed. The theoretical underpinnings draw heavily from quantum mechanics and information theory.
    Notes from this section emphasize the nascent stage of the technology.

    --- Chunk Separator ---

    Part 2: Advanced Applications and Theories.
    Further, we explore advanced applications in drug discovery and material science. The methods section expands to include variational quantum eigensolvers (VQE).
    Frameworks for quantum machine learning are also introduced. String theory and M-theory are touched upon as remote but relevant theoretical landscapes.
    Scalability remains a primary principle for future development. Entanglement, while a principle, also has methodological implications.
    Notes here focus on the computational challenges.

    --- Chunk Separator ---

    Part 3: Challenges and Future Work.
    The primary challenge is decoherence, a principle that impacts all quantum methods. Building fault-tolerant quantum computers is a key framework for progress.
    Future work will focus on developing new error correction codes (methods) and exploring novel quantum theories. The theory of everything is a distant goal.
    Notes: Experimental validation is crucial. Principles of open science are encouraged.
    Additional observations from part three include the importance of interdisciplinary collaboration. This involves methods from classical computer science.
    The framework for ethical considerations is also paramount. Quantum gravity is a background theory.
    `;
    const testPersona: PersonaType = 'researcher';

    try {
        console.log("\n--- Test Run: Long Document (Persona: " + testPersona + ") ---");
        const result1 = await ExtractionOrchestrator.runExtraction(sampleDocumentText, testPersona);
        console.log("\n--- Orchestrator Test Result (Final with Chunking) ---");
        console.dir(result1, { depth: null });

    } catch (error) {
        console.error("Error during ExtractionOrchestrator test:", error);
    }
}

// testOrchestrator(); // Ensure this is commented out for production
*/ 