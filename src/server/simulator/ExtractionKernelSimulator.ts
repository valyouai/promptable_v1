import { SemanticChunker } from "../../server/extraction/SemanticChunker";
import { ConceptAggregator } from "../../server/extraction/ConceptAggregator";
import { ExtractionQAAgent } from "../../../lib/extraction/ExtractionQAAgent";
import { mockPdfSamples } from "./fixtures/MockPDFSamples";
import { getSchemaStressMockResponse } from "./fixtures/SchemaStressFixtures";
import { PatternNormalizer } from "../extraction/PatternNormalizer";
import { getSchemaDriftVariationData, schemaDriftMocks, type SchemaDriftVariation } from "./fixtures/SchemaDriftFixtures";
import type { ExtractedConcepts } from "@/types";
import { jsonrepair } from "jsonrepair";
import { AmbiguityDetectorAgent, type AmbiguityScore } from '../llm/AmbiguityDetectorAgent';
import { ReinforcementAgent, type ReinforcementInput, type ReinforcementOutput } from '../llm/ReinforcementAgent';

async function simulateOpenAIAdapter(rawResponse: string): Promise<unknown> {
    if (!rawResponse) {
        console.warn('[Simulator] Empty raw response to simulateOpenAIAdapter.');
        return { output: '' };
    }
    try {
        return JSON.parse(rawResponse);
    } catch {
        try {
            const repairedJsonString = jsonrepair(rawResponse);
            return JSON.parse(repairedJsonString);
        } catch (e2) {
            console.warn('[Simulator] Repair and parse failed for mock response. Falling back to { output: rawResponse }.', e2);
            return { output: rawResponse };
        }
    }
}

async function runSimulation() {
    console.log("🚀 Starting Extraction Kernel Simulator Harness\n");

    const documentContent = mockPdfSamples.sample1.content;
    const chunks = SemanticChunker.chunkDocument(documentContent);
    console.log(`✅ Document chunked into ${chunks.length} chunks for context (QA phase).\n`);

    // Section 1: Schema Stress Testing (Existing Logic)
    console.log(" sección 🧪🔬 Starting Schema Stress Testing 🔬🧪 sección \n");
    const extractedResultsForAggregator: ExtractedConcepts[] = [];
    const defaultEmptyConcepts: ExtractedConcepts = { principles: [], methods: [], frameworks: [], theories: [] };

    const stressCases: (keyof typeof import('./fixtures/SchemaStressFixtures').schemaStressMocks.sample1.chunk1)[] = [
        "validComplete",
        "missingFields",
        "emptyArrays",
        "extraFields",
        "invalidFormat",
        "justText"
    ];

    for (const variation of stressCases) {
        console.log(`🧪 Testing Schema Stress variation: ${variation}...`);
        const mockLLMResponse = getSchemaStressMockResponse("sample1", "chunk1", variation);

        if (!mockLLMResponse) {
            console.warn(`⚠️ No mock response found for stress variation: ${variation}`);
            extractedResultsForAggregator.push({ ...defaultEmptyConcepts, notes: `Mock response missing for stress variation ${variation}` });
            continue;
        }

        try {
            const repairedResponse: unknown = await simulateOpenAIAdapter(mockLLMResponse);
            let conceptsForAggregator: ExtractedConcepts;
            if (typeof repairedResponse === 'object' && repairedResponse !== null) {
                const partialConcepts = repairedResponse as Partial<ExtractedConcepts>;
                conceptsForAggregator = {
                    ...defaultEmptyConcepts,
                    ...partialConcepts,
                    principles: Array.isArray(partialConcepts.principles) ? partialConcepts.principles : [],
                    methods: Array.isArray(partialConcepts.methods) ? partialConcepts.methods : [],
                    frameworks: Array.isArray(partialConcepts.frameworks) ? partialConcepts.frameworks : [],
                    theories: Array.isArray(partialConcepts.theories) ? partialConcepts.theories : [],
                };
                if ('output' in repairedResponse && typeof (repairedResponse as { output?: string }).output === 'string' && Object.keys(repairedResponse).length === 1) {
                    console.warn(`[SIMULATOR-Stress] Processed response was a fallback object. Content: "${(repairedResponse as { output: string }).output.substring(0, 100)}...". Using as notes.`);
                    conceptsForAggregator.notes = `Processed response was fallback object: ${(repairedResponse as { output: string }).output}`;
                }
            } else if (typeof repairedResponse === 'string') {
                console.warn(`[SIMULATOR-Stress] Processed response is a string: "${repairedResponse.substring(0, 100)}...". Using as notes.`);
                conceptsForAggregator = { ...defaultEmptyConcepts, notes: `Processed response was a string: ${repairedResponse}` };
            } else {
                console.warn(`[SIMULATOR-Stress] Processed response not standard object/string. Type: ${typeof repairedResponse}. Value: ${JSON.stringify(repairedResponse).substring(0, 100)}... Using empty concepts with notes.`);
                conceptsForAggregator = { ...defaultEmptyConcepts, notes: `Unparseable processed response: ${JSON.stringify(repairedResponse)}` };
            }
            extractedResultsForAggregator.push(conceptsForAggregator);
            console.log("✅ Mock LLM Response Processed for Schema Stress (Repair simulation complete)\n");

        } catch (error) {
            console.error("❌ Error during schema stress mock LLM response processing:", error);
            extractedResultsForAggregator.push({ ...defaultEmptyConcepts, notes: `Error processing stress variation ${variation}: ${error instanceof Error ? error.message : String(error)}` });
        }
    }

    const aggregated = ConceptAggregator.aggregateAndDeduplicate(extractedResultsForAggregator);
    console.log("✅ Schema Stress Aggregation complete\n");
    console.dir(aggregated, { depth: null });

    const qaResult = await ExtractionQAAgent.validate(documentContent, aggregated);
    console.log("✅ Schema Stress QA Validation complete\n");
    console.dir(qaResult, { depth: null });
    console.log("\n sección 🧪🔬 End of Schema Stress Testing 🔬🧪 sección \n");

    // Section 2: Schema Drift & Normalization Testing (New Logic)
    console.log(" sección ✨🌀 Starting Schema Drift & Pattern Normalization Testing 🌀✨ sección \n");

    const driftSampleKey: keyof typeof schemaDriftMocks = "sample1";
    const driftChunkKey: keyof (typeof schemaDriftMocks)[typeof driftSampleKey] = "chunk1";
    const driftVariations = Object.keys(schemaDriftMocks[driftSampleKey][driftChunkKey]) as (keyof (typeof schemaDriftMocks)[typeof driftSampleKey][typeof driftChunkKey])[];

    for (const variation of driftVariations) {
        console.log(`🧪 Testing Schema Drift variation: ${variation}...`);
        const driftVariationData: SchemaDriftVariation | null = getSchemaDriftVariationData(driftSampleKey, driftChunkKey, variation);

        if (!driftVariationData || driftVariationData.mockResponse === null || typeof driftVariationData.mockResponse === 'undefined') {
            console.warn(`⚠️ No mock response data found for drift variation: ${variation}`);
            continue;
        }

        const rawMockDriftResponse = driftVariationData.mockResponse as string;
        const currentFullDocumentText = driftVariationData.fullDocumentText;

        try {
            // Step 1: Simulate Repair Layer (as before)
            console.log(`[DriftSim-${variation}] Raw LLM-like output:`, rawMockDriftResponse);
            const repairedDriftResponse: unknown = await simulateOpenAIAdapter(rawMockDriftResponse);
            console.log(`[DriftSim-${variation}] Output after simulated repair:`, repairedDriftResponse);

            // Step 2: Pass to PatternNormalizer
            // Ensure repairedDriftResponse is Record<string, unknown> before passing
            let dataToNormalize: Record<string, unknown>;
            if (typeof repairedDriftResponse === 'object' && repairedDriftResponse !== null) {
                dataToNormalize = repairedDriftResponse as Record<string, unknown>;
            } else {
                // If repair results in a string or other non-object, we might wrap it or log an error
                // For now, let's create a placeholder object to pass to the normalizer, or skip normalization for this case
                console.warn(`[DriftSim-${variation}] Repaired response is not an object, cannot normalize directly. Type: ${typeof repairedDriftResponse}. Value:`, repairedDriftResponse);
                // Potentially, we could try to normalize even if it's just a string, e.g. { "output": repairedDriftResponse }
                // For now, we will create a simple object to show the flow
                dataToNormalize = { raw_output: repairedDriftResponse };
            }

            console.log(`[DriftSim-${variation}] Data going into PatternNormalizer:`, dataToNormalize);
            const normalizedData = PatternNormalizer.normalize(dataToNormalize); // Using the placeholder normalizer
            console.log(`[DriftSim-${variation}] Data after PatternNormalizer:`, normalizedData);

            // Step 3: Pass to AmbiguityDetectorAgent
            // We need to ensure normalizedData conforms to ExtractedConcepts
            // For the simulator, we'll assume the normalizer produces a compatible structure
            // or we would have a more robust casting/validation step here in a real scenario.
            const conceptsForAmbiguityCheck = normalizedData as ExtractedConcepts;

            if (typeof conceptsForAmbiguityCheck.principles === 'undefined' &&
                typeof conceptsForAmbiguityCheck.methods === 'undefined' &&
                typeof conceptsForAmbiguityCheck.frameworks === 'undefined' &&
                typeof conceptsForAmbiguityCheck.theories === 'undefined') {
                console.warn(`[DriftSim-${variation}] Normalized data does not seem to be ExtractedConcepts, skipping ambiguity detection. Data:`, conceptsForAmbiguityCheck);
            } else {
                const ambiguityScores: AmbiguityScore[] = AmbiguityDetectorAgent.detectAmbiguities(conceptsForAmbiguityCheck);
                if (ambiguityScores.length > 0) {
                    console.log(`[DriftSim-${variation}] 🚨 Ambiguities Detected:`);
                    console.dir(ambiguityScores, { depth: null });
                } else {
                    console.log(`[DriftSim-${variation}] ✅ No ambiguities detected.`);
                }

                // Step 4: Pass to ReinforcementAgent
                console.log(`[DriftSim-${variation}] 🧠 Invoking ReinforcementAgent...`);
                const reinforcementInput: ReinforcementInput = {
                    originalConcepts: conceptsForAmbiguityCheck,
                    ambiguityScores: ambiguityScores, // Scores from AmbiguityDetectorAgent
                    fullDocumentText: currentFullDocumentText // Use the specific fullDocumentText for this variation
                };

                const reinforcementOutput: ReinforcementOutput = await ReinforcementAgent.refineConcepts(reinforcementInput);

                console.log(`[DriftSim-${variation}] ✨ Reinforcement Agent Output:`);
                if (typeof reinforcementOutput.confidenceScore !== 'undefined') {
                    console.log(`[DriftSim-${variation}]    Confidence Score: ${reinforcementOutput.confidenceScore}`);
                }
                if (reinforcementOutput.refinementSummary) {
                    console.log(`[DriftSim-${variation}]    Summary: ${reinforcementOutput.refinementSummary}`);
                }
                console.log(`[DriftSim-${variation}]    Refined Concepts:`);
                console.dir(reinforcementOutput.refinedConcepts, { depth: null });

            }

            console.log(`✅ Mock LLM Response Processed for Schema Drift (Repair + Normalization + Ambiguity + Reinforcement placeholder complete)\n`);

        } catch (error) {
            console.error(`❌ Error during schema drift mock LLM response processing for variation ${variation}:`, error);
        }
    }
    console.log("\n🏁 End of Schema Drift & Pattern Normalization Testing 🏁\n");
    console.log("✨ Simulation run finished. Review logs for details on stress and drift tests. ✨");
}

runSimulation()
    .then(() => console.log("✨ Simulation completed successfully by runSimulation()."))
    .catch(error => {
        console.error("❌❌❌ TOP LEVEL SIMULATION ERROR ❌❌❌");
        console.error("Error Name:", error.name);
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);
        process.exit(1); // Ensure a non-zero exit code on error
    }); 