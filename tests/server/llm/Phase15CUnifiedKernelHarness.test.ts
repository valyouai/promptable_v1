import { ExtractionOrchestrator } from '../../../src/server/llm/ExtractionOrchestrator';
import { OrchestrationController, type CognitiveOrchestrationOutput } from '../../../src/server/llm/OrchestrationController';
import type { PersonaType } from '../../../src/server/llm/RelevanceFilteringAgent';
import type { CognitiveKernelResult, ExtractionResult, ExtractedConcepts } from '@/types';

const sampleDocuments = {
    doc1: "This document discusses agile methodologies and their core principles like adaptation and scalability. It also refers to the scrum framework and explores the theory of constraints in project management.",
    doc2: "Exploring game theory. Methods are vague. Principles unclear. Adaptation is key in self-organization. The Nash Equilibrium is a foundational concept.",
    doc3: "Placeholder placeholder principle. Test method. Example framework. Dummy theory. This text is designed to be simple and potentially trigger basic QA checks or low confidence."
};

const personasToTest: PersonaType[] = ['educator', 'researcher', 'creator'];

async function runUnifiedKernelTest(documentId: string, documentText: string) {
    console.log(`\n\n--- 🧪 STARTING UNIFIED KERNEL TEST FOR DOCUMENT: ${documentId} ---`);

    // 1. Run full ExtractionOrchestrator (which includes initial cognitive orchestration)
    const initialPersonaForOrchestratorRun = personasToTest[0] || 'educator'; // Ensure a persona is passed
    console.log(`\n--- Running ExtractionOrchestrator.runExtraction() for ${documentId} (Initial Persona: ${initialPersonaForOrchestratorRun}) ---`);
    const initialCognitiveKernelResult = await ExtractionOrchestrator.runExtraction(documentText, initialPersonaForOrchestratorRun);

    console.log(`\n--- Initial CognitiveKernelResult from ExtractionOrchestrator (${documentId}, Persona: ${initialPersonaForOrchestratorRun}) ---`);
    console.dir(initialCognitiveKernelResult, { depth: null });

    // 2. Explicitly run Cognitive Orchestration for multiple personas using the *same* extraction result
    console.log(`\n\n--- Explicitly Running Multi-Persona Cognitive Orchestration for ${documentId} ---`);
    const baseExtractionResult: ExtractionResult = initialCognitiveKernelResult.extractionResult;
    const finalConcepts: ExtractedConcepts | undefined = baseExtractionResult?.finalConcepts;

    if (!finalConcepts) {
        console.error(`CRITICAL: finalConcepts are undefined from initial extraction for document ${documentId}. Cannot proceed with multi-persona cognitive tests.`);
        // For CI, it's good to indicate failure more strongly
        if (process.env.CI) { process.exit(1); }
        return;
    }

    for (const persona of personasToTest) {
        console.log(`\n--- Running OrchestrationController for Persona: ${persona} (Document: ${documentId}) ---`);
        const cognitiveOutput: CognitiveOrchestrationOutput = OrchestrationController.runCognitiveOrchestration(
            finalConcepts,
            persona
        );

        const personaSpecificCognitiveKernelResult: CognitiveKernelResult = {
            extractionResult: baseExtractionResult, // Use the same extraction data
            cognitiveOutput: cognitiveOutput,    // Attach the new persona-specific cognitive output
        };

        console.log(`\n--- Unified CognitiveKernelResult for Persona: ${persona} (Document: ${documentId}) ---`);
        console.dir(personaSpecificCognitiveKernelResult, { depth: null });
    }

    console.log(`\n--- ✅ COMPLETED UNIFIED KERNEL TEST FOR DOCUMENT: ${documentId} ---`);
}

async function main() {
    console.log("🚀 STARTING PHASE 15D - UNIFIED KERNEL MERGE HARNESS (CI Adapted) 🚀");

    try {
        // Test with the first document
        await runUnifiedKernelTest('doc1', sampleDocuments.doc1);

        // Optionally, add more tests for other documents:
        // await runUnifiedKernelTest('doc2', sampleDocuments.doc2);
        // await runUnifiedKernelTest('doc3', sampleDocuments.doc3);

        console.log("\n\n🎉 PHASE 15D - UNIFIED KERNEL MERGE HARNESS COMPLETE 🎉");
        // For CI, ensure a clean exit if all tests pass
        if (process.env.CI) { process.exit(0); }
    } catch (error) {
        console.error("Error during Phase 15D Unified Kernel Merge Harness:", error);
        // For CI, ensure a non-zero exit code on error
        if (process.env.CI) { process.exit(1); }
    }
}

main(); 