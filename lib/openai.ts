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
                const messages = params.messages;
                const lastMessage = messages[messages.length - 1];
                const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';

                let mockContent = '';

                if (content.includes('transform') || content.includes('contextual')) {
                    // Mock transformation response
                    mockContent = JSON.stringify({
                        principles: [
                            "Mocked: Transformed principle 1 for testing persona system",
                            "Mocked: Transformed principle 2 for content optimization"
                        ],
                        methods: [
                            "Mocked: Testing methodology for validation processes",
                            "Mocked: Iterative approach for continuous improvement"
                        ],
                        frameworks: [
                            "Mocked: Test framework for systematic validation",
                            "Mocked: Quality assurance framework for reliability"
                        ],
                        theories: [
                            "Mocked: Testing theory for predictable outcomes",
                            "Mocked: Validation theory for comprehensive coverage"
                        ]
                    });
                } else if (content.includes('system prompt') || content.includes('generate')) {
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
                        prompt_tokens: Math.floor(content.length / 4),
                        completion_tokens: Math.floor(mockContent.length / 4),
                        total_tokens: Math.floor((content.length + mockContent.length) / 4)
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
