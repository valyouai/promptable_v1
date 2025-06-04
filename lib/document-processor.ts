import { TextItem } from 'pdfjs-dist/types/src/display/api';
import path from 'path';
import { fileURLToPath } from 'url';
// import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'; // Use the legacy mjs build for ESM

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set the worker source for pdf.js for Node.js environment
// pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

const getMammoth = async () => {
    return (await import('mammoth')).default;
};

export async function extractTextFromPdf(file: File): Promise<string> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = path.resolve(__dirname, '../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';

    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .filter((item): item is TextItem => (item as TextItem).str !== undefined)
            .map((item: TextItem) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}

export async function extractTextFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await (await getMammoth()).extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

export async function extractTextFromTxt(file: File): Promise<string> {
    return await file.text();
}

export async function processDocument(file: File): Promise<string> {
    const fileType = file.type;

    if (fileType === 'application/pdf') {
        return await extractTextFromPdf(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDocx(file);
    } else if (fileType === 'text/plain') {
        return await extractTextFromTxt(file);
    } else {
        throw new Error('Unsupported file type for text extraction.');
    }
}
