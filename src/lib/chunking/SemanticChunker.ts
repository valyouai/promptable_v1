// lib/chunking/SemanticChunker.ts

import { encodeText, countTokens, decodeTokens } from '@/lib/tokenizer';
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

// Initialize once
const nlp = winkNLP(model);
// const its = nlp.its; // Not used in this version of the chunker logic
// const as = nlp.as; // Not used in this version of the chunker logic

export type Chunk = {
    text: string;
    tokenCount: number;
};

export class SemanticChunker {
    static readonly MAX_TOKENS_PER_CHUNK = 2000;
    static readonly PARAGRAPH_TARGET_WORDS = 500;
    static readonly SENTENCE_FALLBACK_THRESHOLD = 1; // Trigger fallback if we detect only 1 paragraph

    /**
     * New method for purely token-based chunking with overlap.
     * @param fullText The entire document text.
     * @param options Configuration for chunk size, overlap, and model name for tokenizer.
     * @returns An array of Chunks.
     */
    public static chunkByTokens(
        fullText: string,
        options?: {
            chunkSizeTokens?: number;
            tokenOverlap?: number;
            modelName?: string;
        }
    ): Chunk[] {
        const chunkSize = options?.chunkSizeTokens ?? 4000;
        const overlap = options?.tokenOverlap ?? 200;
        const modelName = options?.modelName;

        if (chunkSize <= overlap) {
            throw new Error("Chunk size must be greater than token overlap.");
        }

        const allTokens = encodeText(fullText, modelName);
        const totalTokenCount = allTokens.length;

        if (totalTokenCount === 0) {
            return [];
        }

        if (totalTokenCount <= chunkSize) {
            return [{
                text: fullText, // Or decodeTokens(allTokens, modelName) for perfect consistency
                tokenCount: totalTokenCount
            }];
        }

        const chunks: Chunk[] = [];
        let currentIndex = 0;

        while (currentIndex < totalTokenCount) {
            const endIndex = Math.min(currentIndex + chunkSize, totalTokenCount);
            const chunkTokens = allTokens.slice(currentIndex, endIndex);
            const chunkText = decodeTokens(chunkTokens, modelName);

            chunks.push({
                text: chunkText,
                tokenCount: chunkTokens.length
            });

            if (endIndex === totalTokenCount) {
                break; // Reached the end of the document
            }

            currentIndex = endIndex - overlap;

            // Safety break if overlap logic pushes currentIndex negatively or causes an infinite loop
            // This condition should ideally not be met if chunkSize > overlap
            if (currentIndex + chunkSize <= endIndex && endIndex < totalTokenCount) {
                console.warn(`[SemanticChunker.chunkByTokens] Potential infinite loop detected. CurrentIndex: ${currentIndex}, EndIndex: ${endIndex}. Breaking.`);
                break;
            }
            // Ensure currentIndex does not go back beyond a point that it has already processed fully.
            // This means if the next iteration's start (currentIndex) is less than the previous iteration's start + overlap,
            // it might re-process too much or get stuck.
            // More simply, ensure progress:
            if (chunks.length > 0) {
                const previousChunkEndIndex = currentIndex + overlap; // This is the end of the previous chunk before overlap was subtracted
                if (previousChunkEndIndex >= totalTokenCount) break; // Last chunk was already processed

                // Calculate start of previously added chunk based on its end and chunksize
                // This is a bit complex, simpler to check for forward progress:
                // If the current start is not making sufficient progress past the *start* of the previous slice
                // (approximated by endIndex of current before subtracting overlap, minus chunksize)
                // This is to prevent getting stuck if overlap is too large relative to chunk progression.
                // A simpler check is if currentIndex hasn't advanced sufficiently.
                // The crucial part is endIndex - overlap must be > previous currentIndex
                // Let's consider `previousStartIndex = (endIndex of previous chunk) - chunkSize`.
                // The new `currentIndex` is `(endIndex of current chunk) - overlap`.
                // We must ensure `(endIndex of current chunk) - overlap > (endIndex of previous chunk) - chunkSize`.
                // Since `endIndex of current chunk` is roughly `(endIndex of previous chunk) - overlap + chunkSize`
                // this means `(endIndex of previous chunk) - overlap + chunkSize - overlap > (endIndex of previous chunk) - chunkSize`
                // `2 * chunkSize > 2 * overlap` which is `chunkSize > overlap`, already checked.

                // What if current chunk is small due to end of document?
                // The loop condition `currentIndex < totalTokenCount` and `endIndex === totalTokenCount` handles termination.
            }

        }
        return chunks;
    }

    public static chunkDocument(fullText: string, modelName: string): Chunk[] {
        // First attempt normal paragraph splitting
        let paragraphs = this.splitIntoParagraphs(fullText);

        // If paragraph splitting fails (only 1 giant block), fallback to sentence splitting
        if (paragraphs.length <= this.SENTENCE_FALLBACK_THRESHOLD) {
            console.warn('[SemanticChunker] Paragraph splitting ineffective, falling back to sentence-based segmentation.');

            const sentences = this.splitIntoSentences(fullText);
            paragraphs = this.groupSentencesIntoParagraphs(sentences);
        }

        const mergedParagraphs = this.greedyMergeParagraphs(paragraphs);
        const tokenChunks = this.tokenBudgetChunking(mergedParagraphs, modelName);
        return tokenChunks;
    }

    private static splitIntoParagraphs(text: string): string[] {
        const rawParagraphs = text.split(/\n\s*\n/);
        const cleaned = rawParagraphs.map(p => p.trim()).filter(p => p.length > 0);
        return cleaned;
    }

    private static splitIntoSentences(text: string): string[] {
        const doc = nlp.readDoc(text);
        const sentences = doc.sentences().out();
        // Ensure sentences are strings and trimmed, filter empty ones
        return sentences.map(s => String(s).trim()).filter(s => s.length > 0);
    }

    private static groupSentencesIntoParagraphs(sentences: string[]): string[] {
        const grouped: string[] = [];
        let buffer = '';

        for (const sentence of sentences) {
            const bufferWordCount = buffer.split(/\s+/).filter(Boolean).length;
            const sentenceWordCount = sentence.split(/\s+/).filter(Boolean).length;

            if (bufferWordCount + sentenceWordCount < this.PARAGRAPH_TARGET_WORDS) {
                buffer += (buffer ? ' ' : '') + sentence;
            } else {
                if (buffer) grouped.push(buffer);
                buffer = sentence;
            }
        }

        if (buffer) grouped.push(buffer);
        return grouped;
    }

    private static greedyMergeParagraphs(paragraphs: string[]): string[] {
        const merged: string[] = [];
        let buffer = '';

        for (const para of paragraphs) {
            const wordCount = buffer.split(/\s+/).filter(Boolean).length;
            const paraWordCount = para.split(/\s+/).filter(Boolean).length;

            if (wordCount + paraWordCount < this.PARAGRAPH_TARGET_WORDS) {
                buffer += (buffer ? '\n\n' : '') + para;
            } else {
                if (buffer) merged.push(buffer);
                buffer = para;
            }
        }
        if (buffer) merged.push(buffer);
        return merged;
    }

    private static tokenBudgetChunking(paragraphs: string[], modelName: string): Chunk[] {
        const chunks: Chunk[] = [];
        let buffer: string[] = [];

        for (const para of paragraphs) {
            buffer.push(para);
            const combinedText = buffer.join('\n\n');
            const tokenCount = countTokens(combinedText, modelName);

            if (tokenCount > this.MAX_TOKENS_PER_CHUNK) {
                // Back off, flush previous buffer as chunk
                buffer.pop();
                if (buffer.length > 0) {
                    const flushedText = buffer.join('\n\n');
                    chunks.push({
                        text: flushedText,
                        tokenCount: countTokens(flushedText, modelName),
                    });
                    buffer = [para];
                }

                // If single paragraph is still too big, hard truncate
                const singleParaTokens = countTokens(para, modelName);
                if (singleParaTokens > this.MAX_TOKENS_PER_CHUNK) {
                    const encoded = encodeText(para, modelName);
                    const sliced = encoded.slice(0, this.MAX_TOKENS_PER_CHUNK);
                    const decoded = decodeTokens(sliced, modelName);
                    console.warn(`[SemanticChunker] A merged block with ${singleParaTokens} tokens exceeds max chunk size of ${this.MAX_TOKENS_PER_CHUNK}. Truncating.`);
                    chunks.push({
                        text: decoded,
                        tokenCount: this.MAX_TOKENS_PER_CHUNK,
                    });
                    buffer = [];
                }
            }
        }

        if (buffer.length > 0) {
            const finalText = buffer.join('\n\n');
            chunks.push({ text: finalText, tokenCount: countTokens(finalText, modelName) });
        }

        return chunks;
    }
}