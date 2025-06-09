// File: src/server/llm/AnalogicalMappingAgent.ts

import type { ExtractedConcepts, PersonaType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getPersonaProfile } from './PersonaProfiles';

export interface AnalogicalMapping {
    id: string;
    sourceField: string;
    targetField: string;
    sourceConcept: string;
    targetConcept: string;
    alignmentScore: number;
    reasoning: string;
}

export interface AnalogicalMappingOutput {
    mappedAnalogies: AnalogicalMapping[];
}

const DEFAULT_P_T_ALIGNMENT = 0.7;
const DEFAULT_M_F_ALIGNMENT = 0.65;
const ALIGNMENT_SENSITIVITY_SCALE = 0.2; // How much divergenceFactor influences the score

export class AnalogicalMappingAgent {
    static mapAnalogies(extractedConcepts: ExtractedConcepts, persona: PersonaType): AnalogicalMappingOutput {
        const analogies: AnalogicalMapping[] = [];
        const activeProfile = getPersonaProfile(persona);
        const divergenceFactor = activeProfile.analogyDivergenceFactor;

        // Log for visibility (can be removed or integrated into a formal log later)
        console.log(`[AnalogicalMappingAgent] Running for persona: ${persona}, analogyDivergenceFactor: ${divergenceFactor.toFixed(2)}`);

        const scoreModifier = (divergenceFactor - 0.5) * ALIGNMENT_SENSITIVITY_SCALE;

        // Pairwise analogical mapping for Principles and Theories
        if (extractedConcepts.principles?.length && extractedConcepts.theories?.length) {
            const baseScore = DEFAULT_P_T_ALIGNMENT;
            const adjustedScore = Math.max(0, Math.min(1, baseScore + scoreModifier)); // Cap score between 0 and 1
            const reasoning = `The principle "${extractedConcepts.principles[0].value}" may reflect or instantiate the theoretical model "${extractedConcepts.theories[0].value}". Evaluated for persona '${persona}' (divergence: ${divergenceFactor.toFixed(2)}).`;
            analogies.push({
                id: uuidv4(),
                sourceField: 'principles',
                targetField: 'theories',
                sourceConcept: extractedConcepts.principles[0].value,
                targetConcept: extractedConcepts.theories[0].value,
                alignmentScore: parseFloat(adjustedScore.toFixed(2)),
                reasoning: reasoning,
            });
        }

        // Pairwise analogical mapping for Methods and Frameworks
        if (extractedConcepts.methods?.length && extractedConcepts.frameworks?.length) {
            const baseScore = DEFAULT_M_F_ALIGNMENT;
            const adjustedScore = Math.max(0, Math.min(1, baseScore + scoreModifier)); // Cap score between 0 and 1
            const reasoning = `The method "${extractedConcepts.methods[0].value}" may serve as an operational implementation within the "${extractedConcepts.frameworks[0].value}" framework. Evaluated for persona '${persona}' (divergence: ${divergenceFactor.toFixed(2)}).`;
            analogies.push({
                id: uuidv4(),
                sourceField: 'methods',
                targetField: 'frameworks',
                sourceConcept: extractedConcepts.methods[0].value,
                targetConcept: extractedConcepts.frameworks[0].value,
                alignmentScore: parseFloat(adjustedScore.toFixed(2)),
                reasoning: reasoning,
            });
        }

        if (analogies.length === 0) {
            const reasoning = `No valid analogies found due to insufficient extracted concepts for persona '${persona}' (divergence factor: ${divergenceFactor.toFixed(2)}).`;
            analogies.push({
                id: uuidv4(),
                sourceField: '',
                targetField: '',
                sourceConcept: '',
                targetConcept: '',
                alignmentScore: 0,
                reasoning: reasoning,
            });
        }

        return { mappedAnalogies: analogies };
    }
} 