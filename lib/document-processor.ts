import { TextItem } from 'pdfjs-dist/types/src/display/api';

const getMammoth = async () => {
    return (await import('mammoth')).default;
};

export async function extractTextFromPdf(file: File): Promise<string> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');

    if (!pdfjs || !pdfjs.GlobalWorkerOptions) {
        // A basic check to ensure the module loaded somewhat correctly
        console.error('pdfjs-dist module or GlobalWorkerOptions not found after dynamic import.');
        throw new Error('Failed to load pdfjs-dist module correctly.');
    }

    // Setting workerSrc to empty string for Node.js internal worker handling
    pdfjs.GlobalWorkerOptions.workerSrc = '';

    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';

    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        // Ensure item is correctly typed for the filter and map operations
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
