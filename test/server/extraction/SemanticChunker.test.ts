import { SemanticChunker, Chunk } from '@/server/extraction/SemanticChunker';
import { countTokens } from '@/lib/tokenizer'; // Assuming this is the actual path

// Mock the tokenizer to control token counts for testing
jest.mock('@/lib/tokenizer', () => ({
    countTokens: jest.fn((text: string) => {
        // Simple mock: 1 token per word (split by space)
        // In a real scenario, this would be more complex or you might use actual token counts for known strings.
        if (!text) return 0;
        return text.split(' ').length;
    }),
    // encodeText and decodeTokens are not used by SemanticChunker, so no need to mock if not imported there.
}));

describe('SemanticChunker', () => {
    // Reset mock before each test if necessary, though countTokens is stateless here
    beforeEach(() => {
        // Clear mock call counts if you need to assert number of calls, etc.
        (countTokens as jest.Mock).mockClear();
        // Reset to default mock implementation if it was changed in a test
        (countTokens as jest.Mock).mockImplementation((text: string) => {
            if (!text) return 0;
            return text.split(' ').length;
        });
    });

    const MODEL_NAME = 'gpt-4o-mini'; // Matches SemanticChunker's internal model name for consistency

    it('should return an empty array for an empty document', () => {
        const documentText = '';
        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);
        expect(chunks).toEqual([]);
        expect(countTokens).toHaveBeenCalledTimes(0); // No paragraphs to count
    });

    it('should return a single chunk if document is small', () => {
        const documentText = 'This is a short document.\n\nIt has two paragraphs.';
        // Mocking token counts: "This is a short document." -> 5 tokens, "It has two paragraphs." -> 5 tokens
        // Total = 10 tokens, DEFAULT_TARGET_TOKENS = 2000
        (countTokens as jest.Mock)
            .mockImplementationOnce(() => 5) // First paragraph
            .mockImplementationOnce(() => 5); // Second paragraph

        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);

        expect(chunks).toHaveLength(1);
        expect(chunks[0].text).toEqual('This is a short document.\n\nIt has two paragraphs.');
        expect(chunks[0].chunkId).toBe(0);
        expect(chunks[0].tokenCount).toBe(10); // 5 (para1) + 5 (para2)
        expect(countTokens).toHaveBeenCalledWith('This is a short document.', MODEL_NAME);
        expect(countTokens).toHaveBeenCalledWith('It has two paragraphs.', MODEL_NAME);
    });

    it('should split document into multiple chunks based on DEFAULT_TARGET_TOKENS', () => {
        // Let's assume DEFAULT_TARGET_TOKENS is 20 for this test's mock
        // We'll override the class's constant for this test's scope or use a mock that respects a smaller limit.
        // For simplicity here, we'll make our paragraphs "require" more tokens.

        const para1 = 'Paragraph one has quite a few words, making it a substantial piece of text.'; // 13 words/tokens
        const para2 = 'Paragraph two is shorter but still adds to the total token count significantly.'; // 12 words/tokens
        const para3 = 'Paragraph three pushes us over the default limit if we are targeting small chunks.'; // 13 words/tokens
        const para4 = 'A final short paragraph to complete a second chunk.'; // 9 words/tokens

        const documentText = [para1, para2, para3, para4].join('\n\n');

        // Mocking countTokens:
        // para1 = 13, para2 = 12, para3 = 13, para4 = 9
        // DEFAULT_TARGET_TOKENS in SemanticChunker is 2000.
        // For this test, let's test the logic for how it groups, assuming countTokens works.
        // To test splitting, we need a scenario where bufferTokens + paraTokens > DEFAULT_TARGET_TOKENS.
        // Let's assume DEFAULT_TARGET_TOKENS = 2000.
        // Let's make paragraph 1 have 1000 tokens, paragraph 2 have 1000 tokens, paragraph 3 have 1000 tokens.

        (countTokens as jest.Mock)
            .mockReturnValueOnce(1000) // para1
            .mockReturnValueOnce(800)  // para2. buffer = 1000. 1000+800=1800. Still under 2000.
            .mockReturnValueOnce(300)  // para3. buffer = 1800. 1800+300=2100. Over 2000. Chunk 1 is para1+para2. New buffer is para3.
            .mockReturnValueOnce(100); // para4. buffer = 300. 300+100=400. Chunk 2 is para3+para4.


        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);

        expect(chunks).toHaveLength(2);

        // Chunk 1: para1 + para2
        expect(chunks[0].text).toBe(`${para1}\n\n${para2}`);
        expect(chunks[0].tokenCount).toBe(1000 + 800);
        expect(chunks[0].chunkId).toBe(0);

        // Chunk 2: para3 + para4
        expect(chunks[1].text).toBe(`${para3}\n\n${para4}`);
        expect(chunks[1].tokenCount).toBe(300 + 100);
        expect(chunks[1].chunkId).toBe(1);

        expect(countTokens).toHaveBeenCalledTimes(4);
    });

    it('should handle paragraphs with leading/trailing whitespace and filter empty paragraphs', () => {
        const documentText = '  Leading and trailing spaces.  \n\n\n  Another paragraph.  \n\n';
        // Mocking: "Leading and trailing spaces." -> 5 tokens. "Another paragraph." -> 2 tokens
        (countTokens as jest.Mock)
            .mockReturnValueOnce(5)
            .mockReturnValueOnce(2);

        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].text).toBe('Leading and trailing spaces.\n\nAnother paragraph.');
        expect(chunks[0].tokenCount).toBe(7);
        expect(countTokens).toHaveBeenCalledWith('Leading and trailing spaces.', MODEL_NAME);
        expect(countTokens).toHaveBeenCalledWith('Another paragraph.', MODEL_NAME);
    });

    it('should create a chunk for a single large paragraph if it alone is under the token limit', () => {
        const largeParagraph = 'This is a single large paragraph that is under the token limit.'; // 12 tokens
        (countTokens as jest.Mock).mockReturnValueOnce(1200); // Assume it's 1200 tokens < 2000

        const chunks: Chunk[] = SemanticChunker.chunkDocument(largeParagraph);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].text).toBe(largeParagraph);
        expect(chunks[0].tokenCount).toBe(1200);
        expect(chunks[0].chunkId).toBe(0);
        expect(countTokens).toHaveBeenCalledWith(largeParagraph, MODEL_NAME);
    });

    it('should correctly handle a document where the first paragraph itself exceeds DEFAULT_TARGET_TOKENS', () => {
        // The current logic adds a paragraph to the buffer as long as buffer is empty,
        // or if buffer + paragraph <= limit.
        // If a single paragraph is larger than the limit, it will become its own chunk.
        const veryLargePara = 'This single paragraph is extremely long and definitely exceeds our target token count of 2000 all by itself it just keeps going on and on and on and on and on.';
        const nextPara = 'This is a much smaller paragraph that should be in the next chunk or with the large one if policy changes.';

        (countTokens as jest.Mock)
            .mockReturnValueOnce(2500) // veryLargePara, exceeds 2000
            .mockReturnValueOnce(100);  // nextPara

        // Expected behavior:
        // 1. veryLargePara (2500 tokens) processed.
        // 2. buffer is empty. bufferTokens (0) + paraTokens (2500) > 2000.
        // 3. Since buffer was empty, it does NOT push an empty chunk.
        // 4. veryLargePara is added to buffer. buffer = veryLargePara, bufferTokens = 2500.
        // 5. Loop ends (or next para).
        // 6. nextPara (100 tokens) processed.
        // 7. bufferTokens (2500) + paraTokens (100) > 2000.
        // 8. buffer (veryLargePara) is pushed as a chunk. chunks = [{ text: veryLargePara, tokenCount: 2500 }]
        // 9. buffer becomes nextPara. bufferTokens = 100.
        // 10. Loop ends.
        // 11. Final buffer (nextPara) is pushed. chunks = [..., { text: nextPara, tokenCount: 100 }]

        const chunks: Chunk[] = SemanticChunker.chunkDocument(`${veryLargePara}\n\n${nextPara}`);

        expect(chunks).toHaveLength(2);
        expect(chunks[0].text).toBe(veryLargePara);
        expect(chunks[0].tokenCount).toBe(2500); // Chunk contains the oversized paragraph
        expect(chunks[0].chunkId).toBe(0);

        expect(chunks[1].text).toBe(nextPara);
        expect(chunks[1].tokenCount).toBe(100);
        expect(chunks[1].chunkId).toBe(1);

        expect(countTokens).toHaveBeenCalledTimes(2);
    });

    it('should handle text with only newlines gracefully', () => {
        const documentText = '\n\n\n\n';
        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);
        expect(chunks).toEqual([]);
        expect(countTokens).toHaveBeenCalledTimes(0);
    });

    it('should handle text with mixed newlines and spaces, resulting in filtered out empty paragraphs', () => {
        const documentText = 'First paragraph.\n\n   \n\nSecond paragraph.';
        (countTokens as jest.Mock)
            .mockReturnValueOnce(2) // "First paragraph."
            .mockReturnValueOnce(2); // "Second paragraph."

        const chunks: Chunk[] = SemanticChunker.chunkDocument(documentText);
        expect(chunks).toHaveLength(1);
        expect(chunks[0].text).toEqual('First paragraph.\n\nSecond paragraph.');
        expect(chunks[0].tokenCount).toBe(4);
        expect(countTokens).toHaveBeenCalledWith('First paragraph.', MODEL_NAME);
        expect(countTokens).toHaveBeenCalledWith('Second paragraph.', MODEL_NAME);
    });

}); 