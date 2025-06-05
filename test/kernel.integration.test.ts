import { ExtractionKernel } from '@/lib/extraction/ExtractionKernel';
import type { ExtractedConcepts } from '@/types';
import fs from 'fs/promises';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const TEST_DOC_ID = 'integration-test-doc';
const TEST_DOC_FILENAME = `${TEST_DOC_ID}.txt`;
const TEST_DOC_PATH = path.join(UPLOADS_DIR, TEST_DOC_FILENAME);
// This content ensures the mock in lib/openai.ts returns the structured JSON
const TEST_DOC_CONTENT = 'This document is for contextual analysis and transformation testing. It contains keywords to trigger specific mock responses for the extraction engine.';

async function runKernelIntegrationTest() {
    console.log('🚀 Starting Kernel Integration Test...');
    let testPassed = false;

    try {
        // 1. Setup: Ensure uploads directory exists and create test file
        console.log(`[SETUP] Ensuring 'uploads' directory exists at: ${UPLOADS_DIR}`);
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log(`[SETUP] Creating test file: ${TEST_DOC_PATH}`);
        await fs.writeFile(TEST_DOC_PATH, TEST_DOC_CONTENT);
        console.log(`[SETUP] Test file created with content: "${TEST_DOC_CONTENT.substring(0, 50)}..."`);

        // 2. Execute: Call ExtractionKernel.handle
        // Ensure NODE_ENV=test or OPENAI_API_KEY=test-key is set via .env.test for openai mock
        console.log(`[EXECUTE] Calling ExtractionKernel.handle with documentId: ${TEST_DOC_ID}`);
        const result: ExtractedConcepts = await ExtractionKernel.handle(TEST_DOC_ID);

        // 3. Assertions
        console.log('[ASSERT] Received result from ExtractionKernel:', JSON.stringify(result, null, 2));

        if (!result) {
            throw new Error('AssertionError: ExtractionKernel.handle returned undefined or null');
        }

        // Assert structure based on ExtractedConcepts type
        if (typeof result.principles === 'undefined' || !Array.isArray(result.principles)) throw new Error('AssertionError: Result missing or invalid principles');
        if (typeof result.methods === 'undefined' || !Array.isArray(result.methods)) throw new Error('AssertionError: Result missing or invalid methods');
        if (typeof result.frameworks === 'undefined' || !Array.isArray(result.frameworks)) throw new Error('AssertionError: Result missing or invalid frameworks');
        if (typeof result.theories === 'undefined' || !Array.isArray(result.theories)) throw new Error('AssertionError: Result missing or invalid theories');

        // Assert content based on lib/openai.ts mock for "contextual" keyword
        // The mock returns specific strings for principles and methods when triggered correctly
        if (!result.principles.some(p => typeof p === 'string' && p.startsWith('Mocked: Transformed principle'))) {
            console.error('Current principles:', result.principles)
            throw new Error('AssertionError: Principles did not match expected mock output. Ensure OPENAI_API_KEY=test-key in .env.test');
        }
        if (!result.methods.some(m => typeof m === 'string' && m.startsWith('Mocked: Testing methodology'))) {
            console.error('Current methods:', result.methods)
            throw new Error('AssertionError: Methods did not match expected mock output. Ensure OPENAI_API_KEY=test-key in .env.test');
        }

        // Check if QA agent added any issues for this clean input (it shouldn't for missing categories)
        // This is an indirect check. The console logs from ExtractionKernel will show QA results.
        // A more direct check would require ExtractionKernel to return QAValidationResult or part of it.
        console.log('[ASSERT] Assertions passed for ExtractedConcepts structure and mock content compatibility.');

        testPassed = true;

    } catch (error) {
        console.error('❌ Kernel Integration Test FAILED:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
        }
        process.exitCode = 1; // Indicate failure for CI/automation
    } finally {
        // 4. Cleanup: Delete test file
        try {
            await fs.access(TEST_DOC_PATH); // Check if file exists before unlinking
            await fs.unlink(TEST_DOC_PATH);
            console.log(`[CLEANUP] Test file deleted: ${TEST_DOC_PATH}`);
        } catch (cleanupError: unknown) {
            // If file doesn't exist, it might be because setup failed, which is fine.
            let errorMessage = 'An unknown cleanup error occurred';
            let errorCode: string | undefined = undefined;

            if (typeof cleanupError === 'object' && cleanupError !== null) {
                if ('code' in cleanupError && typeof (cleanupError as { code: unknown }).code === 'string') {
                    errorCode = (cleanupError as { code: string }).code;
                }
                if ('message' in cleanupError && typeof (cleanupError as { message: unknown }).message === 'string') {
                    errorMessage = (cleanupError as { message: string }).message;
                } else if (cleanupError instanceof Error) { // Fallback if it's a generic Error instance
                    errorMessage = cleanupError.message;
                }
            } else if (typeof cleanupError === 'string') { // Handle if the error is just a string
                errorMessage = cleanupError;
            }

            // Only log an error if it's not an ENOENT (file not found) error,
            // as ENOENT is expected if the test setup failed before creating the file.
            if (errorCode !== 'ENOENT') {
                console.error(`[CLEANUP] Error during test file cleanup: ${errorMessage}`);
            }
        }

        if (testPassed) {
            console.log('✅ Kernel Integration Test PASSED!');
        } else {
            console.log('📉 Kernel Integration Test concluded with FAILURE.');
        }
    }
}

runKernelIntegrationTest(); 