import type { ExtractedConcepts } from '../../../types';
import type { AmbiguityScore } from './AmbiguityDetectorAgent';
import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema';
import type { DependencyInsight } from './DependencyModel';
import type { FieldConfidence } from './ConfidenceFusionEngine';
// import { ExtractionQAAgent } from '../extraction/ExtractionQAAgent'; // Consider if direct QA is needed here or in SelfCorrectionLoop

// Placeholder for LLM interaction client if needed directly
// import { OpenAIAdapter } from '../adapters/OpenAIAdapter';

export interface ReinforcementInputV2 {
    originalConcepts: ExtractedConcepts;
    ambiguityScores: AmbiguityScore[];
    dependencyInsights: Partial<Record<DomainField, DependencyInsight[]>>;
    fieldConfidences: FieldConfidence[];
    fullDocumentText: string;
    // Configuration for the agent, e.g., LLM model, max recovery attempts per field
    config?: {
        maxKeywordRecoveryAttempts?: number;
        minConfidenceForAction?: number; // Fields below this confidence might trigger reinforcement
    };
}

export interface RecoveryAttemptDetail {
    field: DomainField;
    strategyUsed: 'keyword_search' | 'dependency_cue' | 'llm_prompt' | 'none';
    queryOrPrompt?: string; // e.g., keywords searched, prompt sent to LLM
    outcome: 'success_improved' | 'success_no_change' | 'failed_no_match' | 'failed_error' | 'skipped';
    originalValue?: string | string[];
    newValue?: string | string[];
    details?: string; // Additional notes on the attempt
}

export interface ReinforcementOutputV2 {
    refinedConcepts: ExtractedConcepts;
    refinementSummary: string;
    recoveryAttempts: RecoveryAttemptDetail[];
    // newOverallConfidence?: number; // Could be recalculated or estimated
    // newFieldConfidences?: FieldConfidence[];
    needsFurtherReview: boolean; // Flag if issues persist or confidence is critically low
}

const DEFAULT_MIN_CONFIDENCE_FOR_ACTION = 0.6;

export class ReinforcementAgentV2 {
    public static async refineConcepts(input: ReinforcementInputV2): Promise<ReinforcementOutputV2> {
        const {
            originalConcepts,
            ambiguityScores,
            // dependencyInsights, // To be used more deeply later
            fieldConfidences,
            fullDocumentText,
            config
        } = input;

        const minConfidence = config?.minConfidenceForAction ?? DEFAULT_MIN_CONFIDENCE_FOR_ACTION;

        const refinedConcepts = JSON.parse(JSON.stringify(originalConcepts)) as ExtractedConcepts;
        const recoveryAttempts: RecoveryAttemptDetail[] = [];
        let refinementSummary = "Reinforcement Agent V2 processing started.\n";
        let needsFurtherReview = false;

        console.log("[ReinforcementAgentV2] Starting refinement process. Min confidence for action:", minConfidence);

        for (const fieldKey of DOMAIN_SCHEMA.fields as readonly DomainField[]) {
            const fieldSpecificConfidence = fieldConfidences.find(fc => fc.field === fieldKey);
            const fieldSpecificAmbiguities = ambiguityScores.filter(as => as.field === fieldKey);

            const valueBeforeThisAttempt = originalConcepts[fieldKey]; // Use original for logging

            if (fieldSpecificConfidence && fieldSpecificConfidence.score < minConfidence || fieldSpecificAmbiguities.length > 0) {
                refinementSummary += `Targeting field '${fieldKey}' due to low confidence (${fieldSpecificConfidence?.score.toFixed(2)}) or ambiguities (${fieldSpecificAmbiguities.length}).\n`;

                const isEmptyArray = Array.isArray(valueBeforeThisAttempt) && valueBeforeThisAttempt.length === 0;
                const isEffectivelyEmpty = !valueBeforeThisAttempt || isEmptyArray;

                if (isEffectivelyEmpty && DOMAIN_SCHEMA.recoveryKeywords[fieldKey]) {
                    const keywordsToSearch = DOMAIN_SCHEMA.recoveryKeywords[fieldKey];
                    const keywordsFound: string[] = []; // Changed to const

                    for (const keyword of keywordsToSearch) {
                        if (fullDocumentText.toLowerCase().includes(keyword.toLowerCase())) {
                            keywordsFound.push(keyword);
                        }
                    }

                    const attemptDetails = `Searching for keywords: ${keywordsToSearch.join(', ')}`; // Changed to const

                    if (keywordsFound.length > 0) {
                        // For DomainFields (principles, methods, etc.), refinedConcepts[fieldKey] must be string[]
                        (refinedConcepts[fieldKey] as string[]) = keywordsFound;
                        refinementSummary += `  [Keyword Recovery] Found and applied keywords for '${fieldKey}': ${keywordsFound.join(', ')}.\n`;
                        recoveryAttempts.push({
                            field: fieldKey,
                            strategyUsed: 'keyword_search',
                            queryOrPrompt: keywordsToSearch.join(', '),
                            outcome: 'success_improved',
                            originalValue: valueBeforeThisAttempt, // This is string[] for DomainFields
                            newValue: keywordsFound, // This is string[]
                            details: `Found: ${keywordsFound.join(', ')}`
                        });
                    } else {
                        refinementSummary += `  [Keyword Recovery] No specified keywords found for '${fieldKey}'.\n`;
                        recoveryAttempts.push({
                            field: fieldKey,
                            strategyUsed: 'keyword_search',
                            queryOrPrompt: keywordsToSearch.join(', '),
                            outcome: 'failed_no_match',
                            originalValue: valueBeforeThisAttempt,
                            details: attemptDetails
                        });
                    }
                } else {
                    refinementSummary += `  [Keyword Recovery] Skipped for '${fieldKey}' as it was not effectively empty or no keywords defined.\n`;
                }

                // Strategy 2: Dependency-Guided Refinement (Placeholder)
                // if (dependencyInsights && dependencyInsights[fieldKey]) {
                //     refinementSummary += `  [Dependency Cue] Field '${fieldKey}' has dependencies. Logic to use them is pending.\n`;
                //     // recoveryAttempts.push(...);
                // }

                // Strategy 3: LLM-based Refinement for remaining ambiguities (Placeholder)
                // if (fieldSpecificAmbiguities.length > 0) {
                //     refinementSummary += `  [LLM Prompt] Field '${fieldKey}' has ambiguities. LLM refinement logic pending.\n`;
                //     // recoveryAttempts.push(...);
                //     needsFurtherReview = true; // LLM use might still need review
                // }

            } else {
                recoveryAttempts.push({
                    field: fieldKey, strategyUsed: 'none', outcome: 'skipped', details: `Confidence ${fieldSpecificConfidence?.score.toFixed(2)} met threshold. Original value retained.`,
                    originalValue: valueBeforeThisAttempt,
                    newValue: valueBeforeThisAttempt // Value remains unchanged
                });
            }
        }

        if (!recoveryAttempts.some(att => att.outcome === 'success_improved')) {
            refinementSummary += "No improvements made by reinforcement strategies.\n";
        } else {
            needsFurtherReview = true;
        }

        console.log("[ReinforcementAgentV2] Refinement process completed.", { refinedConcepts, recoveryAttempts });
        refinementSummary += "Reinforcement Agent V2 processing finished.";

        return {
            refinedConcepts,
            refinementSummary,
            recoveryAttempts,
            needsFurtherReview
        };
    }
}

// Example Usage (for testing - remove or comment out for production)
/*
async function testReinforcementV2() {
    const exampleInput: ReinforcementInputV2 = {
        originalConcepts: {
            principles: [], 
            methods: ["Some method with ambiguity"],
            frameworks: ["Existing Framework"],
            theories: [],
            notes: "Test note"
        },
        ambiguityScores: [
            { field: "methods", term: "Some method with ambiguity", score: 0.8, suggestion: "Clarify X" }
        ],
        dependencyInsights: {
            principles: [{ field: "methods", strength: 2 }],
            methods: [{ field: "principles", strength: 2 }]
        },
        fieldConfidences: [
            { field: "principles", score: 0.2, contributingSignals: [] },
            { field: "methods", score: 0.4, contributingSignals: [] },
            { field: "frameworks", score: 0.9, contributingSignals: [] },
            { field: "theories", score: 0.3, contributingSignals: [] },
        ],
        fullDocumentText: "The document discusses adaptation and various methods including agent-based modeling. It also mentions complexity theory.",
        config: {
            minConfidenceForAction: 0.5
        }
    };

    console.log("--- Testing ReinforcementAgentV2 ---");
    const result = await ReinforcementAgentV2.refineConcepts(exampleInput);
    console.dir(result, { depth: null });

    const exampleInput2: ReinforcementInputV2 = {
        originalConcepts: {
            principles: ["Old Principle"],
            methods: [],
            frameworks: [],
            theories: []
        },
        ambiguityScores: [],
        dependencyInsights: {},
        fieldConfidences: [
            { field: "principles", score: 0.9, contributingSignals: [] }, // High confidence, no action
            { field: "methods", score: 0.1, contributingSignals: [] },    // Low confidence, empty, keyword recovery target
            { field: "frameworks", score: 0.9, contributingSignals: [] },
            { field: "theories", score: 0.9, contributingSignals: [] },
        ],
        fullDocumentText: "This text mentions agent-based modeling and complexity theory."
    };
    const result2 = await ReinforcementAgentV2.refineConcepts(exampleInput2);
    console.log("--- Testing ReinforcementAgentV2 (Example 2) ---");
    console.dir(result2, { depth: null });
}
// testReinforcementV2();
*/ 