import { ExtractedConcepts, TraceableConcept } from "@/types"; // Ensure TraceableConcept is also imported if used explicitly, though ExtractedConcepts implies it.

export class TraceabilityAgentEngine {
    static verifyTraceAnchors(concepts: ExtractedConcepts): string[] {
        console.log("--- Traceability Agent Verifying Sources ---");

        const issues: string[] = [];

        // Object.entries on ExtractedConcepts will give [key, TraceableConcept[]]
        Object.entries(concepts).forEach(([field, conceptList]) => {
            // Ensure conceptList is treated as an array of TraceableConcept
            (conceptList as TraceableConcept[]).forEach((concept: TraceableConcept) => {
                if (!concept.source || concept.source.trim() === "") {
                    issues.push(`Missing source trace for ${field} → "${concept.value}"`);
                }
            });
        });

        return issues;
    }
} 