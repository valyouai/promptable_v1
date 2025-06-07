import OpenAI from "openai";
import dotenv from "dotenv";

// Load environment variables (make sure .env file exists)
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

// Strict interface for response shape
export interface LLMResponse {
    content: string;
}

/**
 * OpenAIAdapter — unified interface for calling OpenAI Chat models.
 */
export class OpenAIAdapter {
    /**
     * Calls the OpenAI ChatCompletion API with the given model, messages, and temperature.
     * 
     * @param model - The model name (e.g., "gpt-4o").
     * @param messages - The chat messages array (type updated for OpenAI SDK v4+).
     * @param temperature - Sampling temperature.
     * @returns LLMResponse containing just the content string.
     */
    public static async callChatModel(
        model: string,
        messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: number = 0
    ): Promise<{ content: string }> {
        try {
            const response = await openai.chat.completions.create({
                model,
                messages,
                temperature,
                stream: false,
            });

            const content = response.choices?.[0]?.message?.content?.trim() ?? "";

            return { content };
        } catch (error) {
            console.error("OpenAIAdapter: Failed to call model:", error);
            throw error;
        }
    }
} 