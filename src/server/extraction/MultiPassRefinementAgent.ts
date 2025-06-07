// src/server/extraction/MultiPassRefinementAgent.ts

import { ExtractedConcepts } from '@/types';
import { OpenAIAdapter } from '@/server/llm/OpenAIAdapter';

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

            const needsRepair =
                !value ||
                (typeof value === 'string' && (
                    value.trim() === '' ||
                    value.trim() === 'Not explicitly mentioned.' ||
                    value.trim().length < 50
                ));

            if (needsRepair) {
                console.log(`[MultiPassRefinementAgent] Repair triggered for field: ${field}`);
                const patchedValue = await this.requestFieldRepair(field, documentText);
                updatedConcepts[field] = patchedValue;
            } else {
                console.log(`[MultiPassRefinementAgent] Skipped repair for field: ${field}`);
            }
        }

        return updatedConcepts;
    }

    private static async requestFieldRepair(field: ReinforceableField, documentText: string): Promise<string> {
        const systemPrompt = `You are an academic extraction assistant. The following research paper text may be missing or incomplete for the field "${field}". Please extract or improve the best possible value for "${field}". If no data can be extracted, return: "Not explicitly mentioned."`;

        const llmResponse = await OpenAIAdapter.call({
            systemPrompt,
            userPrompt: documentText
        });

        const responseObject = llmResponse as Record<string, unknown>;
        return typeof responseObject[field] === 'string' ? (responseObject[field] as string) : "Not explicitly mentioned.";
    }
} 