import { DeepSeekAdapter } from '@/server/adapters/DeepSeekAdapter';

// Mock the global fetch function
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.Mock;

// Helper to create a mock successful response from DeepSeek
// The structure simulates the LLM response where 'content' itself is a stringified JSON an_extraction_payload.
const createMockSuccessDeepSeekResponse = (llmExtractionPayload: object) => {
    const deepSeekAPIBody = {
        choices: [
            {
                message: {
                    content: JSON.stringify(llmExtractionPayload), // llmExtractionPayload becomes a string here
                },
            },
        ],
    };
    return {
        ok: true,
        // .text() returns the stringified version of the entire DeepSeek API response body
        text: jest.fn().mockResolvedValueOnce(JSON.stringify(deepSeekAPIBody)),
        // .json() is also mocked for the first parse in DeepSeekAdapter if it were to use it (though current logic uses .text() then parses)
        json: jest.fn().mockResolvedValueOnce(deepSeekAPIBody),
    };
};

describe('DeepSeekAdapter - Phase 24 Contract Enforcement', () => {
    beforeEach(() => {
        mockFetch.mockClear();
        // process.env.DEEPSEEK_API_KEY = 'test-key'; // Ensure API key is set if adapter checks it
    });

    const mockCallParams = {
        model: 'deepseek-chat',
        messages: [{ role: 'system' as const, content: 'System Prompt' }, { role: 'user' as const, content: 'User Prompt' }],
    };

    // 1. Golden Path: Fully Valid Extraction Output
    test('should pass verification for a fully valid extraction payload', async () => {
        const validPayload = {
            principles: ['Sparse Priming', 'Latent Activation'],
            methods: ['In-context Learning', 'Knowledge Compression'],
            frameworks: ['RAG Optimization'],
            theories: ['Human Memory Models'],
        };
        mockFetch.mockResolvedValueOnce(createMockSuccessDeepSeekResponse(validPayload));

        const result = await DeepSeekAdapter.callChatModel(mockCallParams);
        // Expect the original stringified payload, as DeepSeekAdapter returns { content: stringifiedJSON }
        expect(result).toEqual({ content: JSON.stringify(validPayload) });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 2. Schema Violation: Object-In-Array Failure
    test('should reject payload with object-in-array violations', async () => {
        const invalidPayload = {
            principles: [{ "concept": "Sparse Priming" }],
            methods: ['In-context Learning'],
            frameworks: [],
            theories: [],
        };
        mockFetch.mockResolvedValueOnce(createMockSuccessDeepSeekResponse(invalidPayload));

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow(/^Phase 24 Contract Failure:.*Field 'principles' contains a non-string value/);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 3. Non-Array Field Violation
    test('should reject payload with a non-array field violation', async () => {
        const invalidPayload = {
            principles: "Sparse Priming",
            methods: [],
            frameworks: [],
            theories: [],
        };
        mockFetch.mockResolvedValueOnce(createMockSuccessDeepSeekResponse(invalidPayload));

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow(/^Phase 24 Contract Failure:.*Field 'principles' must be an array and present/);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 4. Empty Field Acceptance
    test('should correctly process and pass verification for empty arrays', async () => {
        const emptyPayload = {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };
        mockFetch.mockResolvedValueOnce(createMockSuccessDeepSeekResponse(emptyPayload));

        const result = await DeepSeekAdapter.callChatModel(mockCallParams);
        expect(result).toEqual({ content: JSON.stringify(emptyPayload) });
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    // 5. Invalid Type Coercion Edge Case (Mixed Array Types)
    test('should reject payload with mixed non-string types in an array', async () => {
        const mixedTypePayload = {
            principles: ['Sparse Priming', 42, null, { "unexpected": "value" }],
            methods: ['Valid String'],
            frameworks: [],
            theories: [],
        };
        mockFetch.mockResolvedValueOnce(createMockSuccessDeepSeekResponse(mixedTypePayload));

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow(/^Phase 24 Contract Failure:.*Field 'principles' contains a non-string value at index 1/);
        expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('should throw contract violation if LLM message content string is not valid JSON', async () => {
        const malformedContentString = "This is not JSON, it's just a plain string.";
        const deepSeekAPIBody = {
            choices: [
                {
                    message: {
                        content: malformedContentString, // Content is not a stringified JSON object
                    },
                },
            ],
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValueOnce(JSON.stringify(deepSeekAPIBody)),
            json: jest.fn().mockResolvedValueOnce(deepSeekAPIBody),
        });

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow(/^DeepSeekAdapter Contract Violation: LLM message content is not a valid JSON string/);
    });

    test('should throw error if LLM returns no content string after parsing main response', async () => {
        const deepSeekAPIBodyWithNoContent = {
            choices: [
                {
                    message: {},
                },
            ],
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValueOnce(JSON.stringify(deepSeekAPIBodyWithNoContent)),
            json: jest.fn().mockResolvedValueOnce(deepSeekAPIBodyWithNoContent),
        });

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow('No content string returned from DeepSeek after parsing.');
    });

    test('should throw error if LLM content is null', async () => {
        const deepSeekAPIBodyWithNullContent = {
            choices: [
                {
                    message: {
                        content: null, // Explicitly null content
                    },
                },
            ],
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValueOnce(JSON.stringify(deepSeekAPIBodyWithNullContent)),
            json: jest.fn().mockResolvedValueOnce(deepSeekAPIBodyWithNullContent),
        });

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow('No content string returned from DeepSeek after parsing.');
    });

    test('should throw error if choices array is missing or empty', async () => {
        const deepSeekAPIBodyNoChoices = {
            // choices property is missing
        };
        mockFetch.mockResolvedValueOnce({
            ok: true,
            text: jest.fn().mockResolvedValueOnce(JSON.stringify(deepSeekAPIBodyNoChoices)),
            json: jest.fn().mockResolvedValueOnce(deepSeekAPIBodyNoChoices),
        });

        await expect(DeepSeekAdapter.callChatModel(mockCallParams))
            .rejects
            .toThrow('No content string returned from DeepSeek after parsing.');
    });

}); 