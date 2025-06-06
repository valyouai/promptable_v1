import { GET } from '@/app/api/extract-concepts/[documentId]/route';
import { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const TEST_DOC_ID = 'test-extract-doc';
const TEST_DOC_FILENAME = `${TEST_DOC_ID}.txt`;
const TEST_DOC_PATH = path.join(UPLOADS_DIR, TEST_DOC_FILENAME);
const TEST_DOC_CONTENT = 'This is a sample document for testing concept extraction. It contains keywords like psychology, methodology, and framework.';

describe('/api/extract-concepts/[documentId] GET handler', () => {
    before(async () => {
        // Ensure uploads directory exists and create a dummy file for testing extraction
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.writeFile(TEST_DOC_PATH, TEST_DOC_CONTENT, 'utf-8');
    });

    after(async () => {
        // Clean up the dummy file
        try {
            await fs.unlink(TEST_DOC_PATH);
        } catch {
            // Ignore if file doesn't exist (e.g., test failed before creating it)
        }
    });

    test('should return 404 if documentId does not exist', async () => {
        const nonExistentDocId = 'non-existent-id';
        const request = new NextRequest(`http://localhost/api/extract-concepts/${nonExistentDocId}`);

        const response = await GET(request, { params: Promise.resolve({ documentId: nonExistentDocId }) });
        const responseBody = await response.json();

        assert.strictEqual(response.status, 404, 'Response status should be 404');
        assert.strictEqual(responseBody.error, `Document with ID '${nonExistentDocId}' not found.`, 'Error message should match');
        assert.strictEqual(responseBody.type, 'DocumentNotFound', 'Error type should be DocumentNotFound');
    });

    test('should successfully extract concepts for a valid documentId', async () => {
        const request = new NextRequest(`http://localhost/api/extract-concepts/${TEST_DOC_ID}`);

        const response = await GET(request, { params: Promise.resolve({ documentId: TEST_DOC_ID }) });
        const responseBody = await response.json();

        assert.strictEqual(response.status, 200, 'Response status should be 200');
        assert.ok(responseBody, 'Response body should be defined');
        assert.ok(responseBody.principles, 'Response body should have principles defined');

        assert.ok(
            responseBody.principles.some((p: string) => /Mocked: Extracted principle from document text/.test(p)),
            'Principles should contain mocked principle from ExtractionEngine'
        );
        assert.ok(
            responseBody.methods.some((m: string) => /Mocked: Extracted method A from document/.test(m)),
            'Methods should contain mocked method from ExtractionEngine'
        );
        assert.ok(
            responseBody.frameworks.some((f: string) => /Mocked: Extracted framework X from document/.test(f)),
            'Frameworks should contain mocked framework from ExtractionEngine'
        );
        assert.ok(
            responseBody.theories.some((t: string) => /Mocked: Extracted theory Alpha from document/.test(t)),
            'Theories should contain mocked theory from ExtractionEngine'
        );
    });

    // TODO: Add test for documentId format validation (if any)
    // TODO: Add test for case where file exists but text extraction might have failed (e.g. empty .txt file in uploads)
}); 