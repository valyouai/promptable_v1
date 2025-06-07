import { OpenAIAdapter } from './OpenAIAdapter';
import { DeepSeekAdapter } from './DeepSeekAdapter';

export class LLMAdapterRouter {
    public static async call(params: { systemPrompt: string; userPrompt: string }) {
        const provider = process.env.LLM_PROVIDER || 'openai';

        switch (provider) {
            case 'deepseek':
                return await DeepSeekAdapter.call(params);
            case 'openai':
            default:
                return await OpenAIAdapter.call(params);
        }
    }
} 