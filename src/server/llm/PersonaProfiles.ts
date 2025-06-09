import type { PersonaType, PersonaReinforcementProfile } from '@/types';

export type { PersonaReinforcementProfile }; // Re-export the type

export const PersonaProfiles: PersonaReinforcementProfile[] = [
    {
        persona: 'creator',
        fieldWeights: {
            principles: 1.0,
            methods: 1.0,
            frameworks: 0.8,
            theories: 0.4,
            notes: 0.2
        },
        ambiguityTolerance: 0.6,
        maxCorrectionPasses: 2,
        correctionAggressiveness: 0.15,
        gapSensitivity: 0.7,
        analogyDivergenceFactor: 0.7,
        hypothesisExplorationFactor: 0.8,
    },
    {
        persona: 'researcher',
        fieldWeights: {
            principles: 1.0,
            methods: 1.0,
            frameworks: 1.0,
            theories: 1.0,
            notes: 0.6
        },
        ambiguityTolerance: 0.4,
        maxCorrectionPasses: 5,
        correctionAggressiveness: 0.25,
        gapSensitivity: 0.3,
        analogyDivergenceFactor: 0.2,
        hypothesisExplorationFactor: 0.3,
    },
    {
        persona: 'educator',
        fieldWeights: {
            principles: 1.0,
            methods: 1.0,
            frameworks: 0.9,
            theories: 0.8,
            notes: 0.7
        },
        ambiguityTolerance: 0.5,
        maxCorrectionPasses: 3,
        correctionAggressiveness: 0.20,
        gapSensitivity: 0.5,
        analogyDivergenceFactor: 0.5,
        hypothesisExplorationFactor: 0.5,
    }
];

// Helper function to get a profile, with a fallback to a default if not found
export function getPersonaProfile(persona: PersonaType): PersonaReinforcementProfile {
    const profile = PersonaProfiles.find(p => p.persona === persona);
    if (profile) {
        return profile;
    }
    // Fallback to a default profile (e.g., researcher, or a generic one)
    console.warn(`[PersonaProfiles] Profile for persona '${persona}' not found. Falling back to researcher profile.`);
    return PersonaProfiles.find(p => p.persona === 'researcher') || PersonaProfiles[0]; // Ensure fallback exists
} 