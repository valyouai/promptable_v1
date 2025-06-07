// import { SemanticChunker } from "../extraction/SemanticChunker"; // Removed as chunking is now handled by the orchestrator
import { ExtractionOrchestrator } from "../llm/ExtractionOrchestrator";
import type { ExtractionResult } from "../llm/ExtractionOrchestrator";

async function runLiveHarness() {
    console.log("🚀 Starting ExtractionKernel Live Harness");

    const inputDocument = `
    The research explores Emergent Behavior in complex systems. 
    Key methodologies include agent-based modeling and reinforcement learning.
    The framework is often a multi-agent system or cellular automata.
    Relevant theories discussed are game theory and complexity theory.
    This paper also touches upon principles like adaptation, robustness, and self-organization.
    `;

    console.log("\n📝 Document Loaded:");
    console.log(inputDocument);

    // Chunking is now handled within ExtractionOrchestrator
    // const chunks = SemanticChunker.chunkDocument(inputDocument);
    // console.log(`\n✅ Document chunked into ${chunks.length} chunks.`);

    // Extract just the chunk texts - also now handled by orchestrator
    // const chunkTexts = chunks.map(chunk => chunk.text);

    // Run the full orchestrator pipeline - call updated to pass only inputDocument
    const extractionResult: ExtractionResult = await ExtractionOrchestrator.runExtraction(inputDocument);

    console.log("\n🏁 Full Extraction Kernel Result:");
    console.dir(extractionResult, { depth: null });
}

runLiveHarness().catch(error => {
    console.error("❌ Live ExtractionKernel Harness failed:", error);
    process.exit(1);
}); 