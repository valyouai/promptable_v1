// File: tests/server/llm/Phase15KernelIntegrationHarness.test.ts

import { OrchestrationController } from '@/server/llm/OrchestrationController';
import type { PersonaType } from '@/server/llm/RelevanceFilteringAgent';
import type { ExtractionResult, CognitiveKernelResult } from '@/types';

function runPhase15Test() {
    // ✅ Simulated ExtractionResult mock (normally produced by ExtractionOrchestrator)
    const mockExtractionResult: ExtractionResult = {
        finalConcepts: {
            principles: ['Sparse Priming Representations (SPR)'],
            methods: ['Retrieval augmented generation (RAG)'],
            frameworks: ['ACE Framework'],
            theories: ['LLMs encompass various cognitive abilities'],
            notes: 'Optional educator notes'
        },
        ambiguityScores: [],
        overallConfidence: 0.92,
        fieldConfidences: [],
        processingLog: ['Extraction pipeline mock complete'],
        reinforcementDetails: undefined,
        selfCorrectionDetails: undefined,
        qaValidation: undefined,
    };

    const personas: PersonaType[] = ['educator', 'researcher', 'creator'];

    for (const persona of personas) {
        const cognitiveOutput = OrchestrationController.runCognitiveOrchestration(
            mockExtractionResult.finalConcepts,
            persona
        );

        const cognitiveKernelResult: CognitiveKernelResult = {
            extractionResult: mockExtractionResult,
            cognitiveOutput,
        };

        console.log(`🧪 Phase 15 Kernel Integration Output — Persona: ${persona}`);
        console.dir(cognitiveKernelResult, { depth: null });
    }
}

runPhase15Test(); 