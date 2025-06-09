// File: src/server/llm/RelevanceFilteringAgent.ts

import type { ExtractedConcepts, PersonaType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getPersonaProfile } from './PersonaProfiles';

export interface FilteringLogEntry {
    id: string;
    persona: PersonaType;
    field: string;
    action: 'retain' | 'exclude';
    reason: string;
    weightApplied?: number;
}

export interface RelevanceFilteringOutput {
    filteredConcepts: ExtractedConcepts;
    filteringLog: FilteringLogEntry[];
}

export class RelevanceFilteringAgent {
    static filter(extractedConcepts: ExtractedConcepts, persona: PersonaType): RelevanceFilteringOutput {
        const activeProfile = getPersonaProfile(persona);
        const fieldWeights = activeProfile.fieldWeights;
        const filteringLog: FilteringLogEntry[] = [];

        // Deep clone to avoid mutating the original object directly
        const filtered: ExtractedConcepts = JSON.parse(JSON.stringify(extractedConcepts));

        filteringLog.push({
            id: uuidv4(),
            persona: persona,
            field: '-',
            action: 'retain',
            reason: `Initializing relevance filtering for persona: ${persona}. Using profile with ambiguityTolerance: ${activeProfile.ambiguityTolerance}. Field weights active.`,
            weightApplied: 1.0 // Placeholder for general log entry
        });

        // Example of how fieldWeights could be used. 
        // This is a simplified logic; a real implementation might involve more complex scoring.
        const fieldsToConsider = Object.keys(filtered) as Array<keyof ExtractedConcepts>;

        for (const field of fieldsToConsider) {
            // Ensure fieldWeights is treated as an indexable type
            const specificFieldWeights = fieldWeights as { [key: string]: number };
            const weight = specificFieldWeights[field as string] ?? 1.0; // Default to 1.0 if no specific weight
            let decisionReason = `Field '${String(field)}' processed. Weight: ${weight.toFixed(2)}.`;
            let action: 'retain' | 'exclude' = 'retain';

            // Placeholder for persona-specific filtering logic influenced by weights
            // Example: 'creator' persona might be more aggressive in filtering 'theories'
            if (persona === 'creator' && field === 'theories') {
                if (weight < 0.5) { // Arbitrary threshold for demonstration
                    action = 'exclude';
                    // filtered[field] is TraceableConcept[] based on ExtractedConcepts type
                    filtered[field] = []; // Clear the array for exclusion
                    decisionReason += ` Field EXCLUDED for 'creator' due to low weight (${weight.toFixed(2)} < 0.5).`;
                } else {
                    decisionReason += ` Field RETAINED for 'creator' despite being 'theories' due to sufficient weight (${weight.toFixed(2)} >= 0.5).`;
                }
            } else {
                // Default retention, or more complex logic here
                decisionReason += ` Default retention for persona '${persona}'.`;
            }

            filteringLog.push({
                id: uuidv4(),
                persona,
                field: String(field),
                action,
                reason: decisionReason,
                weightApplied: weight,
            });
        }

        return {
            filteredConcepts: filtered,
            filteringLog,
        };
    }
} 