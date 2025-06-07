export type ExtractedConcepts = {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
    notes?: string;

    // New fields targeted by MultiPassRefinementAgent
    'Research Objective'?: string;
    'Methods'?: string; // Capital 'M', singular string, distinct from lowercase 'methods' array
    'Dataset(s)'?: string;
    'Key Findings'?: string;
    'Limitations'?: string;
    'Future Work'?: string;
    'Applications'?: string;
} & Record<string, unknown>;

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

// Re-export CognitiveOrchestrationOutput from its definition in OrchestrationController
export type { CognitiveOrchestrationOutput } from '../src/server/llm/OrchestrationController';

// Phase 15: New composite type for combined Extraction and Cognitive Kernel output
// No need to re-import ExtractionResult as it is defined in this file.
// CognitiveOrchestrationOutput is available due to the re-export earlier in this file.
export interface CognitiveKernelResult {
    extractionResult: ExtractionResult;
    cognitiveOutput: CognitiveOrchestrationOutput;
}
