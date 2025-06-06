import type { ExtractedConcepts } from '@/types';
import { StorageDriver } from '@/lib/extraction/StorageDriver';
import { ExtractionEngine } from '@/server/extraction/ExtractionEngine';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';

export class ExtractionKernel {
    static async handle(documentId: string): Promise<ExtractedConcepts> {
        console.log(`[KERNEL] Starting extraction process for documentId: ${documentId}`);
        const documentText = await StorageDriver.fetchDocument(documentId);
        const extractedConcepts = await ExtractionEngine.extract(documentText);

        // Perform QA validation
        console.log(`[KERNEL] Performing QA validation for documentId: ${documentId}`);
        const qaResult = await ExtractionQAAgent.validate(documentText, extractedConcepts);

        if (!qaResult.isValid) {
            console.warn(`[KERNEL] QA: Validation FAILED for documentId: ${documentId}. Confidence: ${qaResult.confidenceScore}. Issues:`, qaResult.issues);
            // In a more advanced implementation, you might decide to:
            // - Throw an error
            // - Attempt re-extraction with different parameters
            // - Return a specific error structure
        } else {
            console.log(`[KERNEL] QA: Validation PASSED for documentId: ${documentId}. Confidence: ${qaResult.confidenceScore}`);
        }
        if (qaResult.issues.length > 0 && qaResult.isValid) { // Log warnings even if overall valid
            console.log(`[KERNEL] QA: Warnings present for documentId: ${documentId}:`, qaResult.issues);
        }

        console.log(`[KERNEL] Completed extraction process for documentId: ${documentId}. Returning concepts.`);
        // For now, we return the concepts from the QA agent,
        // which currently are the same as the originally extracted ones.
        // Later, the QA agent might modify/enhance them.
        return qaResult.validatedConcepts;
    }
} 