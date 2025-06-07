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
    ambiguityScores?: { field: string; score: number; reasoning: string }[]; // More specific than AmbiguityScore[] from orchestrator
    overallConfidence?: number;
    fieldConfidences?: {
        field: string;
        score: number;
        contributingSignals: { type: string; details: string; value: number }[];
    }[]; // More specific than FieldConfidence[] from orchestrator
    processingLog?: string[];
    reinforcementDetails?: {
        summary: string;
        attempts: {
            field: string;
            strategyUsed: string;
            outcome: string;
            details: string;
            originalValue: string[]; // Assuming string array based on user provided type
            newValue: string[];      // Assuming string array based on user provided type
        }[]; // More specific than RecoveryAttemptDetail[] from orchestrator
        needsFurtherReview: boolean;
    };
    // selfCorrectionDetails type was SelfCorrectionOutput in orchestrator, user provided 'unknown' here.
    // Using 'unknown' as per user's specific definition for global type for now.
    // If SelfCorrectionOutput is also meant to be global, it should be moved/imported.
    selfCorrectionDetails?: unknown;
    qaValidation?: QAValidationResult;
}
