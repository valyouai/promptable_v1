import type { CognitiveOrchestrationOutput } from '@/server/llm/OrchestrationController';

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

// Phase 15: New composite type for combined Extraction and Cognitive Kernel output
// No need to re-import ExtractionResult as it is defined in this file.
// CognitiveOrchestrationOutput is available due to the re-export earlier in this file.
export interface CognitiveKernelResult {
    extractionResult: ExtractionResult;
    cognitiveOutput: CognitiveOrchestrationOutput;
    promptTraceMap?: PromptTraceMap;
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
