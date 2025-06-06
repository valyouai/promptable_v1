import type { ExtractedConcepts } from '@/types';

export class ConceptAggregator {
    /**
     * Merges multiple ExtractedConcepts objects into a single combined output,
     * performing de-duplication for each concept category.
     *
     * @param allChunkConcepts An array of ExtractedConcepts, one for each chunk.
     * @returns A single ExtractedConcepts object with aggregated and de-duplicated concepts.
     */
    static aggregateAndDeduplicate(allChunkConcepts: ExtractedConcepts[]): ExtractedConcepts {
        const aggregated: ExtractedConcepts = {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };

        for (const chunkConcepts of allChunkConcepts) {
            aggregated.principles.push(...(chunkConcepts.principles || []));
            aggregated.methods.push(...(chunkConcepts.methods || []));
            aggregated.frameworks.push(...(chunkConcepts.frameworks || []));
            aggregated.theories.push(...(chunkConcepts.theories || []));
        }

        // De-duplicate
        aggregated.principles = [...new Set(aggregated.principles)];
        aggregated.methods = [...new Set(aggregated.methods)];
        aggregated.frameworks = [...new Set(aggregated.frameworks)];
        aggregated.theories = [...new Set(aggregated.theories)];

        return aggregated;
    }
} 