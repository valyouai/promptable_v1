import { PersonaFeedbackEngine } from "@/server/llm/persona-feedback/PersonaFeedbackEngine";
import { PersonaTransferProfiles } from "@/server/llm/persona-transfer/PersonaTransferProfiles"; // Needed for base values
import { PersonaFeedbackEntry } from "@/server/llm/persona-feedback/PersonaFeedbackTypes";

describe("Persona Feedback Engine", () => {
    // Test with a known persona that exists in PersonaTransferProfiles
    const existingPersona = "educator"; // Assuming 'educator' is a valid key

    it("should nudge profile weights up based on positive feedback (satisfaction >= 0.75) without explicit deltas", () => {
        const feedback: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.9,
        };

        const baseProfile = PersonaTransferProfiles[existingPersona];
        const result = PersonaFeedbackEngine.processFeedback(feedback);

        // Nudge is +0.05 for positive feedback
        expect(result.updatedProfile.domainAdaptationFlexibility).toBeCloseTo(Math.min(baseProfile.domainAdaptationFlexibility + 0.05, 1));
        expect(result.updatedProfile.semanticBridgeAggressiveness).toBeCloseTo(Math.min(baseProfile.semanticBridgeAggressiveness + 0.05, 1));
        expect(result.updatedProfile.translationConservativeness).toBeCloseTo(Math.min(baseProfile.translationConservativeness + 0.05, 1));
    });

    it("should nudge profile weights down based on negative feedback (satisfaction < 0.75) without explicit deltas", () => {
        const feedback: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.3,
        };
        const baseProfile = PersonaTransferProfiles[existingPersona];
        const result = PersonaFeedbackEngine.processFeedback(feedback);

        // Nudge is -0.05 for negative feedback
        expect(result.updatedProfile.domainAdaptationFlexibility).toBeCloseTo(Math.max(baseProfile.domainAdaptationFlexibility - 0.05, 0));
        expect(result.updatedProfile.semanticBridgeAggressiveness).toBeCloseTo(Math.max(baseProfile.semanticBridgeAggressiveness - 0.05, 0));
        expect(result.updatedProfile.translationConservativeness).toBeCloseTo(Math.max(baseProfile.translationConservativeness - 0.05, 0));
    });

    it("should apply explicit positive deltas from correctionSuggested, ignoring satisfaction score nudge", () => {
        const feedback: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.2, // Low score, but explicit delta should override nudge
            correctionSuggested: {
                domainAdaptationFlexibilityDelta: 0.1,
                semanticBridgeAggressivenessDelta: 0.15,
                translationConservativenessDelta: -0.05, // Can also be negative
            },
        };
        const baseProfile = PersonaTransferProfiles[existingPersona];
        const result = PersonaFeedbackEngine.processFeedback(feedback);

        expect(result.updatedProfile.domainAdaptationFlexibility).toBeCloseTo(Math.min(baseProfile.domainAdaptationFlexibility + 0.1, 1));
        expect(result.updatedProfile.semanticBridgeAggressiveness).toBeCloseTo(Math.min(baseProfile.semanticBridgeAggressiveness + 0.15, 1));
        expect(result.updatedProfile.translationConservativeness).toBeCloseTo(Math.max(baseProfile.translationConservativeness - 0.05, 0));
    });

    it("should apply explicit negative deltas from correctionSuggested", () => {
        const feedback: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.9, // High score, but explicit delta should override nudge
            correctionSuggested: {
                domainAdaptationFlexibilityDelta: -0.1,
                semanticBridgeAggressivenessDelta: -0.15,
                translationConservativenessDelta: 0.05,
            },
        };
        const baseProfile = PersonaTransferProfiles[existingPersona];
        const result = PersonaFeedbackEngine.processFeedback(feedback);

        expect(result.updatedProfile.domainAdaptationFlexibility).toBeCloseTo(Math.max(baseProfile.domainAdaptationFlexibility - 0.1, 0));
        expect(result.updatedProfile.semanticBridgeAggressiveness).toBeCloseTo(Math.max(baseProfile.semanticBridgeAggressiveness - 0.15, 0));
        expect(result.updatedProfile.translationConservativeness).toBeCloseTo(Math.min(baseProfile.translationConservativeness + 0.05, 1));
    });

    it("should correctly clamp values to be between 0 and 1 when deltas push them out of bounds", () => {
        const feedbackHigh: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.9,
            correctionSuggested: { // Deltas that would push values > 1
                domainAdaptationFlexibilityDelta: 1.5, // Assuming base is < 1, e.g., 0.5 + 1.5 = 2.0 -> clamped to 1
                semanticBridgeAggressivenessDelta: 1.5,
                translationConservativenessDelta: 1.5,
            },
        };
        const resultHigh = PersonaFeedbackEngine.processFeedback(feedbackHigh);
        expect(resultHigh.updatedProfile.domainAdaptationFlexibility).toBe(1);
        expect(resultHigh.updatedProfile.semanticBridgeAggressiveness).toBe(1);
        expect(resultHigh.updatedProfile.translationConservativeness).toBe(1);

        const feedbackLow: PersonaFeedbackEntry = {
            persona: existingPersona,
            domain: "education",
            userSatisfactionScore: 0.1,
            correctionSuggested: { // Deltas that would push values < 0
                domainAdaptationFlexibilityDelta: -1.5, // Assuming base is > 0, e.g., 0.5 - 1.5 = -1.0 -> clamped to 0
                semanticBridgeAggressivenessDelta: -1.5,
                translationConservativenessDelta: -1.5,
            },
        };
        const resultLow = PersonaFeedbackEngine.processFeedback(feedbackLow);
        expect(resultLow.updatedProfile.domainAdaptationFlexibility).toBe(0);
        expect(resultLow.updatedProfile.semanticBridgeAggressiveness).toBe(0);
        expect(resultLow.updatedProfile.translationConservativeness).toBe(0);
    });

    it("should throw an error if persona profile is not found", () => {
        const feedback: PersonaFeedbackEntry = {
            persona: "nonExistentPersona",
            domain: "anyDomain",
            userSatisfactionScore: 0.9,
        };
        expect(() => PersonaFeedbackEngine.processFeedback(feedback)).toThrow("[PersonaFeedbackEngine] Persona profile for 'nonExistentPersona' not found. Cannot process feedback.");
    });

}); 