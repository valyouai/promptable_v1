// File: tests/server/llm/RelevanceFilteringAgent.test.ts

import { RelevanceFilteringAgent, PersonaType } from '@/server/llm/RelevanceFilteringAgent';
import type { ExtractedConcepts } from '@/types';

function runTest() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Sparse Priming Representations (SPR)'],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
        notes: 'Some optional notes field that only Educator will filter.'
    };

    const personas: PersonaType[] = ['educator', 'researcher', 'creator'];

    for (const persona of personas) {
        const result = RelevanceFilteringAgent.filter(mockExtractedConcepts, persona);
        console.log(`🧪 RelevanceFilteringAgent Test Output for persona: ${persona}`);
        console.dir(result, { depth: null });
    }
}

runTest(); 