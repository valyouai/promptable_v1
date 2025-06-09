import { PersonaTransferProfile } from "./PersonaTransferTypes";

export const PersonaTransferProfiles: Record<string, PersonaTransferProfile> = {
    researcher: {
        domainAdaptationFlexibility: 0.2,
        semanticBridgeAggressiveness: 0.1,
        translationConservativeness: 0.9,
    },
    educator: {
        domainAdaptationFlexibility: 0.5,
        semanticBridgeAggressiveness: 0.5,
        translationConservativeness: 0.5,
    },
    creator: {
        domainAdaptationFlexibility: 0.8,
        semanticBridgeAggressiveness: 0.9,
        translationConservativeness: 0.1,
    },
}; 