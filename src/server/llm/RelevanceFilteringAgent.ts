// File: src/server/llm/RelevanceFilteringAgent.ts

import type { ExtractedConcepts } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface FilteringLogEntry {
    id: string;
    persona: PersonaType;
    field: string;
    action: 'retain' | 'exclude';
    reason: string;
}

export interface RelevanceFilteringOutput {
    filteredConcepts: ExtractedConcepts;
    filteringLog: FilteringLogEntry[];
}

export type PersonaType = 'educator' | 'researcher' | 'creator';

export class RelevanceFilteringAgent {
    static filter(extractedConcepts: ExtractedConcepts, persona: PersonaType): RelevanceFilteringOutput {
        const filteringLog: FilteringLogEntry[] = [];
        const filtered: ExtractedConcepts = {
            ...extractedConcepts,
            principles: [...extractedConcepts.principles],
            methods: [...extractedConcepts.methods],
            frameworks: [...extractedConcepts.frameworks],
            theories: [...extractedConcepts.theories],
        };

        // Scaffold rule-based filtering per persona
        if (persona === 'educator') {
            if ('notes' in filtered) {
                delete filtered.notes;
                filteringLog.push({
                    id: uuidv4(),
                    persona,
                    field: 'notes',
                    action: 'exclude',
                    reason: 'Notes field excluded for educator persona to focus on core conceptual scaffolding.',
                });
            }
        }

        if (persona === 'researcher') {
            // Retain everything - researcher gets full detail for hypothesis work
        }

        if (persona === 'creator') {
            if (filtered.theories.length > 0) {
                filtered.theories = [];
                filteringLog.push({
                    id: uuidv4(),
                    persona,
                    field: 'theories',
                    action: 'exclude',
                    reason: 'Theories field emptied for creator persona to simplify applied content structure.',
                });
            }
        }

        return {
            filteredConcepts: filtered,
            filteringLog,
        };
    }
} 