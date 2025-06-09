// File: src/server/llm/GapDetectionAgent.ts

import type { ExtractedConcepts, PersonaType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getPersonaProfile } from './PersonaProfiles';

export type GapType = 'neglect' | 'confusion' | 'application';

export interface IdentifiedGap {
    id: string;
    gapType: GapType;
    description: string;
    relatedFields: string[];
}

export interface GapDetectionOutput {
    identifiedGaps: IdentifiedGap[];
}

// Define a type for the fields we know are string arrays in ExtractedConcepts
type ArrayConceptField = 'principles' | 'methods' | 'frameworks' | 'theories';

// An array of these specific fields to iterate over for neglect spotting
const arrayConceptFieldsForNeglectCheck: ArrayConceptField[] = ['principles', 'methods', 'frameworks', 'theories'];

const BASE_CONFUSION_COUNT_THRESHOLD = 3;
const SENSITIVITY_SCALING_FACTOR = 2; // How much sensitivity affects the count threshold

export class GapDetectionAgent {
    static detectGaps(extractedConcepts: ExtractedConcepts, persona: PersonaType): GapDetectionOutput {
        const gaps: IdentifiedGap[] = [];
        const activeProfile = getPersonaProfile(persona);
        const gapSensitivity = activeProfile.gapSensitivity;

        // Log persona and sensitivity (can be pushed to a more formal log within GapDetectionOutput if needed)
        const initialLogDescription = `Gap detection running for persona: ${persona}, sensitivity: ${gapSensitivity.toFixed(2)}.`;
        // For now, this log isn't directly part of the IdentifiedGap[] output structure unless we add a general log field.
        // Consider adding a log entry to gaps array if needed: 
        // gaps.push({ id: uuidv4(), gapType: 'log', description: initialLogDescription, relatedFields: [] });
        console.log(`[GapDetectionAgent] ${initialLogDescription}`); // Temporary console log for visibility

        // 🔎 Neglect Spotting: Check for missing items in core array fields
        for (const field of arrayConceptFieldsForNeglectCheck) {
            const currentConcepts = extractedConcepts[field];
            if (!currentConcepts || currentConcepts.length === 0) {
                gaps.push({
                    id: uuidv4(),
                    gapType: 'neglect',
                    description: `No concepts found for "${field}". Persona: ${persona}.`,
                    relatedFields: [field],
                });
            }
        }

        // 🔎 Confusion Spotting (with persona-based sensitivity)
        const sensitivityModifier = (0.5 - gapSensitivity);
        const adjustedConfusionCountThreshold = Math.max(1, BASE_CONFUSION_COUNT_THRESHOLD - Math.round(sensitivityModifier * SENSITIVITY_SCALING_FACTOR));

        const principlesCount = extractedConcepts.principles?.length ?? 0;
        const methodsCount = extractedConcepts.methods?.length ?? 0;

        if (principlesCount > adjustedConfusionCountThreshold && methodsCount > adjustedConfusionCountThreshold) {
            gaps.push({
                id: uuidv4(),
                gapType: 'confusion',
                description: `High density of concepts in both principles (>${adjustedConfusionCountThreshold}) and methods (>${adjustedConfusionCountThreshold}) may indicate overlapping boundaries. Persona: ${persona}, Sensitivity: ${gapSensitivity.toFixed(2)}. Adjusted Threshold: ${adjustedConfusionCountThreshold}.`,
                relatedFields: ['principles', 'methods'],
            });
        }

        // 🔎 Application Spotting (very basic heuristic for future expansion)
        if ((extractedConcepts.frameworks?.length ?? 0) > 0 && (!extractedConcepts.methods || extractedConcepts.methods.length === 0)) {
            gaps.push({
                id: uuidv4(),
                gapType: 'application',
                description: `Framework present without clear applied methods. Application opportunity exists. Persona: ${persona}.`,
                relatedFields: ['frameworks', 'methods'],
            });
        }

        if (gaps.length === 0) {
            // If, after all checks, no specific gaps are found, add a general message.
            // This message should also reflect the persona context.
            gaps.push({
                id: uuidv4(),
                gapType: 'neglect', // Or a more general type like 'assessment'
                description: `No significant gaps detected based on current criteria for persona: ${persona}, sensitivity: ${gapSensitivity.toFixed(2)}. Adjusted confusion threshold was ${adjustedConfusionCountThreshold}.`,
                relatedFields: [],
            });
        }

        return { identifiedGaps: gaps };
    }
} 