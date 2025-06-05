const getMammoth = async () => {
    return (await import('mammoth')).default;
};
export async function extractTextFromPdf(file) {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = ''; // Signal pdfjs-dist to handle worker internally for Node.js
    const arrayBuffer = await file.arrayBuffer();
    const pdfDocument = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .filter((item) => item.str !== undefined)
            .map((item) => item.str)
            .join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
}
export async function extractTextFromDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await (await getMammoth()).extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}
export async function extractTextFromTxt(file) {
    return await file.text();
}
export async function processDocument(file) {
    const fileType = file.type;
    if (fileType === 'application/pdf') {
        return await extractTextFromPdf(file);
    }
    else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDocx(file);
    }
    else if (fileType === 'text/plain') {
        return await extractTextFromTxt(file);
    }
    else {
        throw new Error('Unsupported file type for text extraction.');
    }
}
