import type { ExtractedConcepts, QAValidationResult } from '@/types';
// import openaiClient from '@/lib/openai'; // For future LLM-based QA
// Import DomainSchema to validate field names
import { DOMAIN_SCHEMA } from '@/server/llm/DomainSchema';

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

        // Ensure all basic categories from DOMAIN_SCHEMA are present (even if empty arrays)
        for (const schemaField of DOMAIN_SCHEMA.fields) {
            if (concepts[schemaField] === undefined) {
                issues.push(`Missing "${schemaField}" category in extracted concepts (expected by schema).`);
                (concepts[schemaField] as string[]) = []; // Ensure category exists for consistent structure
                isValid = false;
                confidenceScore -= 0.1;
            }
        }

        const allConceptsArrays: string[] = DOMAIN_SCHEMA.fields.reduce((acc, field) => {
            const conceptArray = concepts[field as keyof ExtractedConcepts]; // This is TraceableConcept[]
            if (Array.isArray(conceptArray)) {
                // Map TraceableConcepts to their string values before pushing
                acc.push(...conceptArray.map(tc => tc.value));
            }
            return acc;
        }, [] as string[]);

        if (allConceptsArrays.length === 0) {
            issues.push('QA Warning: No concepts were extracted from the document across all schema fields.');
            confidenceScore -= 0.3;
        }

        for (const categoryName in concepts) {
            // Schema Anchoring: Check if the categoryName is a valid field as per DomainSchema
            if (!DOMAIN_SCHEMA.isValidField(categoryName)) {
                issues.push(`QA Issue: Unknown category "${categoryName}" found in extracted concepts. Not defined in DomainSchema.`);
                isValid = false;
                confidenceScore -= 0.15;
                continue; // Skip further processing for this unknown category
            }

            const categoryConcepts = concepts[categoryName as keyof ExtractedConcepts];

            // Process only array categories for length, content checks here.
            // 'notes' field if string, would skip this Array.isArray block.
            if (Array.isArray(categoryConcepts)) {
                if (categoryConcepts.length > MAX_CONCEPTS_PER_CATEGORY) {
                    issues.push(`QA Issue: Category "${categoryName}" has ${categoryConcepts.length} concepts, exceeding the maximum of ${MAX_CONCEPTS_PER_CATEGORY}.`);
                    isValid = false;
                    confidenceScore -= 0.15;
                }
                for (const concept of categoryConcepts) { // concept is a TraceableConcept
                    // Validate the structure of concept if necessary, but primary operations should be on concept.value
                    if (typeof concept.value !== 'string') { // Check concept.value type
                        issues.push(`QA Issue: Invalid or missing concept value in "${categoryName}". Concept: ${JSON.stringify(concept)}`);
                        isValid = false;
                        confidenceScore -= 0.1;
                        continue;
                    }
                    const conceptValue = concept.value; // Work with concept.value

                    if (conceptValue.length < MIN_CONCEPT_LENGTH) {
                        issues.push(`QA Warning: Concept "${conceptValue.substring(0, 30)}..." in "${categoryName}" is very short (length ${conceptValue.length}).`);
                        confidenceScore -= 0.05;
                    }
                    if (conceptValue.length > MAX_CONCEPT_LENGTH) {
                        issues.push(`QA Warning: Concept "${conceptValue.substring(0, 30)}..." in "${categoryName}" is very long (length ${conceptValue.length}).`);
                        confidenceScore -= 0.05;
                    }
                    // Check for placeholder-like or repetitive content (basic check)
                    if (/^(placeholder|example|test|mock|dummy)/i.test(conceptValue) || conceptValue === documentText.substring(0, conceptValue.length)) {
                        issues.push(`QA Warning: Concept "${conceptValue.substring(0, 30)}..." in "${categoryName}" seems like a placeholder or directly copied snippet.`);
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