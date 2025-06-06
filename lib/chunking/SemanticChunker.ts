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