export interface ExtractedConcepts {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
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
