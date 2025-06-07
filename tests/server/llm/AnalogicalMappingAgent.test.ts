// File: tests/server/llm/AnalogicalMappingAgent.test.ts

import { AnalogicalMappingAgent } from '@/server/llm/AnalogicalMappingAgent';
import type { ExtractedConcepts } from '@/types';

function runTest() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Sparse Priming Representations (SPR)'],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
    };

    const result = AnalogicalMappingAgent.mapAnalogies(mockExtractedConcepts);

    console.log('🧪 AnalogicalMappingAgent Test Output:');
    console.dir(result, { depth: null });
}

runTest(); 