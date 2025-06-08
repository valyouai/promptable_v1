import { OpenAIAdapter } from './OpenAIAdapter';
import { DeepSeekAdapter } from '../adapters/DeepSeekAdapter';

export class LLMAdapterRouter {
    public static async call(params: { systemPrompt: string; userPrompt: string }) {
        const provider = process.env.LLM_PROVIDER || 'openai';
        console.log(`[LLMAdapterRouter] Invoking provider: ${provider}`);

        switch (provider) {
            case 'deepseek':
                // DeepSeekAdapter expects messages array, not separate systemPrompt and userPrompt
                const deepseekMessages = [
                    { role: 'system' as const, content: params.systemPrompt },
                    { role: 'user' as const, content: params.userPrompt }
                ];
                // Define a default model for DeepSeek or get from env
                const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat'; // Using a common DeepSeek model name
                console.log(`[LLMAdapterRouter] DeepSeek model: ${deepseekModel}`);
                return await DeepSeekAdapter.callChatModel({
                    model: deepseekModel,
                    messages: deepseekMessages
                });
            case 'openai':
            default:
                return await OpenAIAdapter.call(params);
        }
    }
} 