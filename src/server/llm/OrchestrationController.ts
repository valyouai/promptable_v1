// File: src/server/llm/OrchestrationController.ts

import type { ExtractedConcepts } from '@/types';
import { AbductiveHypothesisAgent, AbductiveHypothesisOutput } from './AbductiveHypothesisAgent';
import { GapDetectionAgent, GapDetectionOutput } from './GapDetectionAgent';
import { AnalogicalMappingAgent, AnalogicalMappingOutput } from './AnalogicalMappingAgent';
import { RelevanceFilteringAgent, RelevanceFilteringOutput, PersonaType } from './RelevanceFilteringAgent';

export interface CognitiveOrchestrationOutput {
    abductiveOutput: AbductiveHypothesisOutput;
    gapDetectionOutput: GapDetectionOutput;
    analogicalMappingOutput: AnalogicalMappingOutput;
    relevanceFilteringOutput: RelevanceFilteringOutput;
    orchestrationLog: string[];
}

export class OrchestrationController {
    static runCognitiveOrchestration(extractedConcepts: ExtractedConcepts, persona: PersonaType): CognitiveOrchestrationOutput {
        const orchestrationLog: string[] = [];

        orchestrationLog.push('🧠 Starting Cognitive Orchestration Pipeline...');

        // 1️⃣ Run Abductive Reasoning
        orchestrationLog.push('Running AbductiveHypothesisAgent...');
        const abductiveOutput = AbductiveHypothesisAgent.generateHypotheses(extractedConcepts);
        orchestrationLog.push(`Generated ${abductiveOutput.potentialHypotheses.length} abductive hypotheses.`);

        // 2️⃣ Run Gap Detection
        orchestrationLog.push('Running GapDetectionAgent...');
        const gapDetectionOutput = GapDetectionAgent.detectGaps(extractedConcepts);
        orchestrationLog.push(`Detected ${gapDetectionOutput.identifiedGaps.length} gaps.`);

        // 3️⃣ Run Analogical Mapping
        orchestrationLog.push('Running AnalogicalMappingAgent...');
        const analogicalMappingOutput = AnalogicalMappingAgent.mapAnalogies(extractedConcepts);
        orchestrationLog.push(`Generated ${analogicalMappingOutput.mappedAnalogies.length} analogical mappings.`);

        // 4️⃣ Run Persona-Based Relevance Filtering
        orchestrationLog.push(`Running RelevanceFilteringAgent for persona: ${persona}...`);
        const relevanceFilteringOutput = RelevanceFilteringAgent.filter(extractedConcepts, persona);
        orchestrationLog.push(`Filtering applied. Filter log entries: ${relevanceFilteringOutput.filteringLog.length}.`);

        orchestrationLog.push('✅ Cognitive Orchestration Complete.');

        return {
            abductiveOutput,
            gapDetectionOutput,
            analogicalMappingOutput,
            relevanceFilteringOutput,
            orchestrationLog,
        };
    }
} 