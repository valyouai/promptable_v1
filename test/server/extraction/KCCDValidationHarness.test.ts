import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url'; // Added for ES module __dirname equivalent
import { ExtractionKernel } from '@/server/extraction/ExtractionKernel';
import { StorageDriver } from '@/lib/extraction/StorageDriver';
import { processDocument } from '@/lib/document-processor'; // To get text from PDF/DOCX
import type { ExtractedConcepts } from '@/types';

// REMOVED: jest.mock('@/lib/extraction/StorageDriver');
// REMOVED: const mockFetchDocument = StorageDriver.fetchDocument as jest.Mock;

// List of test documents in test/fixtures/
// We'll use sample.pdf, sample.docx, and sample.txt
const testDocuments = [
    'sample.pdf',
    'sample.docx',
    'sample.txt',
    'empty.txt', // Test with an empty file
    'nonexistent.txt', // Test with a file that doesn't exist (for processDocument error handling)
    'PROMPT_PATTERN_CATALOG_VANDERBILT_UNIVERSITY.pdf' // Added new document
];

// Correctly define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FIXTURES_DIR = path.join(__dirname, '../../fixtures'); // Adjust path as necessary

// Minimal File-like interface for processDocument mock
interface MockFile {
    name: string;
    type: string;
    size: number;
    arrayBuffer(): Promise<ArrayBuffer>;
    text(): Promise<string>; // Added for completeness, though processDocument might primarily use arrayBuffer
    slice(start?: number, end?: number, contentType?: string): Blob; // Added for File interface compliance
    lastModified: number; // Added for File interface compliance
    webkitRelativePath: string; // Added for File interface compliance
}

// Define a type for the StorageDriver.fetchDocument function
type FetchDocumentType = (documentId: string) => Promise<string>;

// Main async function to run the harness
async function runKCCDValidationHarness() {
    console.log('Starting KCCD Validation Harness...');

    for (const docFilename of testDocuments) {
        console.log(`\n--- Processing document: ${docFilename} ---`);
        const mockDocumentId = `kccd-${docFilename}`;
        let documentText: string | null = null;
        let processingError: string | null = null;
        let originalFetchDocument: FetchDocumentType | null = null; // Typed correctly

        try {
            const filePath = path.join(FIXTURES_DIR, docFilename);
            let fileBuffer: Buffer;
            try {
                fileBuffer = await fs.readFile(filePath);
            } catch (readError: unknown) {
                const message = readError instanceof Error ? readError.message : String(readError);
                console.error(`  Error reading file ${docFilename}: ${message}`);
                processingError = `File read error: ${message}`;
                // Log status and continue to next document
                logExtractionStatus(docFilename, null, processingError);
                continue;
            }

            // Determine file type for processDocument
            let fileType = '';
            if (docFilename.endsWith('.pdf')) fileType = 'application/pdf';
            else if (docFilename.endsWith('.docx')) fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (docFilename.endsWith('.txt')) fileType = 'text/plain';
            else {
                console.warn(`  Unsupported file type for ${docFilename}, attempting text extraction if possible.`);
                // Fallback or specific handling for other types if necessary
            }

            if (fileBuffer.length === 0 && docFilename === 'empty.txt') {
                documentText = '';
                console.log('  Document is empty as expected.');
            } else if (fileType) {
                // Create a File-like object for processDocument
                // processDocument might be robust enough for a simpler object in test, or it might need more properties.
                const mockFileObject: MockFile = {
                    name: docFilename,
                    type: fileType,
                    size: fileBuffer.length,
                    arrayBuffer: async (): Promise<ArrayBuffer> => {
                        // Create a new ArrayBuffer and copy the data from the Node.js Buffer
                        // This ensures it's a plain ArrayBuffer, not a SharedArrayBuffer
                        const newArrayBuffer = new ArrayBuffer(fileBuffer.length);
                        const view = new Uint8Array(newArrayBuffer);
                        view.set(fileBuffer); // Copies data from fileBuffer (a Uint8Array) to view
                        return newArrayBuffer;
                    },
                    text: async () => fileBuffer.toString('utf-8'),
                    slice: (start?: number, end?: number, contentType?: string): Blob => {
                        const slicedBuffer = fileBuffer.slice(start, end);
                        return new Blob([slicedBuffer], { type: contentType || fileType });
                    },
                    lastModified: Date.now(),
                    webkitRelativePath: ''
                };

                console.log(`  Extracting text content from ${docFilename}...`);
                documentText = await processDocument(mockFileObject as File); // Cast to File as processDocument expects it
                console.log(`  Text extraction successful. Text length: ${documentText.length} characters.`);
            } else {
                processingError = `Unsupported file type for direct processing: ${docFilename}`;
                console.warn(`  ${processingError}`);
                // If we can't process it to text, we can't give it to the kernel realistically
                logExtractionStatus(docFilename, null, processingError);
                continue;
            }

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`  Error during text processing for ${docFilename}:`, message);
            processingError = `Text processing error: ${message}`;
            documentText = null; // Ensure kernel isn't called with stale data
        }

        if (processingError || documentText === null) {
            logExtractionStatus(docFilename, null, processingError || 'Document text is null after processing.');
            continue;
        }

        // Store original and assign mock implementation for StorageDriver.fetchDocument
        originalFetchDocument = StorageDriver.fetchDocument as FetchDocumentType;
        StorageDriver.fetchDocument = async (id: string): Promise<string> => {
            if (id === mockDocumentId) {
                return documentText as string; // documentText is confirmed not null here
            }
            console.warn(`StorageDriver.fetchDocument called with unexpected id: ${id} during KCCD harness. Ensure mockDocumentId matches.`);
            if (originalFetchDocument) {
                return originalFetchDocument(id);
            }
            throw new Error(`KCCD StorageDriver.fetchDocument mock called with unexpected id: ${id}. Original not available.`);
        };

        try {
            console.log(`  Calling ExtractionKernel.handle() for ${mockDocumentId}...`);
            const concepts: ExtractedConcepts = await ExtractionKernel.handle(mockDocumentId);
            logExtractionStatus(docFilename, concepts, null);
        } catch (kernelError: unknown) {
            const message = kernelError instanceof Error ? kernelError.message : String(kernelError);
            console.error(`  Error during ExtractionKernel.handle for ${docFilename}:`, message);
            logExtractionStatus(docFilename, null, `Kernel Error: ${message}`);
        } finally {
            // Restore original StorageDriver.fetchDocument
            if (originalFetchDocument) {
                StorageDriver.fetchDocument = originalFetchDocument;
            }
        }
    }
    console.log('\nKCCD Validation Harness finished.');
}

function logExtractionStatus(docFilename: string, concepts: ExtractedConcepts | null, error: string | null) {
    if (error) {
        console.log(`  Principles: N/A`);
        console.log(`  Methods: N/A`);
        console.log(`  Frameworks: N/A`);
        console.log(`  Theories: N/A`);
        console.log(`  Extraction Status: Failed (${error}) for ${docFilename}`);
    } else if (concepts) {
        console.log(`  Principles: ${concepts.principles?.length || 0}`);
        console.log(`  Methods: ${concepts.methods?.length || 0}`);
        console.log(`  Frameworks: ${concepts.frameworks?.length || 0}`);
        console.log(`  Theories: ${concepts.theories?.length || 0}`);
        console.log(`  Extraction Status: Success for ${docFilename}`);
    }
}

// Run the harness
runKCCDValidationHarness().catch(console.error); 