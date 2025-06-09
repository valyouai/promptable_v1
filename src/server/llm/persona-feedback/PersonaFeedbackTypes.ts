import { PersonaTransferProfile } from "@/server/llm/persona-transfer/PersonaTransferTypes";

export interface PersonaFeedbackEntry {
    persona: string;
    domain: string;
    userSatisfactionScore: number; // 0-1 scale
    correctionSuggested?: {
        domainAdaptationFlexibilityDelta?: number;
        semanticBridgeAggressivenessDelta?: number;
        translationConservativenessDelta?: number;
    };
}

export interface UpdatedPersonaTransferProfile {
    updatedProfile: PersonaTransferProfile;
} 