import { SemanticChunker, type Chunk } from '../extraction/SemanticChunker';
import { PatternNormalizer } from '../extraction/PatternNormalizer';
import { AmbiguityDetectorAgent, type AmbiguityScore } from './AmbiguityDetectorAgent';
import { DependencyModel, type DependencyInsight } from './DependencyModel';
import { ConfidenceFusionEngine, type UnifiedConfidenceResult } from './ConfidenceFusionEngine';
import { ReinforcementAgentV2, type ReinforcementInputV2, type ReinforcementOutputV2 } from './ReinforcementAgentV2';
import { SelfCorrectionLoop, type SelfCorrectionInput, type SelfCorrectionOutput } from './SelfCorrectionLoop';
import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema';
import { ExtractionQAAgent } from '../../../lib/extraction/ExtractionQAAgent';
import type { ExtractedConcepts, QAValidationResult, ExtractionResult } from '../../../types';
import { ExtractorAgent } from "./ExtractorAgent";

export class ExtractionOrchestrator {
    private static dependencyModel = new DependencyModel();
    private static reinforcementConfig: ReinforcementInputV2['config'] = {
        minConfidenceForAction: 0.6,
    };
    private static selfCorrectionLoopConfig = {
        maxPasses: 2,
    };

    public static async runExtraction(documentText: string): Promise<ExtractionResult> {
        const processingLog: string[] = ["Starting extraction..."];

        processingLog.push("Chunking document...");
        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);
        processingLog.push(`Document chunked into ${chunks.length} chunks.`);

        const chunksContent: string[] = chunks.map(chunk => chunk.text);

        processingLog.push("Performing initial extraction (Live ExtractorAgent)...");
        const initialExtraction: ExtractedConcepts = await ExtractorAgent.extract(chunksContent);
        processingLog.push("Initial extraction complete.");

        processingLog.push("Normalizing extracted data...");
        const dataToNormalize: Record<string, unknown> = { ...initialExtraction };
        const normalizedConcepts = PatternNormalizer.normalize(dataToNormalize) as ExtractedConcepts;
        processingLog.push("Data normalization complete.");

        const defaultEmptyConcepts: ExtractedConcepts = { principles: [], methods: [], frameworks: [], theories: [] };
        let currentConcepts: ExtractedConcepts = {
            ...defaultEmptyConcepts,
            ...normalizedConcepts,
            principles: normalizedConcepts.principles || [],
            methods: normalizedConcepts.methods || [],
            frameworks: normalizedConcepts.frameworks || [],
            theories: normalizedConcepts.theories || [],
            notes: normalizedConcepts.notes
        };

        processingLog.push("Detecting ambiguities (pre-reinforcement)...");
        const initialAmbiguityScores: AmbiguityScore[] = AmbiguityDetectorAgent.detectAmbiguities(currentConcepts);
        processingLog.push(`Initial ambiguity detection complete. Found ${initialAmbiguityScores.length} potential ambiguities.`);

        processingLog.push("Analyzing concept dependencies...");
        this.dependencyModel.analyzeDependencies(currentConcepts);
        const dependencyInsightsGathered: Partial<Record<DomainField, DependencyInsight[]>> = {};
        for (const field of DOMAIN_SCHEMA.fields) {
            const fieldKey = field as DomainField;
            dependencyInsightsGathered[fieldKey] = this.dependencyModel.getPotentialDependencies(fieldKey);
        }
        processingLog.push("Concept dependency analysis and insight gathering complete.");

        processingLog.push("Fusing confidence signals (pre-reinforcement)...");
        const initialConfidenceResult: UnifiedConfidenceResult = ConfidenceFusionEngine.fuseSignals({
            concepts: currentConcepts,
            ambiguityScores: initialAmbiguityScores,
            dependencyInsights: dependencyInsightsGathered
        });
        processingLog.push(`Initial confidence fusion complete. Overall confidence: ${initialConfidenceResult.overallConfidence}`);
        console.log("[ExtractionOrchestrator] Initial confidence fusion result:", initialConfidenceResult);

        processingLog.push("Invoking ReinforcementAgentV2 (Pass 1)...");
        const reinforcementInput: ReinforcementInputV2 = {
            originalConcepts: currentConcepts,
            ambiguityScores: initialAmbiguityScores,
            dependencyInsights: dependencyInsightsGathered,
            fieldConfidences: initialConfidenceResult.fieldConfidences,
            fullDocumentText: documentText,
            config: this.reinforcementConfig
        };
        const reinforcementOutput: ReinforcementOutputV2 = await ReinforcementAgentV2.refineConcepts(reinforcementInput);
        currentConcepts = reinforcementOutput.refinedConcepts;
        processingLog.push(`ReinforcementAgentV2 (Pass 1) finished. Summary: ${reinforcementOutput.refinementSummary.split('\n')[0]}`);
        console.log("[ExtractionOrchestrator] ReinforcementAgentV2 (Pass 1) output:", reinforcementOutput);

        const adaptedRecoveryAttempts = reinforcementOutput.recoveryAttempts.map(attempt => ({
            ...attempt,
            originalValue: Array.isArray(attempt.originalValue) ? attempt.originalValue : (typeof attempt.originalValue === 'string' ? [attempt.originalValue] : []),
            newValue: Array.isArray(attempt.newValue) ? attempt.newValue : (typeof attempt.newValue === 'string' ? [attempt.newValue] : []),
            details: attempt.details ?? "",
        }));

        const firstPassReinforcementDetails = {
            summary: reinforcementOutput.refinementSummary,
            attempts: adaptedRecoveryAttempts,
            needsFurtherReview: reinforcementOutput.needsFurtherReview
        };
        let selfCorrectionDetails: SelfCorrectionOutput | undefined = undefined;

        if (reinforcementOutput.needsFurtherReview) {
            processingLog.push("Initial reinforcement pass suggests further review. Invoking SelfCorrectionLoop...");
            const selfCorrectionInput: SelfCorrectionInput = {
                initialConcepts: currentConcepts,
                ambiguityScores: initialAmbiguityScores,
                dependencyModel: this.dependencyModel,
                fieldConfidences: initialConfidenceResult.fieldConfidences,
                fullDocumentText: documentText,
                reinforcementConfig: this.reinforcementConfig,
                maxPasses: this.selfCorrectionLoopConfig.maxPasses
            };
            selfCorrectionDetails = await SelfCorrectionLoop.run(selfCorrectionInput);
            currentConcepts = selfCorrectionDetails.finalConcepts;
            processingLog.push(...selfCorrectionDetails.correctionLog.map(l => `  [SCL] ${l}`));
            processingLog.push(`SelfCorrectionLoop finished. Overall needs further review: ${selfCorrectionDetails.overallNeedsFurtherReview}`);
            console.log("[ExtractionOrchestrator] SelfCorrectionLoop output:", selfCorrectionDetails);
        } else {
            processingLog.push("Initial reinforcement pass did not flag for further review. Skipping SelfCorrectionLoop.");
        }

        processingLog.push("Performing final QA validation...");
        const qaValidationResult: QAValidationResult = await ExtractionQAAgent.validate(documentText, currentConcepts);
        currentConcepts = qaValidationResult.validatedConcepts;
        processingLog.push(`QA Validation complete. Is Valid: ${qaValidationResult.isValid}. Issues: ${qaValidationResult.issues.length}. QA Confidence: ${qaValidationResult.confidenceScore}`);
        console.log("[ExtractionOrchestrator] QA Validation result:", qaValidationResult);

        processingLog.push("Note: Reported top-level confidence scores (overallConfidence, fieldConfidences) are pre-any-reinforcement.");
        processingLog.push("Extraction Orchestrator run finished.");

        const finalOutputConcepts: ExtractedConcepts = {
            ...currentConcepts,
            notes: currentConcepts.notes ?? ""
        };

        return {
            finalConcepts: finalOutputConcepts,
            ambiguityScores: initialAmbiguityScores,
            overallConfidence: initialConfidenceResult.overallConfidence,
            fieldConfidences: initialConfidenceResult.fieldConfidences,
            processingLog: processingLog,
            reinforcementDetails: firstPassReinforcementDetails,
            selfCorrectionDetails: selfCorrectionDetails,
            qaValidation: qaValidationResult
        };
    }
}

// Example usage 
/*
async function testOrchestrator() {
    console.log("Testing ExtractionOrchestrator...");
    const sampleDocumentText1 = "This document discusses agile methodologies and their core principles like adaptation and scalability. It also refers to the scrum framework.";
    const sampleDocumentText2 = "Exploring game theory. Methods are vague. Principles unclear. Adaptation is key in self-organization."; // designed to trigger reinforcement & loop
    const sampleDocumentText3 = "Placeholder placeholder principle. Test method. Example framework. Dummy theory."; // designed to trigger QA issues

    try {
        console.log("\n--- Test Run 1: Simple Document ---");
        const result1 = await ExtractionOrchestrator.runExtraction(sampleDocumentText1);
        console.log("\n--- Orchestrator Test Result 1 (Final) ---");
        console.dir(result1, { depth: null });

        console.log("\n\n--- Test Run 2: Document designed to need correction ---");
        const result2 = await ExtractionOrchestrator.runExtraction(sampleDocumentText2);
        console.log("\n--- Orchestrator Test Result 2 (Final) ---");
        console.dir(result2, { depth: null });

        console.log("\n\n--- Test Run 3: Document designed to have QA issues ---");
        const result3 = await ExtractionOrchestrator.runExtraction(sampleDocumentText3);
        console.log("\n--- Orchestrator Test Result 3 (Final) ---");
        console.dir(result3, { depth: null });

    } catch (error) {
        console.error("Error during ExtractionOrchestrator test:", error);
    }
}
// testOrchestrator();
*/ 