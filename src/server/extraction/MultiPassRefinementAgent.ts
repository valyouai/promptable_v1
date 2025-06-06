// src/server/extraction/MultiPassRefinementAgent.ts

import { ExtractedConcepts } from '@/types';

type ReinforceableField =
    | 'Research Objective'
    | 'Methods'
    | 'Dataset(s)'
    | 'Key Findings'
    | 'Limitations'
    | 'Future Work'
    | 'Applications';

export class MultiPassRefinementAgent {
    private static readonly fieldsToReinforce: ReinforceableField[] = [
        'Research Objective',
        'Methods',
        'Dataset(s)',
        'Key Findings',
        'Limitations',
        'Future Work',
        'Applications'
    ];

    public static async reinforce(documentText: string, concepts: ExtractedConcepts): Promise<ExtractedConcepts> {
        const updatedConcepts: ExtractedConcepts = { ...concepts };

        for (const field of this.fieldsToReinforce) {
            const value = updatedConcepts[field];
            if (!value || (typeof value === 'string' && value.trim() === '')) {
                const patchedValue = await this.requestFieldRepair(field, documentText);
                updatedConcepts[field] = patchedValue;
            }
        }

        return updatedConcepts;
    }

    private static async requestFieldRepair(field: ReinforceableField, documentText: string): Promise<string> {
        const systemPrompt = `You are an academic extraction assistant. The following research paper text may be missing the "${field}" field. Based on the document content, attempt to generate a best-effort extraction for "${field}". If truly unavailable, return: "Not explicitly mentioned."`;

        // Replace this with your actual LLM call adapter
        const llmResponse = await someLLMAPI.call({
            systemPrompt,
            userPrompt: documentText
        });

        return llmResponse.output?.[field] ?? "Not explicitly mentioned.";
    }
} 