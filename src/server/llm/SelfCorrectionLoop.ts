import type { ExtractedConcepts } from '../../../types';
import type { AmbiguityScore } from './AmbiguityDetectorAgent';
import { ReinforcementAgentV2, type ReinforcementInputV2, type ReinforcementOutputV2, type RecoveryAttemptDetail } from './ReinforcementAgentV2';
import { type DependencyModel, type DependencyInsight } from './DependencyModel'; // Ensured DependencyInsight is imported
import type { FieldConfidence } from './ConfidenceFusionEngine';
import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema'; // Import DOMAIN_SCHEMA

export interface SelfCorrectionInput {
    initialConcepts: ExtractedConcepts;
    ambiguityScores: AmbiguityScore[]; // Ambiguity scores for the initialConcepts
    dependencyModel: DependencyModel; // The instance of the dependency model
    fieldConfidences: FieldConfidence[]; // Field confidences for the initialConcepts
    fullDocumentText: string;
    reinforcementConfig?: ReinforcementInputV2['config']; // Pass through reinforcement config
    maxPasses?: number;  // Default: 3
}

export interface SelfCorrectionLoopPassDetail {
    passNumber: number;
    summaryOfReinforcement: string;
    recoveryAttempts: RecoveryAttemptDetail[];
    conceptsBeforePass: ExtractedConcepts;
    conceptsAfterPass: ExtractedConcepts;
    needsFurtherReviewThisPass: boolean;
}

export interface SelfCorrectionOutput {
    finalConcepts: ExtractedConcepts;
    passesRun: number;
    correctionLog: string[]; // High-level log summary
    passDetails: SelfCorrectionLoopPassDetail[]; // Detailed log per pass
    overallNeedsFurtherReview: boolean; // Final status of needsFurtherReview
}

export class SelfCorrectionLoop {
    private static readonly DEFAULT_MAX_PASSES = 3;

    public static async run(input: SelfCorrectionInput): Promise<SelfCorrectionOutput> {
        let currentConcepts = JSON.parse(JSON.stringify(input.initialConcepts)) as ExtractedConcepts;
        let passesRun = 0;
        const correctionLog: string[] = [`Self-Correction Loop initiated.`];
        const passDetails: SelfCorrectionLoopPassDetail[] = [];
        let overallNeedsFurtherReview = false;

        // Use the maxPasses from input or default to 3
        const maxPasses = input.maxPasses ?? this.DEFAULT_MAX_PASSES;

        // Changed to const as they are not reassigned in the current logic flow
        const currentAmbiguityScores = input.ambiguityScores;
        const currentFieldConfidences = input.fieldConfidences;

        while (passesRun < maxPasses) {
            passesRun++;
            correctionLog.push(`🌀 Starting Correction Pass ${passesRun}/${maxPasses}...`);
            const conceptsBeforeThisPass = JSON.parse(JSON.stringify(currentConcepts)) as ExtractedConcepts;

            const reinforcementInput: ReinforcementInputV2 = {
                originalConcepts: currentConcepts, // Pass the current state of concepts
                ambiguityScores: currentAmbiguityScores, // Pass current (initially input's) ambiguities
                dependencyInsights: SelfCorrectionLoop._extractDependencyInsights(input.dependencyModel),
                fieldConfidences: currentFieldConfidences, // Pass current (initially input's) confidences
                fullDocumentText: input.fullDocumentText,
                config: input.reinforcementConfig // Pass through any specific reinforcement config
            };

            const reinforcementOutput: ReinforcementOutputV2 = await ReinforcementAgentV2.refineConcepts(reinforcementInput);

            correctionLog.push(`  Pass ${passesRun} Summary: ${reinforcementOutput.refinementSummary.split('\n')[0]}`); // First line of summary for brevity
            currentConcepts = reinforcementOutput.refinedConcepts;
            overallNeedsFurtherReview = reinforcementOutput.needsFurtherReview; // Update based on the latest pass

            passDetails.push({
                passNumber: passesRun,
                summaryOfReinforcement: reinforcementOutput.refinementSummary,
                recoveryAttempts: reinforcementOutput.recoveryAttempts,
                conceptsBeforePass: conceptsBeforeThisPass,
                conceptsAfterPass: currentConcepts,
                needsFurtherReviewThisPass: reinforcementOutput.needsFurtherReview
            });

            if (!reinforcementOutput.needsFurtherReview) {
                correctionLog.push(`✅ No further review needed after pass ${passesRun}. Exiting loop.`);
                break; // Exit the loop if no further review is flagged
            }

            // Placeholder: If we were to re-evaluate ambiguities/confidences for the next pass:
            // currentAmbiguityScores = AmbiguityDetectorAgent.detectAmbiguities(currentConcepts);
            // const newConfidenceResult = ConfidenceFusionEngine.fuseSignals({ concepts: currentConcepts, ambiguityScores: currentAmbiguityScores, dependencyInsights: ... });
            // currentFieldConfidences = newConfidenceResult.fieldConfidences;
            // correctionLog.push(`  Re-evaluated signals for next pass.`);

            correctionLog.push(`  Pass ${passesRun} completed. Needs further review: ${reinforcementOutput.needsFurtherReview}.`);
        }

        if (passesRun >= maxPasses && overallNeedsFurtherReview) {
            correctionLog.push(`⚠️ Max passes (${maxPasses}) reached. Needs further review remains true.`);
        }

        correctionLog.push('Self-Correction Loop finished.');

        return {
            finalConcepts: currentConcepts,
            passesRun,
            correctionLog,
            passDetails,
            overallNeedsFurtherReview
        };
    }

    /**
     * Extracts dependency insights from the DependencyModel for all domain fields.
     */
    private static _extractDependencyInsights(dependencyModel: DependencyModel): Partial<Record<DomainField, DependencyInsight[]>> {
        const insights: Partial<Record<DomainField, DependencyInsight[]>> = {};
        // Use DOMAIN_SCHEMA.fields for iteration
        for (const field of DOMAIN_SCHEMA.fields as readonly DomainField[]) {
            insights[field] = dependencyModel.getPotentialDependencies(field);
        }
        return insights;
    }
}

// Example Usage (Placeholder - to be tested via Orchestrator)
/*
async function testSelfCorrectionLoop() {
    // Mock data would be needed here for: ExtractedConcepts, AmbiguityScore[], DependencyModel instance, FieldConfidence[], fullDocumentText
    console.log("SelfCorrectionLoop test needs full mock setup.");
}
*/ 