import type { ExtractedConcepts } from '@/types';
import { StorageDriver } from '@/lib/extraction/StorageDriver';
import { ExtractionEngine } from '@/server/extraction/ExtractionEngine';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import { SemanticChunker, Chunk } from '@/lib/chunking/SemanticChunker';
import { ConceptAggregator } from '@/server/extraction/ConceptAggregator';
import { config } from '@/lib/config';

export class ExtractionKernel {
    static async handle(documentId: string): Promise<ExtractedConcepts> {
        console.log(`[KERNEL] Starting extraction process for documentId: ${documentId}`);
        const documentText = await StorageDriver.fetchDocument(documentId);

        const modelName = config.openai.modelName;

        console.log(`[KERNEL] Chunking documentId: ${documentId} using model: ${modelName} for token counting.`);
        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText, modelName);
        console.log(`[KERNEL] Document split into ${chunks.length} chunks for documentId: ${documentId}`);

        const allChunkConcepts: ExtractedConcepts[] = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`[KERNEL] Extracting concepts from chunk ${i + 1}/${chunks.length} (tokens: ${chunk.tokenCount}) for documentId: ${documentId}`);
            try {
                const chunkConcepts = await ExtractionEngine.extract(chunk.text);
                allChunkConcepts.push(chunkConcepts);
                console.log(`[KERNEL] Successfully extracted concepts from chunk ${i + 1} for documentId: ${documentId}`);
            } catch (error) {
                console.error(`[KERNEL] Error extracting concepts from chunk ${i + 1} for documentId: ${documentId}`, error);
                allChunkConcepts.push({ principles: [], methods: [], frameworks: [], theories: [] });
            }
        }

        console.log(`[KERNEL] Aggregating and de-duplicating concepts for documentId: ${documentId}`);
        const aggregatedConcepts = ConceptAggregator.aggregateAndDeduplicate(allChunkConcepts);
        console.log(
            `[KERNEL] Aggregation and de-duplication complete. Total concepts - Principles: ${aggregatedConcepts.principles.length}, Methods: ${aggregatedConcepts.methods.length}, Frameworks: ${aggregatedConcepts.frameworks.length}, Theories: ${aggregatedConcepts.theories.length} for documentId: ${documentId}`
        );

        console.log(`[KERNEL] Performing QA validation on aggregated concepts for documentId: ${documentId}`);
        const qaResult = await ExtractionQAAgent.validate(documentText, aggregatedConcepts);

        if (!qaResult.isValid) {
            console.warn(`[KERNEL] QA: Validation FAILED for documentId: ${documentId}. Confidence: ${qaResult.confidenceScore}. Issues:`, qaResult.issues);
        } else {
            console.log(`[KERNEL] QA: Validation PASSED for documentId: ${documentId}. Confidence: ${qaResult.confidenceScore}`);
        }
        if (qaResult.issues.length > 0 && qaResult.isValid) {
            console.log(`[KERNEL] QA: Warnings present for documentId: ${documentId}:`, qaResult.issues);
        }

        console.log(`[KERNEL] Completed extraction process for documentId: ${documentId}. Returning concepts.`);
        return qaResult.validatedConcepts;
    }
} 