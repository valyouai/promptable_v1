import { PersonaFeedbackEntry, UpdatedPersonaTransferProfile } from "./PersonaFeedbackTypes";
import { PersonaTransferProfiles } from "@/server/llm/persona-transfer/PersonaTransferProfiles";
import { PersonaTransferProfile } from "@/server/llm/persona-transfer/PersonaTransferTypes"; // Added to use as a type

export class PersonaFeedbackEngine {
    static processFeedback(feedback: PersonaFeedbackEntry): UpdatedPersonaTransferProfile {
        console.log("--- Persona Feedback Processor Activated ---");

        // Ensure PersonaTransferProfiles provides a type-safe structure, even if it's Record<string, any> initially.
        // A more robust approach would be to have PersonaTransferProfiles typed as Record<string, PersonaTransferProfile>
        const baseProfile: PersonaTransferProfile | undefined = PersonaTransferProfiles[feedback.persona];

        if (!baseProfile) {
            // Fallback or error handling if a specific persona profile doesn't exist
            // For now, let's assume a generic default or throw an error.
            // Throwing an error is safer to highlight missing configurations.
            console.error(`[PersonaFeedbackEngine] Persona profile for '${feedback.persona}' not found in PersonaTransferProfiles.`);
            // Depending on requirements, could return a default/unmodified profile or re-throw.
            // For this phase, we'll proceed cautiously by creating a default if not found, though this might hide issues.
            // A better long-term solution is to ensure all personas in feedback have base profiles.
            // However, the spec implies direct modification of base profiles, so they *must* exist.
            throw new Error(`[PersonaFeedbackEngine] Persona profile for '${feedback.persona}' not found. Cannot process feedback.`);
        }

        const multiplier = feedback.userSatisfactionScore >= 0.75 ? 0.05 : -0.05;

        // Apply explicit deltas if provided, otherwise use the score-based multiplier
        const dafDelta = feedback.correctionSuggested?.domainAdaptationFlexibilityDelta;
        const sbaDelta = feedback.correctionSuggested?.semanticBridgeAggressivenessDelta;
        const tcDelta = feedback.correctionSuggested?.translationConservativenessDelta;

        const updatedProfileData: PersonaTransferProfile = {
            domainAdaptationFlexibility: Math.min(
                Math.max(baseProfile.domainAdaptationFlexibility + (dafDelta ?? multiplier), 0),
                1
            ),
            semanticBridgeAggressiveness: Math.min(
                Math.max(baseProfile.semanticBridgeAggressiveness + (sbaDelta ?? multiplier), 0),
                1
            ),
            translationConservativeness: Math.min(
                Math.max(baseProfile.translationConservativeness + (tcDelta ?? multiplier), 0),
                1
            ),
        };

        const updated: UpdatedPersonaTransferProfile = {
            updatedProfile: updatedProfileData
        };

        console.log(`[PersonaFeedbackEngine] Feedback for persona '${feedback.persona}':`,
            `Base DAF: ${baseProfile.domainAdaptationFlexibility.toFixed(2)}, Updated: ${updated.updatedProfile.domainAdaptationFlexibility.toFixed(2)}`,
            `Base SBA: ${baseProfile.semanticBridgeAggressiveness.toFixed(2)}, Updated: ${updated.updatedProfile.semanticBridgeAggressiveness.toFixed(2)}`,
            `Base TC: ${baseProfile.translationConservativeness.toFixed(2)}, Updated: ${updated.updatedProfile.translationConservativeness.toFixed(2)}`);

        return updated;
    }
} 