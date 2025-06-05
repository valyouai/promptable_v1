import PDFParser from 'pdf2json';

export async function extractTextFromPdf(file: File): Promise<string> {
    console.log('[extractTextFromPdf] Received file:', file.name, 'Type:', file.type, 'Size:', file.size);

    return new Promise(async (resolve, reject) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            console.log('[extractTextFromPdf] Converted to Buffer. Length:', buffer.length);

            const pdfParser = new PDFParser();

            pdfParser.on('pdfParser_dataError', (errData: Record<'parserError', Error>) => {
                console.error('[extractTextFromPdf] PDF parsing error:', errData.parserError);
                reject(new Error(`PDF parsing failed: ${errData.parserError.message}`));
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: { Pages: Array<{ Texts: Array<{ R: Array<{ T: string }> }> }> }) => {
                console.log('[extractTextFromPdf] PDF parsed successfully');

                // Extract text from all pages
                let fullText = '';

                if (pdfData.Pages) {
                    pdfData.Pages.forEach((page, pageIndex: number) => {
                        console.log(`[extractTextFromPdf] Processing page ${pageIndex + 1}/${pdfData.Pages.length}`);

                        if (page.Texts) {
                            page.Texts.forEach((text) => {
                                if (text.R && text.R[0] && text.R[0].T) {
                                    // Decode URI component to get actual text
                                    const decodedText = decodeURIComponent(text.R[0].T);
                                    fullText += decodedText + ' ';
                                }
                            });
                        }
                        fullText += '\n';
                    });
                }

                console.log('[extractTextFromPdf] Text extraction complete. Total length:', fullText.length);
                resolve(fullText.trim());
            });

            // Parse the PDF buffer
            console.log('[extractTextFromPdf] Starting PDF parsing...');
            pdfParser.parseBuffer(buffer);

        } catch (error) {
            console.error('[extractTextFromPdf] Error during PDF processing:', error);
            reject(error);
        }
    });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function extractTextFromDocx(_file: File): Promise<string> {
    // placeholder for docx logic if implemented later
    return 'DOCX parsing not implemented yet.';
}

export async function extractTextFromTxt(file: File): Promise<string> {
    const text = await file.text();
    return text;
}

export async function processDocument(file: File): Promise<string> {
    const fileType = file.type;
    console.log('[processDocument] Processing file:', file.name, 'Type:', fileType);

    if (fileType === 'application/pdf') {
        return await extractTextFromPdf(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return await extractTextFromDocx(file);
    } else if (fileType === 'text/plain') {
        return await extractTextFromTxt(file);
    } else {
        console.error('[processDocument] Unsupported file type:', fileType);
        throw new Error(`Unsupported file type: ${fileType}`);
    }
}
