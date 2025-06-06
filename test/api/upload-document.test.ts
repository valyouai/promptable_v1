import { POST } from '@/app/api/upload-document/route';
import fs from 'fs/promises';
import path from 'path';
import { describe, test, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { File as NodeFile } from 'node:buffer';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const FIXTURES_DIR = path.join(process.cwd(), 'test/fixtures');

describe('/api/upload-document POST handler', () => {
    before(async () => {
        // Ensure uploads directory exists for testing
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        // Create fixtures directory if it doesn't exist
        await fs.mkdir(FIXTURES_DIR, { recursive: true });
    });

    afterEach(async () => {
        // Clean up uploads directory after each test if necessary,
        // or specific files created during tests.
    });

    after(async () => {
        // Potentially clean up the entire uploads directory if it was solely for testing.
    });

    test('should return 400 if no file is uploaded', async () => {
        const formData = new FormData(); // No file added to FormData
        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 400, 'Response status should be 400');
        assert.strictEqual(responseBody.error, 'No file uploaded.', 'Error message should match');
    });

    test('should successfully upload a .txt file', async () => {
        const fixturePath = path.join(FIXTURES_DIR, 'sample.txt');
        // Ensure the fixture file has the expected content for consistent testing
        const expectedTextContent = 'This is a simple text file for testing.';
        await fs.writeFile(fixturePath, expectedTextContent, 'utf-8');

        const fileBuffer = await fs.readFile(fixturePath);
        const testFile = new NodeFile([fileBuffer], 'sample.txt', { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', testFile as unknown as globalThis.File); // Cast for FormData compatibility

        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 200, 'Response status should be 200 for TXT upload');
        assert.ok(responseBody.documentId, 'Response should contain a documentId');
        assert.strictEqual(responseBody.message, 'File uploaded and processed successfully!', 'Success message not as expected');
        assert.strictEqual(responseBody.extractedText, expectedTextContent, 'Extracted text in response should match fixture');

        // Verify file was saved in uploads directory
        const uploadedFilePath = path.join(UPLOADS_DIR, `${responseBody.documentId}.txt`);
        let fileExists = false;
        try {
            await fs.access(uploadedFilePath);
            fileExists = true;
        } catch {
            // file does not exist
        }
        assert.ok(fileExists, `Uploaded file ${uploadedFilePath} should exist`);

        // Verify content of the saved file
        if (fileExists) {
            const savedFileContent = await fs.readFile(uploadedFilePath, 'utf-8');
            assert.strictEqual(savedFileContent, expectedTextContent, 'Content of saved file should match original');
            // Cleanup: Delete the uploaded file
            await fs.unlink(uploadedFilePath);
        }
    });

    test('should successfully upload a .pdf file', async () => {
        const fixturePath = path.join(FIXTURES_DIR, 'sample.pdf');
        // This is the expected text as extracted by pdf2json, which might have varied spacing.
        // We know from parser-engine.test.ts that the normalized (no spaces) version matches.
        // The API will return and save the text with whatever spacing pdf2json provides.
        // For simplicity in this API test, we'll fetch it and assume the parser-engine.test.ts guarantees its core content.
        // Let's assume the actual content of the PDF is "This is a sample PDF document for testing."
        // The processDocument will extract it, possibly with extra spaces that parser-engine.test.ts handles by normalization.
        // The API route directly returns and saves this potentially un-normalized (but whitespace-trimmed) text.
        const expectedTextAfterParsing = "This is a sample PDF document for testing."; // Based on fixture content
        // We need to ensure the sample.pdf actually contains this text. This test assumes it does.

        const fileBuffer = await fs.readFile(fixturePath);
        const testFile = new NodeFile([fileBuffer], 'sample.pdf', { type: 'application/pdf' });

        const formData = new FormData();
        formData.append('file', testFile as unknown as globalThis.File);

        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 200, 'Response status should be 200 for PDF upload');
        assert.ok(responseBody.documentId, 'Response should contain a documentId for PDF upload');
        assert.strictEqual(responseBody.message, 'File uploaded and processed successfully!', 'Success message not as expected for PDF');

        // Compare normalized versions for robustness against minor spacing differences from pdf2json
        const normalize = (text: string) => text.replace(/\s/g, '');
        assert.strictEqual(normalize(responseBody.extractedText), normalize(expectedTextAfterParsing), 'Extracted text in response does not match expected for PDF after normalization');

        const uploadedFilePath = path.join(UPLOADS_DIR, `${responseBody.documentId}.txt`);
        let fileExists = false;
        try {
            await fs.access(uploadedFilePath);
            fileExists = true;
        } catch { }
        assert.ok(fileExists, `Uploaded PDF (as .txt) ${uploadedFilePath} should exist`);

        if (fileExists) {
            const savedFileContent = await fs.readFile(uploadedFilePath, 'utf-8');
            assert.strictEqual(normalize(savedFileContent), normalize(expectedTextAfterParsing), 'Content of saved PDF (as .txt) does not match expected after normalization');
            await fs.unlink(uploadedFilePath);
        }
    });

    test('should successfully upload a .docx file', async () => {
        const fixturePath = path.join(FIXTURES_DIR, 'sample.docx');
        const expectedTextContent = 'This is a sample DOCX document for testing.'; // Based on fixture content
        // Ensure sample.docx fixture actually contains this text.

        const fileBuffer = await fs.readFile(fixturePath);
        const testFile = new NodeFile([fileBuffer], 'sample.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

        const formData = new FormData();
        formData.append('file', testFile as unknown as globalThis.File);

        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 200, 'Response status should be 200 for DOCX upload');
        assert.ok(responseBody.documentId, 'Response should contain a documentId for DOCX upload');
        assert.strictEqual(responseBody.message, 'File uploaded and processed successfully!', 'Success message not as expected for DOCX');

        // Mammoth is generally quite clean with spacing, but a simple trim is good.
        assert.strictEqual(responseBody.extractedText.trim(), expectedTextContent.trim(), 'Extracted text in response does not match expected for DOCX');

        const uploadedFilePath = path.join(UPLOADS_DIR, `${responseBody.documentId}.txt`);
        let fileExists = false;
        try {
            await fs.access(uploadedFilePath);
            fileExists = true;
        } catch { }
        assert.ok(fileExists, `Uploaded DOCX (as .txt) ${uploadedFilePath} should exist`);

        if (fileExists) {
            const savedFileContent = await fs.readFile(uploadedFilePath, 'utf-8');
            assert.strictEqual(savedFileContent.trim(), expectedTextContent.trim(), 'Content of saved DOCX (as .txt) does not match expected');
            await fs.unlink(uploadedFilePath);
        }
    });

    test('should reject unsupported file type', async () => {
        const fixturePath = path.join(FIXTURES_DIR, 'sample.unsupported');
        const fileBuffer = await fs.readFile(fixturePath);
        // Use a generic unsupported MIME type
        const testFile = new NodeFile([fileBuffer], 'sample.unsupported', { type: 'application/octet-stream' });

        const formData = new FormData();
        formData.append('file', testFile as unknown as globalThis.File);

        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 400, 'Response status should be 400 for unsupported file type');
        assert.strictEqual(responseBody.error, 'Unsupported file type.', 'Error message for unsupported file type not as expected');
    });

    test('should reject empty (0KB) .txt file', async () => {
        const fixturePath = path.join(FIXTURES_DIR, 'empty.txt');
        const fileBuffer = await fs.readFile(fixturePath); // Reads an empty buffer
        assert.strictEqual(fileBuffer.length, 0, 'Fixture empty.txt should be 0 bytes');

        const testFile = new NodeFile([fileBuffer], 'empty.txt', { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', testFile as unknown as globalThis.File);

        const request = new Request('http://localhost/api/upload-document', {
            method: 'POST',
            body: formData,
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 400, 'Response status should be 400 for empty file');
        assert.strictEqual(responseBody.error, 'File is empty and cannot be processed.', 'Error message for empty file not as expected');
    });

    // TODO: Add test for 0KB file upload

    // Example structure for a file upload test (will need actual file handling)
    // test('should successfully upload a TXT file', async () => {
    //     const filePath = path.join(process.cwd(), 'test/fixtures/sample.txt');
    //     const fileContent = 'This is a sample text file.';
    //     // Create a dummy file in fixtures
    //     await fs.writeFile(filePath, fileContent);
    //
    //     const file = new File([fileContent], 'sample.txt', { type: 'text/plain' });
    //     const formData = new FormData();
    //     formData.append('file', file);
    //
    //     const request = new Request('http://localhost/api/upload-document', {
    //         method: 'POST',
    //         body: formData,
    //     });
    //
    //     const response = await POST(request);
    //     const responseBody = await response.json();
    //
    //     assert.strictEqual(response.status, 200, 'Response status should be 200');
    //     assert.ok(responseBody.documentId, 'Document ID should be defined');
    //     assert.strictEqual(responseBody.message, 'File uploaded and processed successfully!', 'Success message should match');
    //
    //     // Verify file exists in uploads (using documentId from response)
    //     const uploadedFilePath = path.join(UPLOADS_DIR, responseBody.documentId + '.txt');
    //     const fileExists = await fs.access(uploadedFilePath).then(() => true).catch(() => false);
    //     assert.ok(fileExists, 'Uploaded file should exist');
    //
    //     // Cleanup
    //     await fs.unlink(filePath); // Delete fixture file
    //     if (fileExists) await fs.unlink(uploadedFilePath); // Delete uploaded file
    // });
}); 