import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { processDocument } from '../lib/document-processor'; // Adjusted to be relative to project root
import { ExtractionKernel } from '../src/server/extraction/ExtractionKernel';

// Handle __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to import deriveDocumentContext, with a placeholder if it fails
let deriveDocumentContext = async (text: string): Promise<any> => {
    console.warn('[IngestScript] WARN: Using placeholder for deriveDocumentContext. Actual context will not be derived.');
    return { placeholder: true, documentTextLength: text.length }; // Return a dummy context
};

try {
    const contextExtractor = await import('../src/lib/context-extractor'); // Corrected path
    if (contextExtractor && typeof contextExtractor.deriveDocumentContext === 'function') {
        deriveDocumentContext = contextExtractor.deriveDocumentContext;
        console.log('[IngestScript] INFO: Successfully imported deriveDocumentContext from ../src/lib/context-extractor');
    } else {
        console.warn('[IngestScript] WARN: deriveDocumentContext not found in ../src/lib/context-extractor. Using placeholder.');
    }
} catch (e) {
    console.warn(`[IngestScript] WARN: Could not import '../src/lib/context-extractor'. Using placeholder for deriveDocumentContext. Error: ${(e as Error).message}`);
}

// Define a type for the mock File-like object to satisfy processDocument
interface MockFile {
    name: string;
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
    text?: () => Promise<string>; // Optional, if ever needed by other parts of processDocument for non-PDFs
    lastModified?: number;
}

// Helper function to create a mock File-like object for processDocument
function createMockFile(filePath: string, fileBuffer: Buffer): MockFile {
    const fileName = path.basename(filePath);
    return {
        name: fileName,
        type: 'application/pdf', // Hardcoding for PDF as per selected file
        size: fileBuffer.length,
        arrayBuffer: async () => {
            // Convert Node.js Buffer to ArrayBuffer
            // Create a new ArrayBuffer and copy data to ensure it's a distinct ArrayBuffer instance
            const arrayBuf = new ArrayBuffer(fileBuffer.length);
            const view = new Uint8Array(arrayBuf);
            for (let i = 0; i < fileBuffer.length; ++i) {
                view[i] = fileBuffer[i];
            }
            return arrayBuf;
        },
        lastModified: Date.now(),
    };
}

async function runIngest() {
    const projectRoot = path.resolve(__dirname, '..');
    const filePath = path.join(projectRoot, 'test/fixtures/PROMPT_PATTERN_CATALOG_VANDERBILT_UNIVERSITY.pdf'); // Using established PDF

    console.log(`[IngestScript] Reading file from: ${filePath}`);
    const fileBuffer = await fs.readFile(filePath);
    console.log(`[IngestScript] File read successfully. Buffer length: ${fileBuffer.length}`);

    const mockFile = createMockFile(filePath, fileBuffer) as unknown as File;
    console.log(`[IngestScript] Mock File object created: ${mockFile.name}, type: ${mockFile.type}, size: ${mockFile.size}`);

    console.log('[IngestScript] Processing document to extract text...');
    const documentText = await processDocument(mockFile);
    console.log(`[IngestScript] Document text extracted. Length: ${documentText.length}`);
    if (documentText.length > 0) {
        console.log(`[IngestScript] Document text (first 500 chars): ${documentText.substring(0, 500)}...`);
    } else {
        console.warn('[IngestScript] Warning: Extracted document text is empty.');
    }

    console.log('[IngestScript] Deriving document context...');
    const documentContext = await deriveDocumentContext(documentText);
    console.log('[IngestScript] Document context derived.');

    const persona = 'creator';

    console.log(`[IngestScript] Extracting concepts with ExtractionKernel for persona: ${persona}...`);
    const extractionResult = await ExtractionKernel.extract({
        persona: persona,
        documentText: documentText,
        context: documentContext
    });
    console.log('[IngestScript] Extraction complete.');

    console.log('\n🟢 Extraction Output:\n', JSON.stringify(extractionResult, null, 2));
}

runIngest().catch((err) => {
    console.error('❌ Extraction failed:', err);
    process.exit(1); // Exit with error code
}); 