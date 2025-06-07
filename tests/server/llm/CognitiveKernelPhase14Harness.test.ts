// File: tests/server/llm/CognitiveKernelPhase14Harness.test.ts

import { OrchestrationController } from '@/server/llm/OrchestrationController';
import type { ExtractedConcepts } from '@/types';
import type { PersonaType } from '@/server/llm/RelevanceFilteringAgent';

function runPhase14Test() {
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Sparse Priming Representations (SPR)'],
        methods: ['Retrieval augmented generation (RAG)'],
        frameworks: ['ACE Framework'],
        theories: ['LLMs encompass various cognitive abilities'],
        notes: 'Optional educator notes'
    };

    const personas: PersonaType[] = ['educator', 'researcher', 'creator'];

    for (const persona of personas) {
        const cognitiveOutput = OrchestrationController.runCognitiveOrchestration(
            mockExtractedConcepts,
            persona
        );

        console.log(`🧪 Phase 14 Cognitive Kernel Output — Persona: ${persona}`);
        console.dir(cognitiveOutput, { depth: null });
    }
}

runPhase14Test(); 