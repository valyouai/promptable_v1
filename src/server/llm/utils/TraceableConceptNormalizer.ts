// TraceableConceptNormalizer.ts

import { TraceableConcept } from "@/types/index";

/**
 * Converts raw string arrays (already frame-tagged) into TraceableConcept arrays.
 * Injects dummy source until full source tracking is available upstream.
 */
export function normalizeToTraceableConcept(input: string[]): TraceableConcept[] {
    return input.map((value) => ({
        value: value,
        source: "N/A"  // placeholder for future provenance metadata
    }));
} 