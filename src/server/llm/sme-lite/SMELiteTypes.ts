import { ExtractedConcepts } from "@/types";

export interface SMELiteInput {
    finalConcepts: ExtractedConcepts;
    persona: string; // validated PersonaType passed directly
}

export interface SMEMappedConcepts {
    mappedPrinciples: string[];
    mappedMethods: string[];
    mappedFrameworks: string[];
    mappedTheories: string[];
} 