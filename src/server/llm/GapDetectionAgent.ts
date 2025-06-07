// File: src/server/llm/GapDetectionAgent.ts

import type { ExtractedConcepts } from '@/types';
import { v4 as uuidv4 } from 'uuid';

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

export class GapDetectionAgent {
    static detectGaps(extractedConcepts: ExtractedConcepts): GapDetectionOutput {
        const gaps: IdentifiedGap[] = [];

        // 🔎 Neglect Spotting: Check for missing items in core array fields
        for (const field of arrayConceptFieldsForNeglectCheck) {
            // 'field' is of type ArrayConceptField, so extractedConcepts[field] is string[]
            // as these fields are non-optional string[] in ExtractedConcepts.
            const values: string[] = extractedConcepts[field];
            if (!values || values.length === 0) { // Robust check, though !values is redundant if type holds
                gaps.push({
                    id: uuidv4(),
                    gapType: 'neglect',
                    description: `No concepts found for "${field}".`,
                    relatedFields: [field],
                });
            }
        }

        // 🔎 Confusion Spotting (very simple placeholder logic)
        if (
            (extractedConcepts.principles?.length ?? 0) > 3 &&
            (extractedConcepts.methods?.length ?? 0) > 3
        ) {
            gaps.push({
                id: uuidv4(),
                gapType: 'confusion',
                description: `High density of concepts in both principles and methods may indicate overlapping boundaries.`,
                relatedFields: ['principles', 'methods'],
            });
        }

        // 🔎 Application Spotting (very basic heuristic for future expansion)
        if (
            (extractedConcepts.frameworks?.length ?? 0) > 0 &&
            (!extractedConcepts.methods || extractedConcepts.methods.length === 0)
        ) {
            gaps.push({
                id: uuidv4(),
                gapType: 'application',
                description: `Framework present without clear applied methods. Application opportunity exists.`,
                relatedFields: ['frameworks', 'methods'],
            });
        }

        if (gaps.length === 0) {
            gaps.push({
                id: uuidv4(),
                gapType: 'neglect',
                description: `No significant gaps detected.`,
                relatedFields: [],
            });
        }

        return { identifiedGaps: gaps };
    }
} 