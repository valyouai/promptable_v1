// File: tests/server/llm/OrchestrationController.test.ts

import { OrchestrationController } from '@/server/llm/OrchestrationController';
import type { ExtractedConcepts } from '@/types';
import type { PersonaType } from '@/server/llm/RelevanceFilteringAgent';

function runTest() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Sparse Priming Representations (SPR)'],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
        notes: 'Optional notes only used for educator filtering logic'
    };

    const personas: PersonaType[] = ['educator', 'researcher', 'creator'];

    for (const persona of personas) {
        const result = OrchestrationController.runCognitiveOrchestration(mockExtractedConcepts, persona);
        console.log(`🧪 OrchestrationController Test Output for persona: ${persona}`);
        console.dir(result, { depth: null });
    }
}

runTest(); 