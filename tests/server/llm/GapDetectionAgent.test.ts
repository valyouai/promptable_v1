// File: tests/server/llm/GapDetectionAgent.test.ts

import { GapDetectionAgent } from '@/server/llm/GapDetectionAgent';
import type { ExtractedConcepts } from '@/types';

function runTest() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: [],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
    };

    const result = GapDetectionAgent.detectGaps(mockExtractedConcepts);

    console.log('🧪 GapDetectionAgent Test Output:');
    console.dir(result, { depth: null });
}

runTest(); 