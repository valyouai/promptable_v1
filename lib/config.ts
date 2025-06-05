import path from 'path';

// Resolved paths should be absolute from the project root.
const projectRoot = process.cwd();

export const config = {
    openai: {
        apiKey: process.env.OPENAI_API_KEY, // Note: API key itself is usually handled directly by the OpenAI client lib based on env var
        modelName: process.env.OPENAI_MODEL_NAME || 'gpt-4-turbo-preview',
    },
    uploads: {
        // Ensure the path is resolved correctly from the project root
        dirPath: process.env.UPLOADS_DIR_PATH
            ? path.resolve(projectRoot, process.env.UPLOADS_DIR_PATH)
            : path.resolve(projectRoot, 'uploads'),
    },
    // Add other configurations here as needed
};

// Validate essential configurations if necessary
if (!config.openai.apiKey && process.env.NODE_ENV !== 'test' && process.env.OPENAI_API_KEY !== 'test-key') {
    // In a real app, you might throw an error or log a more severe warning if critical config is missing
    console.warn(
        '[CONFIG] WARNING: OPENAI_API_KEY is not set. AI features may not work unless in test mode with a mock key.'
    );
} 