import { ExtractionResult, ExtractedConcepts, /* AmbiguityScore, */ SelfCorrectionPassDetailForType, PersonaType } from '@/types';
import { ReinforcementAgent, ReinforcementInput, ReinforcementOutput } from './ReinforcementAgent';
import { getPersonaProfile, PersonaReinforcementProfile } from './PersonaProfiles';

export interface SelfCorrectionResult {
    passesRun: number;
    correctionLog: string[];
    finalConcepts: ExtractedConcepts;
    finalOverallConfidence: number;
    passDetails: SelfCorrectionPassDetailForType[];
    profileUsed: PersonaReinforcementProfile;
}

export async function selfCorrectExtraction(
    initialExtraction: ExtractionResult,
    fullDocumentText: string,
    persona: PersonaType,
    maxPassesOverride?: number
): Promise<SelfCorrectionResult> {
    const activeProfile = getPersonaProfile(persona);
    const maxPassesToRun = maxPassesOverride ?? activeProfile.maxCorrectionPasses;
    const currentSufficientThreshold = 1.0 - activeProfile.ambiguityTolerance;
    const aggressiveness = activeProfile.correctionAggressiveness;

    let concepts = initialExtraction.finalConcepts;
    const correctionLog: string[] = [];
    let confidence = initialExtraction.overallConfidence ?? 0.75;
    let passes = 0;
    const passDetailsCollector: SelfCorrectionPassDetailForType[] = [];

    correctionLog.push(`Using persona profile: ${activeProfile.persona}. Max passes: ${maxPassesToRun}, Ambiguity Tolerance (Sufficiency Threshold): ${currentSufficientThreshold.toFixed(2)}, Aggressiveness: ${aggressiveness}`);

    while (passes < maxPassesToRun) {
        const currentPass = passes + 1;
        const conceptsBeforePass = JSON.parse(JSON.stringify(concepts));

        const reinforcementInput: ReinforcementInput = {
            originalConcepts: concepts,
            ambiguityScores: initialExtraction.ambiguityScores ?? [],
            fullDocumentText: fullDocumentText
        };
        const reinforcementOutput: ReinforcementOutput = await ReinforcementAgent.refineConcepts(reinforcementInput);

        const refinementSummary = reinforcementOutput.refinementSummary || "No summary provided";
        correctionLog.push(
            `Pass ${currentPass}: Confidence before=${confidence.toFixed(2)}, Reinforcement Outcome: ${refinementSummary}`
        );

        concepts = reinforcementOutput.refinedConcepts;
        const reinforcedConfidence = reinforcementOutput.confidenceScore ?? confidence;
        const needsFurtherReview = reinforcedConfidence < currentSufficientThreshold;
        const confidenceAfterLoopIteration = !needsFurtherReview
            ? Math.min(reinforcedConfidence + aggressiveness, 1.0)
            : Math.max(reinforcedConfidence - aggressiveness, 0.0);

        passDetailsCollector.push({
            passNumber: currentPass,
            conceptsBeforePass: conceptsBeforePass,
            conceptsAfterPass: JSON.parse(JSON.stringify(concepts)),
            confidenceResultThisPass: {
                overallConfidence: parseFloat(reinforcedConfidence.toFixed(2)),
                fieldConfidences: [],
            },
            overallConfidenceAfterPass: parseFloat(confidenceAfterLoopIteration.toFixed(2)),
            recoveryLogThisPass: [],
            ambiguityScoresThisPass: [],
        });

        if (!needsFurtherReview) {
            confidence = confidenceAfterLoopIteration;
            correctionLog.push(`Pass ${currentPass}: Confidence after reinforcement ${reinforcedConfidence.toFixed(2)} (adjusted to ${confidence.toFixed(2)} based on aggressiveness ${aggressiveness}). Correction deemed sufficient (threshold ${currentSufficientThreshold.toFixed(2)}), breaking loop.`);
            passes++;
            break;
        } else {
            confidence = confidenceAfterLoopIteration;
            correctionLog.push(`Pass ${currentPass}: Confidence after reinforcement ${reinforcedConfidence.toFixed(2)} (adjusted to ${confidence.toFixed(2)} based on aggressiveness ${aggressiveness}). Further review may be needed (threshold ${currentSufficientThreshold.toFixed(2)}).`);
        }

        passes++;
    }

    if (passes === maxPassesToRun && (initialExtraction.overallConfidence !== undefined && confidence < initialExtraction.overallConfidence)) {
        correctionLog.push(`Max passes (${maxPassesToRun}) reached. Final confidence ${confidence.toFixed(2)} did not decisively improve or meet review threshold.`);
    } else if (passes < maxPassesToRun && passes > 0) {
        correctionLog.push(`Self-correction loop concluded early after ${passes} pass(es).`);
    } else if (passes === 0 && maxPassesToRun > 0) {
        correctionLog.push(`Self-correction loop did not run (maxPasses might be 0 or condition met immediately).`);
    } else {
        correctionLog.push(`Self-correction loop completed ${passes} pass(es). Final confidence: ${confidence.toFixed(2)}`);
    }

    return {
        passesRun: passes,
        correctionLog,
        finalConcepts: concepts,
        finalOverallConfidence: parseFloat(confidence.toFixed(2)),
        passDetails: passDetailsCollector,
        profileUsed: activeProfile,
    };
} 