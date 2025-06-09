import { PersonaTransferProfile } from "./PersonaTransferTypes";

export const PersonaTransferOverrides: Record<string, PersonaTransferProfile> = {
    educator: {
        domainAdaptationFlexibility: 0.6,
        semanticBridgeAggressiveness: 0.55,
        translationConservativeness: 0.4,
    }
}; 