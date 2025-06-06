import OpenAI from 'openai';

// Check if we're in test mode
const isTestMode = process.env.NODE_ENV === 'test' || process.env.OPENAI_API_KEY === 'test-key';

// Mock OpenAI client for testing
const mockOpenAI = {
    chat: {
        completions: {
            create: async (params: OpenAI.Chat.Completions.ChatCompletionCreateParams): Promise<OpenAI.Chat.Completions.ChatCompletion> => {
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 10));

                // Generate mock response based on request content
                const systemMessageContent = params.messages.find(msg => msg.role === 'system')?.content || '';
                const userMessages = params.messages.filter(msg => msg.role === 'user');
                const lastUserMessage = userMessages[userMessages.length - 1];
                const userContent = typeof lastUserMessage?.content === 'string' ? lastUserMessage.content : '';

                let mockContent = '';
                const isExtractionPrompt = typeof systemMessageContent === 'string' && systemMessageContent.includes('expert academic researcher') && systemMessageContent.includes('extract key concepts');

                if (isExtractionPrompt) {
                    // Mock response for ExtractionEngine.extract
                    mockContent = JSON.stringify({
                        principles: [
                            "Mocked: Extracted principle from document text",
                            "Mocked: Another extracted principle from document"
                        ],
                        methods: [
                            "Mocked: Extracted method A from document",
                            "Mocked: Extracted method B from document"
                        ],
                        frameworks: [
                            "Mocked: Extracted framework X from document"
                        ],
                        theories: [
                            "Mocked: Extracted theory Alpha from document"
                        ]
                    });
                } else if (userContent.includes('transform') || userContent.includes('contextual')) {
                    // Check if the prompt string indicates empty raw concepts for transformation.
                    const emptyConceptsPromptPattern = /### Principles\\s*### Methods\\s*### Frameworks\\s*### Theories\\s*Return ONLY a valid JSON object/;
                    const areConceptsEmptyInPrompt = emptyConceptsPromptPattern.test(userContent);

                    if (areConceptsEmptyInPrompt) {
                        mockContent = JSON.stringify({
                            principles: [],
                            methods: [],
                            frameworks: [],
                            theories: []
                        });
                    } else {
                        // Original mock response for non-empty concepts transformation, updated to TransformedConceptItem structure
                        mockContent = JSON.stringify({
                            principles: [
                                { raw_insight: "Raw principle 1", transformed_insight: "Mocked: Transformed principle 1 for testing persona system" },
                                { raw_insight: "Raw principle 2", transformed_insight: "Mocked: Transformed principle 2 for content optimization" }
                            ],
                            methods: [
                                { raw_insight: "Raw method 1", transformed_insight: "Mocked: Testing methodology for validation processes" },
                                { raw_insight: "Raw method 2", transformed_insight: "Mocked: Iterative approach for continuous improvement" }
                            ],
                            frameworks: [
                                { raw_insight: "Raw framework 1", transformed_insight: "Mocked: Test framework for systematic validation" },
                                { raw_insight: "Raw framework 2", transformed_insight: "Mocked: Quality assurance framework for reliability" }
                            ],
                            theories: [
                                { raw_insight: "Raw theory 1", transformed_insight: "Mocked: Testing theory for predictable outcomes" },
                                { raw_insight: "Raw theory 2", transformed_insight: "Mocked: Validation theory for comprehensive coverage" }
                            ]
                        });
                    }
                } else if (userContent.includes('system prompt') || userContent.includes('generate')) {
                    // Mock system prompt response
                    mockContent = `# Mocked System Prompt

You are a specialized assistant for testing purposes.

## Role and Expertise
- Provide consistent responses for automated testing
- Support persona-based content generation validation
- Maintain predictable behavior patterns

## Instructions
- Focus on the specified persona characteristics
- Generate content appropriate to the requested type
- Ensure responses are structured and comprehensive

This is a mock system prompt generated for testing the persona validation system.`;
                } else {
                    mockContent = "Mock response for testing purposes.";
                }

                return {
                    id: `mock-${Date.now()}`,
                    object: 'chat.completion',
                    created: Math.floor(Date.now() / 1000),
                    model: params.model || 'gpt-4',
                    choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: mockContent,
                            refusal: null
                        },
                        logprobs: null,
                        finish_reason: 'stop'
                    }],
                    usage: {
                        prompt_tokens: Math.floor(userContent.length / 4),
                        completion_tokens: Math.floor(mockContent.length / 4),
                        total_tokens: Math.floor((userContent.length + mockContent.length) / 4)
                    }
                };
            }
        }
    }
};

// Export the appropriate client
const openaiClient: OpenAI = isTestMode ? mockOpenAI as unknown as OpenAI : new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export default openaiClient;
