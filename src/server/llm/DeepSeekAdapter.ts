export class DeepSeekAdapter {
    public static async call(params: { systemPrompt: string; userPrompt: string }): Promise<unknown> {
        // Implementation for DeepSeek API call will go here
        console.log('DeepSeekAdapter called with:', params);
        // Placeholder response
        return { message: 'DeepSeekAdapter not yet implemented' };
    }
} 