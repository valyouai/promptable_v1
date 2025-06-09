// import axios from "axios"; // Removed unused import
// We reuse types from the openai package for compatibility, 
// assuming ExtractorAgent and other parts of the system are typed with these.
// If these types are not globally available or if you want to decouple completely,
// you might need to define local, structurally-compatible types.
import dotenv from "dotenv";
import { LLMOutputContractManager } from "../llm/extraction/LLMOutputContractManager";
import { stripMarkdownWrappers } from "../llm/parsers/LLMExtractionSanitizer";
import { jsonrepair } from 'jsonrepair'; // Import jsonrepair

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

        console.log('[DeepSeekAdapter] Sending payload to DeepSeek:', JSON.stringify(payload, null, 2));

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

            // It's safer to get the raw text first, then try to parse and verify.
            // This way, if parsing itself fails before verification, we can handle it.
            const responseBodyText = await response.text();
            let parsedDataForVerification: unknown;

            try {
                parsedDataForVerification = JSON.parse(responseBodyText);
            } catch (parseError: unknown) {
                console.error("[DeepSeekAdapter] Failed to parse LLM response as JSON. Raw text:", responseBodyText, "Parse error:", parseError);
                throw new Error(`DeepSeekAdapter Error: Failed to parse LLM response as JSON. Details: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }

            // Now, parsedDataForVerification is the result of JSON.parse(responseBodyText)
            // We need to extract the actual message content for verification, assuming it follows DeepSeekResponseData structure.
            const choices = (parsedDataForVerification as DeepSeekResponseData)?.choices;
            const messageContentString = choices?.[0]?.message?.content;

            if (messageContentString == null) {
                console.warn("[DeepSeekAdapter] No content string returned from DeepSeek after parsing. Full parsed data:", parsedDataForVerification);
                throw new Error('No content string returned from DeepSeek after parsing.');
            }

            // --- Phase 24 Contract Enforcement --- 
            // Ensure markdown wrappers are stripped and then JSON is repaired before attempting final JSON parse
            const cleanedContentString = stripMarkdownWrappers(messageContentString as string);

            let parsedContentForVerification: unknown;
            try {
                // Attempt to repair the cleaned string first
                const repairedContentString = jsonrepair(cleanedContentString);
                parsedContentForVerification = JSON.parse(repairedContentString);
            } catch (contentParseError: unknown) {
                console.error("[DeepSeekAdapter] Failed to parse or repair the message content string as JSON. Content string:", cleanedContentString, "Parse error:", contentParseError);
                // This means the LLM returned a 'content' that isn't a valid JSON string, violating the contract at a basic level.
                throw new Error(`DeepSeekAdapter Contract Violation: LLM message content is not a valid JSON string. Error: ${contentParseError instanceof Error ? contentParseError.message : String(contentParseError)}`);
            }

            try {
                LLMOutputContractManager.verifyExtractionPayload(parsedContentForVerification);
                // If verify passes, it means messageContentString is a string that represents a valid ExtractionContract.
                // The adapter's contract is to return { content: string }, so we return the original messageContentString.
                console.log("[DeepSeekAdapter] Phase 24 Contract Verification Successful for LLM output (via Manager).");
            } catch (verificationError: unknown) {
                console.error("[DeepSeekAdapter] [Phase 24 Contract Failure] LLM output failed schema verification (via Manager).",
                    "Content string:", messageContentString,
                    "Verification error:", verificationError);
                // Re-throw the specific verification error. It will be caught by the outer catch block.
                if (verificationError instanceof Error) {
                    throw new Error(`Phase 24 Contract Failure: ${verificationError.message}`);
                }
                throw new Error(`Phase 24 Contract Failure: An unknown verification error occurred.`);
            }
            // --- End Phase 24 Contract Enforcement ---

            // If verification passed, return the original content string that was successfully parsed and verified.
            return { content: messageContentString };

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
            if (error instanceof Error && error.message.startsWith('Phase 24 Contract Failure:')) {
                throw error; // Preserve the specific contract failure message
            }
            if (error instanceof Error && error.message.startsWith('DeepSeekAdapter Contract Violation:')) {
                throw error; // Preserve specific content parse failure message
            }
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