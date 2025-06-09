// File: src/server/llm/AbductiveHypothesisAgent.ts

import type { ExtractedConcepts, PersonaType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { getPersonaProfile } from './PersonaProfiles';

export interface Hypothesis {
    id: string;
    hypothesis: string;
    justification: string;
    relatedFields: string[];
}

export interface AbductiveHypothesisOutput {
    potentialHypotheses: Hypothesis[];
}

const SECOND_HYPOTHESIS_GENERATION_THRESHOLD = 0.4;

export class AbductiveHypothesisAgent {
    static generateHypotheses(extractedConcepts: ExtractedConcepts, persona: PersonaType): AbductiveHypothesisOutput {
        const hypotheses: Hypothesis[] = [];
        const activeProfile = getPersonaProfile(persona);
        const explorationFactor = activeProfile.hypothesisExplorationFactor;

        console.log(`[AbductiveHypothesisAgent] Running for persona: ${persona}, hypothesisExplorationFactor: ${explorationFactor.toFixed(2)}`);

        // First hypothesis: Principles and Methods
        if (extractedConcepts.principles?.length && extractedConcepts.methods?.length) {
            hypotheses.push({
                id: uuidv4(),
                hypothesis: `Applying the principle of "${extractedConcepts.principles[0].value}" may enhance the effectiveness of "${extractedConcepts.methods[0].value}".`,
                justification: `Combining core principle and applied method suggests a testable causal relationship. Explored with a '${persona}' perspective (Exploration Factor: ${explorationFactor.toFixed(2)}).`,
                relatedFields: ['principles', 'methods'],
            });
        }

        // Second hypothesis: Theories and Frameworks (conditional on explorationFactor)
        if (explorationFactor >= SECOND_HYPOTHESIS_GENERATION_THRESHOLD) {
            if (extractedConcepts.theories?.length && extractedConcepts.frameworks?.length) {
                hypotheses.push({
                    id: uuidv4(),
                    hypothesis: `The framework "${extractedConcepts.frameworks[0].value}" may operationalize the theoretical model "${extractedConcepts.theories[0].value}".`,
                    justification: `Frameworks often provide applied structure for abstract theories. Explored with a '${persona}' perspective (Exploration Factor: ${explorationFactor.toFixed(2)}, Threshold: ${SECOND_HYPOTHESIS_GENERATION_THRESHOLD}).`,
                    relatedFields: ['frameworks', 'theories'],
                });
            }
        }

        if (hypotheses.length === 0) {
            hypotheses.push({
                id: uuidv4(),
                hypothesis: `No sufficient concept combinations available for abductive hypothesis generation under the current '${persona}' persona settings (Exploration Factor: ${explorationFactor.toFixed(2)}).`,
                justification: `Extraction yielded insufficient field combinations or persona settings restricted hypothesis assembly.`,
                relatedFields: [],
            });
        }

        return { potentialHypotheses: hypotheses };
    }
} 