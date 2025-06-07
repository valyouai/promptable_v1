import type { ExtractedConcepts, QAValidationResult, CognitiveKernelResult, ExtractionResult as GlobalExtractionResult } from '@/types';
import { SemanticChunker } from '../extraction/SemanticChunker';
import { ExtractorAgent } from './ExtractorAgent';
import { PatternNormalizer } from '../extraction/PatternNormalizer';
import { AmbiguityDetectorAgent } from './AmbiguityDetectorAgent';
import { DependencyModel, type DependencyInsight } from './DependencyModel';
import { ConfidenceFusionEngine } from './ConfidenceFusionEngine';
import { ReinforcementAgent } from './ReinforcementAgent';
import { ExtractionQAAgent } from '../../../lib/extraction/ExtractionQAAgent';

// 🧠 Phase 14/15: Cognitive Kernel Imports
import { OrchestrationController } from './OrchestrationController';
import type { PersonaType } from './RelevanceFilteringAgent';

// Define output shape for the original extraction part (this was local before, now explicitly named for clarity)
export class ExtractionOrchestrator {
    static async runExtraction(documentText: string, persona: PersonaType): Promise<CognitiveKernelResult> {
        const processingLog: string[] = [];
        processingLog.push('Starting Extraction Pipeline...');

        // Step 1: Chunk
        const chunks = SemanticChunker.chunkDocument(documentText);
        processingLog.push(`Document chunked into ${chunks.length} segments.`);

        // Step 2: Extract
        const chunkTexts = chunks.map(chunk => chunk.text);
        const extractedConcepts = await ExtractorAgent.extract(chunkTexts);
        processingLog.push('Initial extraction complete.');

        // Step 3: Normalize
        const normalizedConcepts = PatternNormalizer.normalize(extractedConcepts);
        processingLog.push('Pattern normalization applied.');

        // Step 4: Ambiguity Detection
        const ambiguityScores = AmbiguityDetectorAgent.detectAmbiguities(normalizedConcepts);
        processingLog.push(`Ambiguity detection complete (${ambiguityScores.length} fields scored).`);

        // Step 5: Dependency Analysis
        const dependencyModel = new DependencyModel();
        dependencyModel.analyzeDependencies(normalizedConcepts);

        // Correctly build the dependencyInsights map for ConfidenceFusionEngine
        const dependencyInsightsForFusion: Partial<Record<keyof ExtractedConcepts, DependencyInsight[]>> = {};
        const fieldsToAnalyze: (keyof ExtractedConcepts)[] = ['principles', 'methods', 'frameworks', 'theories']; // Add other relevant fields if necessary

        for (const sourceField of fieldsToAnalyze) {
            // Ensure the field exists and has content in normalizedConcepts before seeking dependencies
            if (normalizedConcepts[sourceField] &&
                ((Array.isArray(normalizedConcepts[sourceField]) && (normalizedConcepts[sourceField] as string[]).length > 0) ||
                    typeof normalizedConcepts[sourceField] === 'string' && (normalizedConcepts[sourceField] as string).length > 0)
            ) {
                const insightsArray = dependencyModel.getPotentialDependencies(sourceField as import('./DomainSchema').DomainField);
                if (insightsArray.length > 0) {
                    dependencyInsightsForFusion[sourceField] = insightsArray;
                }
            }
        }
        // Note: The previous variable 'dependencyInsights' (which was an array) is no longer created.
        // 'dependencyInsightsArray' is now scoped within the loop.

        // Step 6: Confidence Fusion
        const confidenceResult = ConfidenceFusionEngine.fuseSignals({
            concepts: normalizedConcepts,
            ambiguityScores,
            dependencyInsights: dependencyInsightsForFusion, // Use the correctly structured map
        });

        processingLog.push('Confidence fusion complete.');

        // Step 7: Reinforcement Pass
        const reinforcementOutput = await ReinforcementAgent.refineConcepts({
            originalConcepts: normalizedConcepts,
            fullDocumentText: documentText,
            ambiguityScores,
        });

        processingLog.push('Reinforcement agent pass complete.');

        // Step 8: Self-Correction Loop (placeholder as per the patch)
        const selfCorrectionDetailsForGlobalResult: GlobalExtractionResult['selfCorrectionDetails'] = undefined;

        // Step 9: QA Validation
        const qaValidation = await ExtractionQAAgent.validate(documentText, reinforcementOutput.refinedConcepts);
        processingLog.push('QA validation complete.');

        // MODIFIED: Assemble the extractionResult object, explicitly typing it as GlobalExtractionResult
        const extractionResult: GlobalExtractionResult = {
            finalConcepts: reinforcementOutput.refinedConcepts,
            ambiguityScores: ambiguityScores.map(as => ({ ...as, field: as.field as keyof ExtractedConcepts })),
            overallConfidence: confidenceResult.overallConfidence,
            fieldConfidences: confidenceResult.fieldConfidences.map(fc => ({ ...fc, field: fc.field as keyof ExtractedConcepts | string })),
            processingLog,
            reinforcementDetails: reinforcementOutput.refinementSummary
                ? {
                    summary: reinforcementOutput.refinementSummary,
                    attempts: [], // Placeholder, as ReinforcementAgent current mock doesn't provide detailed attempts
                    // Example logic for needsFurtherReview based on available info:
                    needsFurtherReview: reinforcementOutput.confidenceScore !== undefined ? reinforcementOutput.confidenceScore < 0.7 : true,
                }
                : undefined,
            selfCorrectionDetails: selfCorrectionDetailsForGlobalResult,
            qaValidation,
        };

        // NEW: Inject cognitive orchestration layer post-extraction
        const cognitiveOutput = OrchestrationController.runCognitiveOrchestration(
            extractionResult.finalConcepts,
            persona
        );

        // TEMP: Log to verify cognitive kernel invocation during first runs -- REMOVE THIS LINE
        // console.log('[Phase 15 Cognitive Kernel Output]', JSON.stringify(cognitiveOutput, null, 2)); 

        processingLog.push('Phase 15 Cognitive Layer Orchestration invoked successfully.');

        // Return new Phase 15 contract structure:
        const cognitiveKernelResult: CognitiveKernelResult = {
            extractionResult,
            cognitiveOutput,
        };

        return cognitiveKernelResult;
    }
}

// Example usage
// MODIFIED: Uncommenting the testOrchestrator function -- REMOVE THIS ENTIRE FUNCTION AND ITS CALL
/* REMOVE_START
async function testOrchestrator() {
    console.log("Testing ExtractionOrchestrator...");
    const sampleDocumentText1 = "This document discusses agile methodologies and their core principles like adaptation and scalability. It also refers to the scrum framework.";
    const sampleDocumentText2 = "Exploring game theory. Methods are vague. Principles unclear. Adaptation is key in self-organization."; // designed to trigger reinforcement & loop
    const sampleDocumentText3 = "Placeholder placeholder principle. Test method. Example framework. Dummy theory."; // designed to trigger QA issues
    const testPersona: PersonaType = 'researcher'; // Define a persona for testing

    try {
        console.log("\n--- Test Run 1: Simple Document (Persona: " + testPersona + ") ---");
        const result1 = await ExtractionOrchestrator.runExtraction(sampleDocumentText1, testPersona);
        console.log("\n--- Orchestrator Test Result 1 (Final) ---");
        console.dir(result1, { depth: null });

        console.log("\n\n--- Test Run 2: Document designed to need correction (Persona: " + testPersona + ") ---");
        const result2 = await ExtractionOrchestrator.runExtraction(sampleDocumentText2, testPersona);
        console.log("\n--- Orchestrator Test Result 2 (Final) ---");
        console.dir(result2, { depth: null });

        console.log("\n\n--- Test Run 3: Document designed to have QA issues (Persona: " + testPersona + ") ---");
        const result3 = await ExtractionOrchestrator.runExtraction(sampleDocumentText3, testPersona);
        console.log("\n--- Orchestrator Test Result 3 (Final) ---");
        console.dir(result3, { depth: null });

    } catch (error) {
        console.error("Error during ExtractionOrchestrator test:", error);
    }
}

// MODIFIED: Adding a call to testOrchestrator to execute it
testOrchestrator();
REMOVE_END */ 