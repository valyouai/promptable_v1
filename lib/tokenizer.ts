import tiktoken from 'tiktoken-node';

// Define the specific encoding names supported by tiktoken-node
export type TiktokenNodeEncoding = "cl100k_base" | "gpt2" | "r50k_base" | "p50k_base" | "p50k_edit";

// Interface for the encoder object returned by tiktoken-node
interface TiktokenEncoder {
    encode: (text: string) => number[];
    decode: (tokens: number[]) => string;
    // name?: string; // The actual encoder object might have other properties like a name
}

// Exportable mapping for system-wide use
export const ModelToEncodingMap: Record<string, TiktokenNodeEncoding> = {
    "gpt-4": "cl100k_base",
    "gpt-4-turbo": "cl100k_base",
    "gpt-4-turbo-preview": "cl100k_base",
    "gpt-4o": "cl100k_base",
    "gpt-4o-mini": "cl100k_base",
    "gpt-3.5-turbo": "cl100k_base",
    "text-davinci-003": "p50k_base",
    // Add future models here
};

const DEFAULT_ENCODING_NAME: TiktokenNodeEncoding = "cl100k_base";

// Cache for storing initialized encoder instances
const encoderCache: { [key: string]: TiktokenEncoder } = {};

/**
 * Retrieves a tiktoken encoding instance from tiktoken-node.
 * Uses a cache to avoid re-instantiating encoders.
 * Attempts to use encodingForModel if modelName is provided.
 * Otherwise, falls back to getEncoding with a mapped or default encoding name.
 *
 * @param modelName - Optional. The name of the OpenAI model.
 * @returns A tiktoken encoding instance conforming to TiktokenEncoder.
 */
export function getTiktokenEncoding(modelName?: string): TiktokenEncoder {
    const cacheKey = modelName || DEFAULT_ENCODING_NAME;

    if (encoderCache[cacheKey]) {
        // console.log(`[Tokenizer] Returning cached encoder for "${cacheKey}".`);
        return encoderCache[cacheKey];
    }

    let encoding: TiktokenEncoder | undefined;
    if (modelName) {
        try {
            // tiktoken.encodingForModel should return an object compatible with TiktokenEncoder
            encoding = tiktoken.encodingForModel(modelName) as TiktokenEncoder;
            console.log(`[Tokenizer] Successfully got and cached encoding for model "${modelName}" via encodingForModel.`);
        } catch (modelError) {
            console.warn(`[Tokenizer] encodingForModel failed for "${modelName}" (Error: ${modelError}). Trying mapped encoding name.`);
            // Fall through to use mapped encoding name via getEncoding
        }
    }

    if (!encoding) {
        let encodingNameFromMap: TiktokenNodeEncoding = DEFAULT_ENCODING_NAME;
        if (modelName && ModelToEncodingMap[modelName]) {
            encodingNameFromMap = ModelToEncodingMap[modelName];
            console.log(`[Tokenizer] Using mapped encoding name "${encodingNameFromMap}" for model "${modelName}".`);
        } else if (modelName) {
            console.warn(`[Tokenizer] Model "${modelName}" not in ModelToEncodingMap. Using default encoding "${DEFAULT_ENCODING_NAME}".`);
        }
        // If modelName was null/undefined, encodingNameFromMap is already DEFAULT_ENCODING_NAME

        const finalEncodingName = encodingNameFromMap;

        try {
            // tiktoken.getEncoding should return an object compatible with TiktokenEncoder
            encoding = tiktoken.getEncoding(finalEncodingName) as TiktokenEncoder;
            console.log(`[Tokenizer] Successfully got and cached encoding "${finalEncodingName}" via getEncoding.`);
        } catch (encodingError) {
            console.error(`[Tokenizer] Fatal: Failed to get encoding "${finalEncodingName}" via getEncoding (Error: ${encodingError}). Falling back to hardcoded default "${DEFAULT_ENCODING_NAME}".`);
            encoding = tiktoken.getEncoding(DEFAULT_ENCODING_NAME) as TiktokenEncoder; // Final fallback
            console.log(`[Tokenizer] Cached fallback encoding "${DEFAULT_ENCODING_NAME}".`);
        }
    }

    encoderCache[cacheKey] = encoding;
    return encoding;
}

/**
 * Encodes text using the specified model's encoding (or a default).
 * @param text The text to encode.
 * @param modelName Optional. The name of the OpenAI model.
 * @returns An array of tokens (number[]).
 */
export function encodeText(text: string, modelName?: string): number[] {
    const encoding = getTiktokenEncoding(modelName);
    return encoding.encode(text);
}

/**
 * Decodes tokens using the specified model's encoding (or a default).
 * @param tokens The tokens to decode (number[]).
 * @param modelName Optional. The name of the OpenAI model.
 * @returns The decoded string.
 */
export function decodeTokens(tokens: number[], modelName?: string): string {
    const encoding = getTiktokenEncoding(modelName);
    return encoding.decode(tokens);
}

/**
 * Counts tokens in a text string using the specified model's encoding (or a default).
 * @param text The text to count tokens for.
 * @param modelName Optional. The name of the OpenAI model.
 * @returns The number of tokens.
 */
export function countTokens(text: string, modelName?: string): number {
    const encoding = getTiktokenEncoding(modelName);
    const tokens = encoding.encode(text);
    return tokens.length;
} 