import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class OpenAIAdapter {
    public static async call(params: { systemPrompt: string; userPrompt: string }): Promise<unknown> {
        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                { role: 'system', content: params.systemPrompt },
                { role: 'user', content: params.userPrompt }
            ],
            temperature: 0
        });

        const content = response.choices[0]?.message?.content ?? '';

        try {
            return JSON.parse(content);
        } catch {
            return { output: content };
        }
    }
} 