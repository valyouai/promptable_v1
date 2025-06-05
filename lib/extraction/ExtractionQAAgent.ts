import type { ExtractedConcepts, QAValidationResult } from '@/types';
// import openaiClient from '@/lib/openai'; // For future LLM-based QA

const MIN_CONCEPT_LENGTH = 3; // Example minimum length for a concept string
const MAX_CONCEPT_LENGTH = 250; // Example maximum length
const MAX_CONCEPTS_PER_CATEGORY = 20; // Example maximum number of concepts in one category

export class ExtractionQAAgent {
    static async validate(
        documentText: string, // documentText might be used for future LLM-based QA
        concepts: ExtractedConcepts
    ): Promise<QAValidationResult> {
        const issues: string[] = [];
        let isValid = true;
        let confidenceScore = 1.0; // Start with full confidence

        // Ensure all basic categories are present (even if empty arrays)
        if (concepts.principles === undefined) {
            issues.push('Missing "principles" category in extracted concepts.');
            concepts.principles = []; // Ensure category exists for consistent structure
            isValid = false;
            confidenceScore -= 0.2;
        }
        if (concepts.methods === undefined) {
            issues.push('Missing "methods" category in extracted concepts.');
            concepts.methods = [];
            isValid = false;
            confidenceScore -= 0.2;
        }
        if (concepts.frameworks === undefined) {
            issues.push('Missing "frameworks" category in extracted concepts.');
            concepts.frameworks = [];
            isValid = false;
            confidenceScore -= 0.2;
        }
        if (concepts.theories === undefined) {
            issues.push('Missing "theories" category in extracted concepts.');
            concepts.theories = [];
            isValid = false;
            confidenceScore -= 0.2;
        }

        const allConcepts = [
            ...(concepts.principles || []),
            ...(concepts.methods || []),
            ...(concepts.frameworks || []),
            ...(concepts.theories || []),
        ];

        if (allConcepts.length === 0 && (concepts.principles?.length === 0 && concepts.methods?.length === 0 && concepts.frameworks?.length === 0 && concepts.theories?.length === 0)) {
            issues.push('QA Warning: No concepts were extracted from the document.');
            // This might not necessarily make isValid = false, depending on requirements
            // For now, consider it a warning that lowers confidence.
            confidenceScore -= 0.3;
        }

        for (const categoryName in concepts) {
            const categoryConcepts = concepts[categoryName as keyof ExtractedConcepts];
            if (Array.isArray(categoryConcepts)) {
                if (categoryConcepts.length > MAX_CONCEPTS_PER_CATEGORY) {
                    issues.push(`QA Issue: Category "${categoryName}" has ${categoryConcepts.length} concepts, exceeding the maximum of ${MAX_CONCEPTS_PER_CATEGORY}.`);
                    isValid = false;
                    confidenceScore -= 0.15;
                }
                for (const concept of categoryConcepts) {
                    if (typeof concept !== 'string') {
                        issues.push(`QA Issue: Invalid non-string concept found in "${categoryName}".`);
                        isValid = false;
                        confidenceScore -= 0.1;
                        continue;
                    }
                    if (concept.length < MIN_CONCEPT_LENGTH) {
                        issues.push(`QA Warning: Concept "${concept.substring(0, 30)}..." in "${categoryName}" is very short (length ${concept.length}).`);
                        // This could be a minor issue, might not set isValid to false but lowers confidence
                        confidenceScore -= 0.05;
                    }
                    if (concept.length > MAX_CONCEPT_LENGTH) {
                        issues.push(`QA Warning: Concept "${concept.substring(0, 30)}..." in "${categoryName}" is very long (length ${concept.length}).`);
                        confidenceScore -= 0.05;
                    }
                    // Check for placeholder-like or repetitive content (basic check)
                    if (/^(placeholder|example|test|mock|dummy)/i.test(concept) || concept === documentText.substring(0, concept.length)) {
                        issues.push(`QA Warning: Concept "${concept.substring(0, 30)}..." in "${categoryName}" seems like a placeholder or directly copied snippet.`);
                        confidenceScore -= 0.1;
                    }
                }
            }
        }

        // --- Placeholder for Future LLM-based QA ---
        // const useLLMQA = false; // Set to true to enable
        // if (useLLMQA && documentText && openaiClient) {
        //   try {
        //     const qaPrompt = `Given the original document text and the extracted concepts, please evaluate the quality of the extraction.
        //     Original Text (first 500 chars): "${documentText.substring(0, 500)}..."
        //     Extracted Concepts: ${JSON.stringify(concepts, null, 2)}
        //     Are these concepts relevant, accurate, and comprehensive? Identify any specific issues or hallucinations.
        //     Provide your assessment as a brief text. If major issues, start with "CRITICAL:". If minor, "WARNING:". If good, "OK:".`;
        //
        //     const qaResponse = await openaiClient.chat.completions.create({
        //       model: 'gpt-3.5-turbo', // Or a more capable model like gpt-4 for QA
        //       messages: [
        //         { role: 'system', content: 'You are a QA agent evaluating concept extraction.' },
        //         { role: 'user', content: qaPrompt }
        //       ],
        //       temperature: 0.3,
        //       max_tokens: 150
        //     });
        //     const qaFeedback = qaResponse.choices[0]?.message?.content?.trim();
        //     if (qaFeedback) {
        //       issues.push(`LLM QA Feedback: ${qaFeedback}`);
        //       if (qaFeedback.startsWith('CRITICAL:')) {
        //         isValid = false;
        //         confidenceScore -= 0.5;
        //       } else if (qaFeedback.startsWith('WARNING:')) {
        //         confidenceScore -= 0.2;
        //       }
        //     }
        //   } catch (llmQaError) {
        //     console.error('[QA] Error during LLM-based QA:', llmQaError);
        //     issues.push('LLM-based QA step failed to execute.');
        //     confidenceScore -= 0.1; // Penalize confidence if QA step itself fails
        //   }
        // }
        // --- End Placeholder ---

        return {
            isValid,
            issues,
            validatedConcepts: concepts, // For now, return original concepts
            confidenceScore: Math.max(0, Math.min(1, confidenceScore)), // Clamp between 0 and 1
        };
    }
} 