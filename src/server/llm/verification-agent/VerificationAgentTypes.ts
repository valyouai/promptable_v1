export interface VerificationInput {
    systemPrompt: string;
    persona: string;
    domain: string;
}

export interface VerificationResult {
    passed: boolean;
    issues: string[];
    confidenceScore: number;
} 