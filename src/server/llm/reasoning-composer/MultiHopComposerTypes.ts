import { ExtractedConcepts } from "@/types";

export interface MultiHopComposerInput {
    conceptSet: ExtractedConcepts;
    persona: string;
    domain: string;
}

export interface MultiHopComposerOutput {
    composedMappings: string[];
} 