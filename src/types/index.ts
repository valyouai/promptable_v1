import type { CognitiveOrchestrationOutput } from '@/server/llm/OrchestrationController';
import type { PersonaTransferOutput } from '@/server/llm/persona-transfer/PersonaTransferTypes';
import type { MultiHopComposerOutput } from '@/server/llm/reasoning-composer/MultiHopComposerTypes';
import type { PromptCompilerInput } from '@/server/llm/prompt-compiler/PromptCompilerTypes';
import type { VerificationResult } from '@/server/llm/verification-agent/VerificationAgentTypes';

// Define PersonaType first as it's a dependency for PersonaReinforcementProfile
export type PersonaType = 'creator' | 'researcher' | 'educator';
export const ALLOWED_PERSONAS: PersonaType[] = ['creator', 'researcher', 'educator'];

// Phase 24: Traceability Agent Blueprint
export interface TraceableConcept {
    value: string;
    source: string;  // e.g., page number, section header, or document ID segment
    score?: number;  // Scoring hook: confidence/relevance (optional for backward compatibility)
}

// Phase 21A: Define PersonaReinforcementProfile directly
export interface PersonaReinforcementProfile {
    persona: PersonaType;
    fieldWeights: Record<string, number>;
    ambiguityTolerance: number;
    maxCorrectionPasses: number;
    correctionAggressiveness: number;
    gapSensitivity: number;
    analogyDivergenceFactor: number;
    hypothesisExplorationFactor: number;
}

// MODIFIED for Phase 24: Traceability Agent Blueprint
export interface ExtractedConcepts {
    principles: TraceableConcept[];
    methods: TraceableConcept[];
    frameworks: TraceableConcept[];
    theories: TraceableConcept[];
}

export interface SystemPromptResult {
    success: boolean;
    systemPrompt: string;
    extractedConcepts: ExtractedConcepts;
    metadata: {
        documentTitle: string;
        persona: string;
        contentType: string;
        confidenceScore: number;
        timestamp: string;
    };
}

export interface QAValidationResult {
    isValid: boolean;
    issues: string[];
    validatedConcepts: ExtractedConcepts; // Concepts after QA (may be modified/annotated in future)
    confidenceScore?: number; // QA's confidence in the extraction quality (0.0 to 1.0)
}

// Added ExtractionResult interface definition as per user's Phase 11B Step 5
export interface ExtractionResult {
    documentId?: string; // Added to store the document identifier
    finalConcepts: ExtractedConcepts;
    ambiguityScores?: { field: keyof ExtractedConcepts; score: number; reasoning: string }[]; // More specific than AmbiguityScore[] from orchestrator
    overallConfidence?: number;
    fieldConfidences?: {
        field: keyof ExtractedConcepts | string; // Allow string for broader compatibility, or narrow to DomainField if enforced
        score: number;
        contributingSignals: { type: string; value: number; details: string }[];
    }[]; // More specific than FieldConfidence[] from orchestrator
    processingLog?: string[];
    reinforcementDetails?: {
        summary: string;
        attempts: {
            field: string; // keyof ExtractedConcepts or DomainField
            strategyUsed: string;
            queryOrPrompt?: string;
            outcome: string;
            originalValue?: string | string[];
            newValue?: string | string[];
            details: string;
        }[]; // More specific than RecoveryAttemptDetail[] from orchestrator
        needsFurtherReview: boolean;
    };
    selfCorrectionDetails?: {
        finalConcepts: ExtractedConcepts;
        passesRun: number;
        correctionLog: string[];
        passDetails: SelfCorrectionPassDetailForType[];
        finalOverallConfidence?: number;
        profileUsed?: PersonaReinforcementProfile;
    };
    qaValidation?: QAValidationResult;
    fusionLog?: FusionLogEntry[]; // Added fusionLog property
}

// Definition for a single entry in the fusion log
export interface FusionLogEntry {
    field: string; // Or use DomainField if it's defined/exported globally
    baseScore: number;
    ambiguityPenalty: number;
    dependencyBonus: number;
    reinforcementBonus: number;
    finalFieldScore: number;
}

// Define RecoveryAttemptLogEntry structure or import if possible and desired for strong typing
// For now, defining a structure compatible with OrchestrationAgent's mapping of RecoveryAttemptLogEntry
export interface SelfCorrectionRecoveryAttemptForType {
    field: string;
    strategyUsed: string;
    outcome: string;
    originalValue?: string[]; // Ensured it's string[]
    newValue?: string[]; // Ensured it's string[]
    details: string;
    // Removed queryOrPrompt, timestamp, triggerConfidence, confidenceBefore, confidenceAfter for simplicity in this type
    // if full RecoveryAttemptLogEntry is too complex for this specific output type.
    // OrchestrationAgent currently maps to this simpler structure.
}

export interface SelfCorrectionPassDetailForType {
    passNumber: number;
    recoveryLogThisPass?: SelfCorrectionRecoveryAttemptForType[];
    conceptsBeforePass?: ExtractedConcepts;
    conceptsAfterPass?: ExtractedConcepts;
    ambiguityScoresThisPass?: { field: keyof ExtractedConcepts | string; score: number; reasoning: string }[];
    confidenceResultThisPass?: {
        overallConfidence: number;
        fieldConfidences: {
            field: keyof ExtractedConcepts | string;
            score: number;
            contributingSignals?: {
                type: string; // Simplified for this type, can be made more specific if needed 
                details: string;
                value: number;
            }[];
        }[];
        fusionLog?: FusionLogEntry[]; // Use existing FusionLogEntry type
    };
    overallConfidenceAfterPass?: number;
}

// Phase 24: Added for Traceability Agent output
export interface PromptTraceMap {
    principles: TraceableConcept[];
    methods: TraceableConcept[];
    frameworks: TraceableConcept[];
    theories: TraceableConcept[];
}

// Define a Kernel-specific DensityProfile if it's part of the shared contract for CognitiveKernelResult
export interface KernelDensityProfile {
    score: number;
    threshold: number;
    weightedPrincipleSum: number; // Sum of weighted scores for principles
    weightedMethodSum: number;    // Sum of weighted scores for methods
    frameworksCount: number;      // Raw count for frameworks
    theoriesCount: number;        // Raw count for theories
}

export interface KernelMultiHopReasoning {
    rawOutput: MultiHopComposerOutput;
    filteredMappings: TraceableConcept[]; // Reporting TraceableConcepts after filtering
    appliedThreshold: number;
}

// Phase 15: New composite type for combined Extraction and Cognitive Kernel output
// MODIFIED for Phase 26.E to be more comprehensive
export interface CognitiveKernelResult {
    documentId?: string; // Optional document identifier
    overallMetrics?: {   // Optional performance/cost metrics
        totalInputTokens: number;
        totalOutputTokens: number;
        totalProcessingTimeMs: number;
        cost: number;
    };
    extractionResult: ExtractionResult;           // Result from the core extraction pipeline
    cognitiveOutput: CognitiveOrchestrationOutput; // Result from the Phase 15 cognitive layer
    promptTraceMap?: PromptTraceMap;              // Traceability map from the prompt compiler

    // New fields added for enhanced kernel output visibility (as of Phase 22+ evolution)
    personaTransferOutput?: PersonaTransferOutput;    // Output from the persona transfer stage
    reasoningDensityProfile?: KernelDensityProfile;   // Profile including weighted density scores
    multiHopReasoning?: KernelMultiHopReasoning;      // Details of multi-hop reasoning stage
    promptCompilerInputSnapshot?: PromptCompilerInput;// A snapshot of the input to the prompt compiler
    verificationAgentResult?: VerificationResult;   // Output from the verification agent
    processingLog?: string[];                       // Aggregated processing log
    compiledSystemPrompt?: string;                  // The final system prompt string sent to the LLM (if applicable post-compilation)
}

// Placeholder for GenerationConfig type, to be refined with SystemPromptGenerator component details
export interface GenerationConfig {
    [key: string]: unknown; // Allow arbitrary keys for now
}

// Added for Phase 17B UI Harmonization
export type { AbductiveHypothesisOutput, Hypothesis } from '@/server/llm/AbductiveHypothesisAgent';

// Added for Phase 18A UI Scaffolding
export type { GapDetectionOutput, IdentifiedGap, GapType } from '@/server/llm/GapDetectionAgent';

// Added for Phase 18B UI Scaffolding
export type { AnalogicalMappingOutput, AnalogicalMapping } from '@/server/llm/AnalogicalMappingAgent';

// Added for Phase 18D UI Scaffolding
export type { RelevanceFilteringOutput, FilteringLogEntry } from '@/server/llm/RelevanceFilteringAgent';

// Added for Phase 20 Self-Correction Kernel
export type { AmbiguityScore } from '@/server/llm/AmbiguityDetectorAgent';

// export type { CognitiveStage, CognitiveOperation, CognitiveStep, CognitiveStepInput, CognitiveStepOutput, CognitiveStepStatus, CognitiveStepError, CognitiveStepLog, CognitiveStepMetadata, CognitiveStepTimings, CognitiveStepCost } from './CognitiveTypes'; // Phase 15 types - Removed due to incorrect path/error
export type { TransferKernelConceptSet } from '../server/llm/prompt-generator/PromptGeneratorTypes'; // Added for UI viewer

// --- KERNEL PHASE 26.D & 26.E --- 

export interface ExtractionRequest {
    documentText: string;
    persona: PersonaType;
}

export interface SystemPromptResult {
    success: boolean;
    systemPrompt: string;
    extractedConcepts: ExtractedConcepts;
    metadata: {
        documentTitle: string;
        persona: string;
        contentType: string;
        confidenceScore: number;
        timestamp: string;
    };
}
