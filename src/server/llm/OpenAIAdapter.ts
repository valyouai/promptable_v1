import OpenAI from 'openai';
import { jsonrepair } from 'jsonrepair';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class OpenAIAdapter {
    public static parseAndRepairLLMResponse(rawResponseContent: string): unknown {
        if (!rawResponseContent) {
            console.warn('[OpenAIAdapter] Empty response content received for parsing.');
            return { output: '' }; // Return an empty object or specific structure for empty
        }

        let contentToParse = rawResponseContent;
        const markdownFenceRegex = /^```(?:json)?\s*([\s\S]*?)\s*```$/m; // Added 'm' flag for multiline
        const match = contentToParse.match(markdownFenceRegex);

        if (match && match[1]) {
            contentToParse = match[1].trim(); // Trim the extracted content
            console.log('[OpenAIAdapter] Stripped markdown fences. Original length:', rawResponseContent.length, 'Cleaned length:', contentToParse.length);
        } else {
            // console.log('[OpenAIAdapter] No markdown fences detected or content not wrapped.');
        }

        try {
            // If the content is a JSON string (e.g., "\"hello\""), JSON.parse will return the string itself.
            const parsed = JSON.parse(contentToParse);
            return parsed;
        } catch (error) {
            console.warn('[OpenAIAdapter] Initial JSON.parse failed, attempting repair for content:', contentToParse.substring(0, 100) + "...", error);
            try {
                const repaired = jsonrepair(contentToParse);
                console.log('[OpenAIAdapter] JSON repair successful.');
                // Similarly, if repaired is a JSON string, JSON.parse will return the string itself.
                const parsedRepaired = JSON.parse(repaired);
                return parsedRepaired;
            } catch (repairError) {
                console.warn('[OpenAIAdapter] JSON repair FAILED. Returning raw content as output property.', repairError);
                return { output: contentToParse }; // Fallback
            }
        }
    }

    public static async call(params: { systemPrompt: string; userPrompt: string }): Promise<unknown> {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt }
            ],
            temperature: 0
        });

        const originalContent = response.choices[0]?.message?.content ?? '';
        return OpenAIAdapter.parseAndRepairLLMResponse(originalContent);
    }
} 