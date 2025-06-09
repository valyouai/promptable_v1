import type { TraceableConcept } from '@/types';

export function conceptToString(concept: TraceableConcept): string {
    return `${concept.value} (Source: ${concept.source ?? "N/A"}, Score: ${concept.score?.toFixed(2) ?? "N/A"})`;
} 