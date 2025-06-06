This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Promptable: Research-to-Prompt Transformation Platform

## 🎯 Project Overview

Promptable is an intelligent platform designed to convert academic papers and research documents into powerful AI system prompts. It's tailored for different professional personas (Creator, Educator, Researcher), ensuring that extracted knowledge is contextually relevant and immediately actionable for various AI applications.

## ✨ Key Features Implemented (MVP)

- **Document Upload & Analysis**: Upload research papers (PDF, DOCX, TXT) for key concept extraction (principles, methods, frameworks, theories).
  - PDF processing uses `pdf2json` for reliable server-side text extraction
  - Supports multi-page documents with automatic text concatenation
  - See `docs/pdf-processing.md` for technical details
- **Context-Aware Prompt Generation**: AI-powered transformation of raw insights into persona- and content-type-specific actionable system prompts.
- **System Prompt Review & Refine**: User can review the generated prompt and request modifications.
- **Export Options**: Easily copy the generated system prompt to clipboard or download as a `.txt` file.

## 🚀 Getting Started

First, make sure you have the required environment variables set up. Create a `.env.local` file in the project root with your OpenAI API key:

```bash
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Optional, for local development
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.

### Navigating to Key Features:

- **Dashboard:** `/dashboard`
- **Persona-specific Generation Pages (e.g., for testing):**
  - Creator: `http://localhost:3000/creator/visual-content-analysis`
  - Educator: `http://localhost:3000/educator/learning-theory-implementer`
  - Researcher: `http://localhost:3000/researcher/methodology-replicator`

## 🧪 Testing

This project includes a test suite for validating core functionalities, such as the persona-based insight transformation and system prompt generation.

### Running Tests

To run the test suite, use the following command:

```bash
npm run test
```

To run all available tests, including integration tests, use:

```bash
npm run test:all
```

This command executes the test scripts defined in `package.json` using `tsx`, a TypeScript execution tool.

### OpenAI API Mocking for Tests

For tests involving interactions with the OpenAI API (specifically in `test/persona-validation.ts`), the system employs an environment-based mocking strategy to ensure tests are fast, reliable, and do not make actual API calls.

**How it works:**

1.  **Test Environment File (`.env.test`):**

    - A file named `.env.test` located in the project root is used to signal "test mode."
    - This file should contain:
      ```
      OPENAI_API_KEY=test-key
      ```
    - When this specific key-value pair is present, the application knows to use a mock OpenAI client. **Note:** You will need to create this `.env.test` file manually if it doesn't exist. It is not committed to version control for security best practices, even though `test-key` is a dummy value.

2.  **Conditional Mocking in `lib/openai.ts`:**

    - The OpenAI client initialization module (`lib/openai.ts`) checks if `OPENAI_API_KEY` is set to `test-key` (or if `NODE_ENV` is `test`).
    - If true, it exports a mock version of the OpenAI client that returns predefined, predictable responses for API calls like `chat.completions.create()`.
    - If false (e.g., in development or production), it exports the real OpenAI client, which will use the API key from your `.env.local` or other environment settings.

3.  **Test Script Configuration:**
    - The `test` script in `package.json` (`"test": "tsx --env-file .env.test test/persona-validation.ts"`) explicitly tells `tsx` to load environment variables from `.env.test` before running the tests.
    - The `test:all` script in `package.json` (`"test:all": "npm run test && npm run test:kernel-integration"`) ensures both persona validation and kernel integration tests are run using the `.env.test` configurations.

This setup ensures that `npm run test` and `npm run test:all` automatically use the mocked OpenAI client, allowing for isolated and consistent testing of your application's logic.

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## ☁️ Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
