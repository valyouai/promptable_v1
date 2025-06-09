// KERNEL PHASE LOG:
// ... (previous phase log entries)
// Phase 26.D: Persona-specific weighting layer scaffold activated (observation-only mode)
// Phase 26.E: Kernel Weight Activation - Weighted Density Scoring enabled

import type {
    ExtractedConcepts,
    CognitiveKernelResult,
    ExtractionResult as GlobalExtractionResult,
    PersonaType,
    TraceableConcept,
    KernelDensityProfile, // Phase 26.E: For final result structure - Reinstated for aliasing
    KernelMultiHopReasoning, // Phase 26.E: For final result structure
    PromptTraceMap // For final result structure
} from '@/types';
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
import { OrchestrationController, type CognitiveOrchestrationOutput } from './OrchestrationController';
// 🚀 Phase 22.F: Unified Transfer Kernel Engine Import
import { TransferKernelEngine } from "./transfer-kernel/TransferKernelEngine";
import type { OntologyDomain } from "./ontology-scaffold/OntologyScaffoldTypes"; // Still needed for domain determination
// import { PromptGeneratorEngine } from "./prompt-generator/PromptGeneratorEngine"; // REMOVED FOR 23.B
import { PersonaTransferProfiles } from "./persona-transfer/PersonaTransferProfiles";
import { PersonaTransferOverrides } from "./persona-transfer/PersonaTransferOverrides";
import type { PersonaTransferOutput } from "@/server/llm/persona-transfer/PersonaTransferTypes";
import { PromptCompilerEngine } from "./prompt-compiler/PromptCompilerEngine";
import { VerificationAgentEngine } from "./verification-agent/VerificationAgentEngine";
import type { VerificationResult } from './verification-agent/VerificationAgentTypes'; // 'VerificationInput' removed
import { PromptCompilerInput, type CompiledPromptOutput } from "./prompt-compiler/PromptCompilerTypes"; // For final result & usage
import { normalizeToTraceableConcept } from "@/server/llm/utils/TraceableConceptNormalizer";
import { MultiHopComposerEngine } from "./reasoning-composer/MultiHopComposerEngine";
import { MultiHopComposerInput, MultiHopComposerOutput } from "./reasoning-composer/MultiHopComposerTypes";
import { TransferKernelConceptSet } from "@/server/llm/prompt-generator/PromptGeneratorTypes";
import { FusionPolicyEngine } from "./fusion-policy/FusionPolicyEngine"; // Phase 26.A: Import FusionPolicyEngine
// Phase 26.D: Import WeightMatrixEngine and related types
import { WeightMatrixEngine, type WeightedConceptSet, type WeightedTraceableConcept } from "./fusion-policy/WeightMatrixEngine";
// import type { KernelDensityProfile } from '@/types'; // Removed duplicate import
type DensityProfile = KernelDensityProfile; // Alias uses the import from @/types

// --- BEGIN PHASE 24.A Traceability Agent ---
// interface ReasoningTrace { // ReasoningTrace removed as it's unused
//     traceId: string;
//     composedMapping: string;
//     origin: string;
//     persona: string;
//     domain: string;
//     timestamp: string;
//     score?: number;  // Scoring hook: trace-level evaluation
// }
// --- END PHASE 24.A Traceability Agent ---

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

        const personaTransferOutput: PersonaTransferOutput = TransferKernelEngine.runTransfer(
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

        const normalizedConceptSet: TransferKernelConceptSet = {
            personaPrinciples: normalizeToTraceableConcept(personaTransferOutput.principles),
            personaMethods: normalizeToTraceableConcept(personaTransferOutput.methods),
            personaFrameworks: normalizeToTraceableConcept(personaTransferOutput.frameworks),
            personaTheories: normalizeToTraceableConcept(personaTransferOutput.theories),
        };
        processingLog.push('Concept set normalized to TraceableConcepts.');

        // --- BEGIN PHASE 26.A Fusion Policy Application ---
        // Transform normalizedConceptSet (TransferKernelConceptSet) to ExtractedConcepts for FusionPolicyEngine
        const conceptsForFusionPolicy: ExtractedConcepts = {
            principles: normalizedConceptSet.personaPrinciples,
            methods: normalizedConceptSet.personaMethods,
            frameworks: normalizedConceptSet.personaFrameworks,
            theories: normalizedConceptSet.personaTheories,
        };
        const policyAdjustedConceptSet: ExtractedConcepts = FusionPolicyEngine.applyPolicy(conceptsForFusionPolicy);
        processingLog.push(`Fusion policy (value normalization) applied. Principles: ${conceptsForFusionPolicy.principles?.length || 0} -> ${policyAdjustedConceptSet.principles?.length || 0}`);
        processingLog.push(`Fusion policy (value normalization) applied to Methods: ${conceptsForFusionPolicy.methods?.length || 0} -> ${policyAdjustedConceptSet.methods?.length || 0}`);
        processingLog.push(`Fusion policy (value normalization) applied to Frameworks: ${conceptsForFusionPolicy.frameworks?.length || 0} -> ${policyAdjustedConceptSet.frameworks?.length || 0}`);
        processingLog.push(`Fusion policy (value normalization) applied to Theories: ${conceptsForFusionPolicy.theories?.length || 0} -> ${policyAdjustedConceptSet.theories?.length || 0}`);
        // --- END PHASE 26.A Fusion Policy Application ---

        // --- BEGIN PHASE 26.B Semantic Equivalence Collapse ---
        // policyAdjustedConceptSet is already ExtractedConcepts, so it can be used directly
        const deduplicatedConceptSet: ExtractedConcepts = FusionPolicyEngine.collapseSemanticEquivalents(policyAdjustedConceptSet);
        const principlesReduced = (policyAdjustedConceptSet.principles?.length || 0) - (deduplicatedConceptSet.principles?.length || 0);
        const methodsReduced = (policyAdjustedConceptSet.methods?.length || 0) - (deduplicatedConceptSet.methods?.length || 0);
        const frameworksReduced = (policyAdjustedConceptSet.frameworks?.length || 0) - (deduplicatedConceptSet.frameworks?.length || 0);
        const theoriesReduced = (policyAdjustedConceptSet.theories?.length || 0) - (deduplicatedConceptSet.theories?.length || 0);
        processingLog.push(`Fusion Policy: Semantic equivalence collapse applied. ${principlesReduced} principle duplicates, ${methodsReduced} method duplicates, ${frameworksReduced} framework duplicates, ${theoriesReduced} theory duplicates eliminated.`);
        // --- END PHASE 26.B Semantic Equivalence Collapse ---

        // --- BEGIN PHASE 26.D & 26.E: Persona-Specific Weighting & Activation ---
        // Construct weightedConceptSet using weighSpecificConcepts for each category
        const weightedConceptSet: WeightedConceptSet = {
            principles: WeightMatrixEngine.weighSpecificConcepts(deduplicatedConceptSet.principles, persona, 'principles'),
            methods: WeightMatrixEngine.weighSpecificConcepts(deduplicatedConceptSet.methods, persona, 'methods'),
            frameworks: WeightMatrixEngine.weighSpecificConcepts(deduplicatedConceptSet.frameworks, persona, 'frameworks'),
            theories: WeightMatrixEngine.weighSpecificConcepts(deduplicatedConceptSet.theories, persona, 'theories'),
        };
        processingLog.push('Persona-specific weighting matrix applied to concept set.');
        // --- END PHASE 26.D & 26.E ---

        // --- BEGIN PHASE 25.B Reasoning Density Score Calculation (NOW WEIGHTED) ---
        let calculatedDensityScore: number;

        const sumWeightedScores = (concepts: WeightedTraceableConcept[] | undefined): number => {
            if (!concepts || concepts.length === 0) return 0;
            return concepts.reduce((sum, concept) => sum + (concept.weightedScore || 0), 0);
        };

        const weightedPrinciplesSum = sumWeightedScores(weightedConceptSet.principles);
        const weightedMethodsSum = sumWeightedScores(weightedConceptSet.methods);
        // Accessing flat keys from deduplicatedConceptSet (ExtractedConcepts)
        const numFrameworksRaw = deduplicatedConceptSet.frameworks?.length || 0;
        const numTheoriesRaw = deduplicatedConceptSet.theories?.length || 0;

        if (weightedPrinciplesSum === 0 || weightedMethodsSum === 0) {
            // Accessing flat keys from deduplicatedConceptSet (ExtractedConcepts)
            const rawPrinciplesCount = deduplicatedConceptSet.principles?.length || 0;
            const rawMethodsCount = deduplicatedConceptSet.methods?.length || 0;
            if (rawPrinciplesCount === 0 || rawMethodsCount === 0) {
                calculatedDensityScore = 1.0;
                processingLog.push('[Warning] Weighted sums for principles or methods are zero. Fallback to raw counts for density: extreme sparsity detected (raw).');
            } else {
                calculatedDensityScore = 1 / (rawPrinciplesCount * rawMethodsCount);
                processingLog.push(`[Warning] Weighted sums for principles or methods are zero. Fallback to raw counts for density score: ${calculatedDensityScore.toFixed(4)} (Raw P: ${rawPrinciplesCount}, Raw M: ${rawMethodsCount})`);
            }
        } else {
            calculatedDensityScore = 1 / (weightedPrinciplesSum * weightedMethodsSum);
        }
        calculatedDensityScore = Math.max(0, Math.min(1, calculatedDensityScore));

        processingLog.push(`Phase 26.E: Weighted reasoning density score calculated: ${calculatedDensityScore.toFixed(4)} (Weighted Principles Sum: ${weightedPrinciplesSum.toFixed(2)}, Weighted Methods Sum: ${weightedMethodsSum.toFixed(2)})`);
        // --- END PHASE 25.B Reasoning Density Score Calculation ---

        // --- BEGIN PHASE 25.C Reasoning Density Threshold Filtering ---
        let densityThresholdValue = 0.1;
        if (persona === "creator") densityThresholdValue = 0.05 + (calculatedDensityScore * 0.15);
        else if (persona === "educator") densityThresholdValue = 0.1 + (calculatedDensityScore * 0.25);
        else if (persona === "researcher") densityThresholdValue = 0.15 + (calculatedDensityScore * 0.35);
        densityThresholdValue = Math.max(0.01, Math.min(0.5, densityThresholdValue));

        const densityProfile: DensityProfile = {
            score: calculatedDensityScore,
            threshold: densityThresholdValue,
            weightedPrincipleSum: weightedPrinciplesSum,
            weightedMethodSum: weightedMethodsSum,
            frameworksCount: numFrameworksRaw,
            theoriesCount: numTheoriesRaw,
        };
        // Make densityScore available for downstream use by assigning it from the profile
        const densityScore = densityProfile.score; // This ensures densityProfile is used

        processingLog.push(`Reasoning Density Profile (Weighted P/M): Score: ${densityScore.toFixed(3)}, Threshold: ${densityProfile.threshold.toFixed(3)} (P Sum:${densityProfile.weightedPrincipleSum.toFixed(2)}, M Sum:${densityProfile.weightedMethodSum.toFixed(2)}, F Cnt:${densityProfile.frameworksCount}, T Cnt:${densityProfile.theoriesCount})`);
        // --- END PHASE 25.B/C Reasoning Density Score & Threshold Calculation ---

        // --- BEGIN PHASE 23.C Multi-Hop Composer Integration ---
        processingLog.push('Preparing input for Multi-Hop Reasoning Composer...');
        const composerInput: MultiHopComposerInput = {
            conceptSet: deduplicatedConceptSet, // Uses non-weighted, deduplicated set
            persona: persona,
            domain: promptCompilerDomainKey,
        };
        console.log("--- Multi-Hop Reasoning Composer Input ---", composerInput);

        const multiHopOutput: MultiHopComposerOutput = MultiHopComposerEngine.compose(composerInput);
        processingLog.push('Multi-Hop Reasoning Composer executed.');
        console.log("--- Multi-Hop Reasoning Output ---", multiHopOutput);
        // --- END PHASE 23.C Multi-Hop Composer Integration ---

        // --- BEGIN PHASE 23.D Reasoning Composition Fusion Layer ---
        // This section will need careful review if multi-hop outputs are to be weighted
        // For now, assume multi-hop mappings are strings and their scores are from multiHopOutput.scoreMap
        // And the DensityBasedFiltering (if it existed or its logic is here) would use densityProfile.score & densityProfile.threshold

        // Placeholder for where DensityBasedFiltering logic would be or is integrated
        // Assuming multiHopOutput.composedMappings is string[]
        // And the DensityBasedFiltering (if it existed or its logic is here) would use densityProfile.score and densityProfile.threshold

        // const scoreMap = multiHopOutput.scoreMap || new Map<string, number>(); // Replaced
        const scoreMap = new Map<string, number>();
        (multiHopOutput.composedMappings || []).forEach(mapping => {
            // Using densityScore as a placeholder, as per instruction for later refinement in Phase 27A/27B
            // In a real scenario, this score would come from the multi-hop reasoning process itself.
            // For now, if all mappings are to receive the same global density score as their temporary score:
            scoreMap.set(mapping, densityScore);
            // If the intent was to use the mapping's *own* score if it existed on multiHopOutput, that needs to be clarified.
            // Given the error `Property 'scoreMap' does not exist on type 'MultiHopComposerOutput'`,
            // we assume individual scores are not yet available on multiHopOutput.
        });

        // SIMULATING DensityBasedFiltering.filterMappings output structure for this example
        // In a real scenario, this filtering would use densityProfile.score and densityProfile.threshold
        const filteredMappingsStrings: string[] = multiHopOutput.composedMappings.filter(mapping => {
            const mappingScore = scoreMap.get(mapping) ?? 0;
            // Example filtering logic: consider if mappingScore > densityProfile.threshold
            // and if it's not already an existing principle. This is a simplified placeholder.
            // Accessing flat .principles from deduplicatedConceptSet (ExtractedConcepts)
            return mappingScore > densityProfile.threshold && !deduplicatedConceptSet.principles.map((p: TraceableConcept) => p.value).includes(mapping);
        });
        processingLog.push(`Multi-hop mappings filtered (simulated). Initial: ${multiHopOutput.composedMappings.length}, Filtered: ${filteredMappingsStrings.length} (Threshold: ${densityProfile.threshold.toFixed(3)})`);

        let conceptsForCompilerInput: WeightedConceptSet;

        if (filteredMappingsStrings && filteredMappingsStrings.length > 0) {
            const newTraceableConcepts = filteredMappingsStrings.map(value => ({
                value,
                source: "multi-hop-composer",
                score: scoreMap.get(value) ?? 1.0
            } as TraceableConcept));

            const weightedMultiHopPrinciples: WeightedTraceableConcept[] = WeightMatrixEngine.weighSpecificConcepts(
                newTraceableConcepts,
                persona,
                'principles' // Corrected: use 'principles' (keyof ExtractedConcepts)
            );
            processingLog.push(`Weighted ${weightedMultiHopPrinciples.length} new concepts from multi-hop reasoning for persona ${persona}.`);

            // Constructing conceptsForCompilerInput (WeightedConceptSet) using flat keys
            conceptsForCompilerInput = {
                principles: [
                    ...(weightedConceptSet.principles || []), // Access flat .principles
                    ...weightedMultiHopPrinciples
                ],
                methods: weightedConceptSet.methods || [], // Access flat .methods
                frameworks: weightedConceptSet.frameworks || [], // Access flat .frameworks
                theories: weightedConceptSet.theories || [], // Access flat .theories
            };
            processingLog.push(`Fusion complete: ${weightedMultiHopPrinciples.length} weighted multi-hop concepts injected into personaPrinciples.`);
        } else {
            conceptsForCompilerInput = weightedConceptSet;
            processingLog.push('No multi-hop mappings passed filtering or none were generated; using weighted & deduplicated concepts for prompt compilation.');
        }
        console.log("--- Fused Weighted Concept Set for Compiler Input ---", conceptsForCompilerInput);
        // --- END PHASE 23.D Reasoning Composition Fusion Layer ---

        // --- BEGIN PREPARE FOR PROMPT COMPILER ---
        const transformToTraceableConcept = (concepts: WeightedTraceableConcept[] | undefined): TraceableConcept[] => {
            if (!concepts) return [];
            return concepts.map(wc => ({
                value: wc.value,
                source: wc.source,
                score: wc.weightedScore, // Key change: use weightedScore as the final score for the prompt
                // originalScore: wc.originalScore, // Could be included if needed for deeper tracing
                // weight: wc.weight, // Could be included
                // weightProfile: wc.weightProfile // Could be included
            }));
        };

        const conceptsForPromptCompiler: TransferKernelConceptSet = {
            personaPrinciples: transformToTraceableConcept(conceptsForCompilerInput.principles),
            personaMethods: transformToTraceableConcept(conceptsForCompilerInput.methods),
            personaFrameworks: transformToTraceableConcept(conceptsForCompilerInput.frameworks),
            personaTheories: transformToTraceableConcept(conceptsForCompilerInput.theories),
        };
        processingLog.push('Weighted concepts transformed for prompt compiler input, with weightedScore as final score.');
        console.log("--- Final Concept Set for Prompt Compiler (scores are weighted) ---", conceptsForPromptCompiler);
        // --- END PREPARE FOR PROMPT COMPILER ---

        const promptCompilerInput: PromptCompilerInput = {
            persona: persona,
            domain: promptCompilerDomainKey,
            conceptSet: conceptsForPromptCompiler,
            personaProfile: personaProfile,
        };

        const compiledPromptOutput: CompiledPromptOutput = PromptCompilerEngine.compile(promptCompilerInput);
        processingLog.push('System prompt compilation complete.');
        console.log("--- ADAPTIVE SYSTEM PROMPT ---");
        console.log(compiledPromptOutput.fullSystemPrompt);

        const verificationResult: VerificationResult = VerificationAgentEngine.verify({
            systemPrompt: compiledPromptOutput.fullSystemPrompt,
            persona,
            domain: promptCompilerDomainKey
        });
        processingLog.push(`Verification Agent executed. Overall status: ${verificationResult.passed ? 'Passed' : 'Failed'}. Issues: ${verificationResult.issues.join('; ') || 'None'}`);

        // Cognitive Orchestration Layer (Phase 15)
        // Map TransferKernelConceptSet back to ExtractedConcepts for the cognitive layer
        const conceptsForCognitiveLayer: ExtractedConcepts = {
            principles: conceptsForPromptCompiler.personaPrinciples.map(tc => ({ value: tc.value, source: tc.source, score: tc.score })),
            methods: conceptsForPromptCompiler.personaMethods.map(tc => ({ value: tc.value, source: tc.source, score: tc.score })),
            frameworks: conceptsForPromptCompiler.personaFrameworks.map(tc => ({ value: tc.value, source: tc.source, score: tc.score })),
            theories: conceptsForPromptCompiler.personaTheories.map(tc => ({ value: tc.value, source: tc.source, score: tc.score })),
        };
        const cognitiveOutput: CognitiveOrchestrationOutput = OrchestrationController.runCognitiveOrchestration(conceptsForCognitiveLayer, persona);
        processingLog.push('Phase 15 Cognitive Layer Orchestration complete.');

        // Ensure the finalConcepts in the extractionResult reflect the concepts used for prompt compilation and cognitive layer
        const updatedExtractionResult: GlobalExtractionResult = {
            ...extractionResultWithCorrection,
            finalConcepts: conceptsForCognitiveLayer,
        };

        // Final Result Assembly
        const finalResult: CognitiveKernelResult = {
            documentId: "temp-doc-id-" + Date.now(), // Example document ID
            overallMetrics: { totalInputTokens: 0, totalOutputTokens: 0, totalProcessingTimeMs: 0, cost: 0 }, // Placeholder metrics
            extractionResult: updatedExtractionResult, // Use the updated one
            cognitiveOutput: cognitiveOutput,
            promptTraceMap: compiledPromptOutput.traceMap as PromptTraceMap, // Cast as it matches the structure
            personaTransferOutput: personaTransferOutput,
            reasoningDensityProfile: densityProfile,
            multiHopReasoning: {
                rawOutput: multiHopOutput,
                filteredMappings: filteredMappingsStrings.map(value => ({ value, source: "multi-hop-composer", score: scoreMap.get(value) ?? 0.0 } as TraceableConcept)),
                appliedThreshold: densityProfile.threshold,
            } as KernelMultiHopReasoning,
            promptCompilerInputSnapshot: promptCompilerInput, // Corrected key name
            verificationAgentResult: verificationResult,
            processingLog: processingLog,
            compiledSystemPrompt: compiledPromptOutput.fullSystemPrompt,
        };

        console.log("[ExtractionOrchestrator] Orchestration Complete. Returning CognitiveKernelResult.");
        return finalResult;
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