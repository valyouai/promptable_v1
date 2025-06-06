// src/server/extraction/SemanticChunker.ts

import { countTokens } from '@/lib/tokenizer';

export interface Chunk {
    chunkId: number;
    text: string;
    tokenCount: number;
}

export class SemanticChunker {
    private static readonly DEFAULT_TARGET_TOKENS = 2000;
    private static readonly MODEL_NAME = 'gpt-4o-mini'; // For tokenizer compatibility

    /**
     * Primary entrypoint: chunk full document text into semantic units.
     */
    static chunkDocument(documentText: string): Chunk[] {
        const paragraphs = documentText.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);

        const chunks: Chunk[] = [];
        let buffer = '';
        let bufferTokens = 0;

        for (const para of paragraphs) {
            const paraTokens = countTokens(para, this.MODEL_NAME);

            if (bufferTokens + paraTokens > this.DEFAULT_TARGET_TOKENS) {
                if (buffer.length > 0) {
                    chunks.push({
                        chunkId: chunks.length,
                        text: buffer,
                        tokenCount: bufferTokens
                    });
                    buffer = '';
                    bufferTokens = 0;
                }
            }

            buffer += (buffer.length > 0 ? '\n\n' : '') + para;
            bufferTokens += paraTokens;
        }

        if (buffer.length > 0) {
            chunks.push({
                chunkId: chunks.length,
                text: buffer,
                tokenCount: bufferTokens
            });
        }

        return chunks;
    }
} 