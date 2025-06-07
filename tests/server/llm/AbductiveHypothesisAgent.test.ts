// File: tests/server/llm/AbductiveHypothesisAgent.test.ts

import { AbductiveHypothesisAgent } from '@/server/llm/AbductiveHypothesisAgent';
import type { ExtractedConcepts } from '@/types';

function runTest() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Sparse Priming Representations (SPR)'],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
    };

    const result = AbductiveHypothesisAgent.generateHypotheses(mockExtractedConcepts);

    console.log('🧪 AbductiveHypothesisAgent Test Output:');
    console.dir(result, { depth: null });
}

runTest(); 