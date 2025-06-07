// src/server/extraction/SchemaActivator.ts

import { ExtractedConcepts } from '@/types';

/**
 * Phase 4 - Schema Activator
 * 
 * This module maps loosely extracted keys into a target schema,
 * ensuring consistent field alignment regardless of source phrasing.
 */

export class SchemaActivator {
    public static activate(persona: 'creator' | 'researcher' | 'educator', normalized: Record<string, unknown>): ExtractedConcepts {
        switch (persona) {
            case 'creator':
                return this.creatorSchema(normalized);
            case 'researcher':
                return this.researcherSchema(normalized);
            case 'educator':
                return this.educatorSchema(normalized);
            // Removed default case to let persona type exhaustiveness checking work, 
            // or add default: const _exhaustiveCheck: never = persona; throw new Error(...);
        }
    }

    private static creatorSchema(normalized: Record<string, unknown>): ExtractedConcepts {
        return {
            principles: this.getStringArray(normalized, 'principles'),
            methods: this.getStringArray(normalized, 'methods'),
            frameworks: this.getStringArray(normalized, 'frameworks'),
            theories: this.getStringArray(normalized, 'theories'),
            // Other optional fields from ExtractedConcepts will be undefined if not present in normalized, which is fine.
        };
    }

    private static researcherSchema(normalized: Record<string, unknown>): ExtractedConcepts {
        // ⚠ Initial placeholder schema logic — will fully customize later
        return normalized as ExtractedConcepts;
    }

    private static educatorSchema(normalized: Record<string, unknown>): ExtractedConcepts {
        // ⚠ Initial placeholder schema logic — will fully customize later
        return normalized as ExtractedConcepts;
    }

    // 🔧 Hardened extractor helper (reusable for all personas)
    private static getStringArray(normalized: Record<string, unknown>, field: string): string[] {
        const value = normalized[field];
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.filter(item => typeof item === 'string');
        }
        if (typeof value === 'string') {
            return [value];
        }
        return [];
    }
} 