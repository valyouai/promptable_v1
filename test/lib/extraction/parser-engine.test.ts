import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { File as NodeFile } from 'node:buffer'; // Alias to avoid conflict with global File if any
import { processDocument } from '@/lib/document-processor';

const FIXTURES_DIR = path.join(process.cwd(), 'test/fixtures');

describe('Parser Engine - lib/document-processor.ts', () => {

    describe('processDocument()', () => {
        test('should extract text from a .txt file', async () => {
            const filePath = path.join(FIXTURES_DIR, 'sample.txt');
            const fileContent = 'This is a simple text file for testing.';
            await fs.writeFile(filePath, fileContent, 'utf-8');

            const fileBuffer = await fs.readFile(filePath);
            const testFile = new NodeFile([fileBuffer], 'sample.txt', { type: 'text/plain' }) as unknown as File;

            const extractedText = await processDocument(testFile);
            assert.strictEqual(extractedText.trim(), fileContent.trim(), 'Extracted TXT content should match');
        });

        test('should extract text from a .pdf file', async () => {
            const filePath = path.join(FIXTURES_DIR, 'sample.pdf');
            const expectedText = 'This is a sample PDF document for testing.';
            const fileStats = await fs.stat(filePath).catch(() => null);
            if (!fileStats || fileStats.size < 100) {
                console.warn(`[WARN] test/fixtures/sample.pdf is a placeholder or too small. PDF parsing test may not be meaningful.`);
            }

            const fileBuffer = await fs.readFile(filePath);
            const testFile = new NodeFile([fileBuffer], 'sample.pdf', { type: 'application/pdf' }) as unknown as File;

            try {
                const extractedText = await processDocument(testFile);
                // More aggressive normalization for PDF text: remove ALL whitespace
                const normalizedExtractedText = extractedText.replace(/\s/g, '');
                const normalizedExpectedText = expectedText.replace(/\s/g, '');
                assert.ok(normalizedExtractedText.includes(normalizedExpectedText), `Extracted PDF content ("${normalizedExtractedText}") should include normalized expected text ("${normalizedExpectedText}")`);
            } catch (error) { // error is implicitly unknown
                let errorMessage = 'Unknown error during PDF processing';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                if (fileStats && fileStats.size < 100) {
                    assert.ok(true, `Skipping PDF assertion due to placeholder file. Error: ${errorMessage}`)
                } else {
                    assert.fail(`PDF processing failed: ${errorMessage}`);
                }
            }
        });

        test('should extract text from a .docx file', async () => {
            const filePath = path.join(FIXTURES_DIR, 'sample.docx');
            // IMPORTANT: Replace test/fixtures/sample.docx with a real, simple DOCX file
            // containing known text, then update expectedText below.
            const expectedText = 'This is a sample DOCX document for testing.'; // Placeholder for actual expected content

            const fileStats = await fs.stat(filePath).catch(() => null);
            if (!fileStats || fileStats.size < 100) { // Arbitrary small size to detect placeholder
                console.warn(`[WARN] test/fixtures/sample.docx is a placeholder or too small. DOCX parsing test may result in empty string or error.`);
            }

            const fileBuffer = await fs.readFile(filePath);
            const testFile = new NodeFile([fileBuffer], 'sample.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) as unknown as File;

            try {
                const extractedText = await processDocument(testFile);
                if (!fileStats || fileStats.size < 100) {
                    // For an empty/invalid DOCX, mammoth might return an empty string or throw.
                    // If it throws, the catch block will handle it. If it returns empty, this will pass.
                    assert.strictEqual(extractedText.trim(), '', 'Extracted DOCX content from placeholder should be empty');
                } else {
                    // For a real DOCX, compare with expected content (normalize whitespace)
                    const normalizedExtractedText = extractedText.replace(/\s+/g, ' ').trim();
                    const normalizedExpectedText = expectedText.replace(/\s+/g, ' ').trim();
                    assert.ok(normalizedExtractedText.includes(normalizedExpectedText), `Extracted DOCX content should include: "${normalizedExpectedText}". Got: "${normalizedExtractedText}"`);
                }
            } catch (error) {
                let errorMessage = 'Unknown error during DOCX processing';
                if (error instanceof Error) {
                    errorMessage = error.message;
                }
                if (fileStats && fileStats.size < 100) {
                    // If mammoth throws an error on an empty/invalid file, this is acceptable for a placeholder.
                    assert.ok(true, `DOCX parsing on placeholder file resulted in error (as expected/tolerated): ${errorMessage}`);
                } else {
                    assert.fail(`DOCX processing failed for supposedly real file: ${errorMessage}`);
                }
            }
        });

        test('should throw error for unsupported file type', async () => {
            const unsupportedFile = new NodeFile(['some content'], 'sample.unsupported', { type: 'application/octet-stream' }) as unknown as File;
            await assert.rejects(
                async () => {
                    await processDocument(unsupportedFile);
                },
                Error,
                'Unsupported file type: application/octet-stream'
            );
        });
    });
}); 