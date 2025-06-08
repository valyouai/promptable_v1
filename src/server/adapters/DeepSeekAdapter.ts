// import axios from "axios"; // Removed unused import
// We reuse types from the openai package for compatibility, 
// assuming ExtractorAgent and other parts of the system are typed with these.
// If these types are not globally available or if you want to decouple completely,
// you might need to define local, structurally-compatible types.
import dotenv from "dotenv";

dotenv.config();

// Minimal interface for the expected DeepSeek API response structure for chat completions
interface DeepSeekMessage {
    content?: string | null;
    role?: string; // Optional: include if needed, but primarily focusing on content
}

interface DeepSeekChoice {
    message?: DeepSeekMessage;
    // Other fields like finish_reason could be here if needed
}

interface DeepSeekResponseData {
    choices?: DeepSeekChoice[];
    // We might also expect an 'error' field here in case of API errors not caught by HTTP status
    error?: { message?: string; type?: string; code?: string };
}

// Define the parameter structure for callChatModel as per user's Phase 12 Step 2
/* // Removing unused interface DeepSeekChatModelParams
interface DeepSeekChatModelParams {
    model: string;
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]; // Reusing OpenAI type for compatibility
    temperature?: number;
    response_format?: { type: string }; // Added response_format
    // Add other potential parameters like max_tokens, top_p if needed in the future
}
*/

export class DeepSeekAdapter {
    private static readonly apiKey = process.env.DEEPSEEK_API_KEY!;
    private static readonly baseUrl = "https://api.deepseek.com/v1";

    // Updated method signature to accept a single params object
    public static async callChatModel(params: {
        model: string;
        messages: { role: 'system' | 'user'; content: string }[];
        temperature?: number;
        response_format?: { type: string };
    }): Promise<{ content: string }> {
        const url = `${this.baseUrl}/chat/completions`;

        // FINAL CORRECT PAYLOAD CONSTRUCTION
        const payload = {
            model: params.model,
            messages: params.messages,
            temperature: params.temperature ?? 0.2,
            response_format: params.response_format ?? undefined,
        };

        console.log('[DeepSeekAdapter] Sending payload to DeepSeek:', payload); // Log the payload object directly for better inspection

        try {
            // Using fetch as per the provided final patch
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Handle HTTP errors
                const errorData = await response.text(); // Use text() to avoid JSON parsing errors if response is not JSON
                console.error(`[DeepSeekAdapter] HTTP Error: ${response.status} ${response.statusText}`, errorData);
                throw new Error(`DeepSeek API HTTP Error: ${response.status} ${response.statusText} - ${errorData}`);
            }

            const data: DeepSeekResponseData = await response.json();

            // More robust error checking for DeepSeek specific errors in response body
            if (data?.error) {
                console.error("[DeepSeekAdapter] API Error in response body:", data.error);
                throw new Error(`DeepSeek API Error: ${data.error.message || data.error.type || 'Unknown API error'}`);
            }

            const content = data?.choices?.[0]?.message?.content;
            if (content == null) { // Check for null or undefined explicitly
                console.warn("[DeepSeekAdapter] No content returned from DeepSeek. Full response data:", data);
                throw new Error('No content returned from DeepSeek.');
            }
            return { content };
        } catch (error: unknown) {
            // Unified error handling
            let descriptiveError: string;
            if (error instanceof Error) {
                descriptiveError = error.message;
            } else {
                try {
                    descriptiveError = JSON.stringify(error);
                } catch {
                    descriptiveError = "An unknown error occurred with DeepSeekAdapter (and it was not an Error instance)";
                }
            }
            console.error("[DeepSeekAdapter] Error in callChatModel:", descriptiveError);
            // Re-throw with a more specific prefix if not already a DeepSeekAdapter error
            if (error instanceof Error && error.message.startsWith('DeepSeekAdapter Error:')) {
                throw error;
            } else if (error instanceof Error && error.message.startsWith('DeepSeek API HTTP Error:')) {
                throw error;
            } else if (error instanceof Error && error.message.startsWith('DeepSeek API Error:')) {
                throw error;
            }
            else {
                throw new Error(`DeepSeekAdapter Error: ${descriptiveError}`);
            }
        }
    }
} 