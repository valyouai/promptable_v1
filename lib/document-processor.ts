import mammoth from 'mammoth';
import FormData from 'form-data';
import fetch from 'node-fetch';

// PDF Microservice URL - Configurable through environment variables, with a default for local development
const PDF_EXTRACTION_SERVICE_URL = process.env.PDF_EXTRACTION_SERVICE_URL || 'http://localhost:7000/api/extract-pdf-text';

export async function extractTextFromPdf(file: File): Promise<string> {
    console.log(`[extractTextFromPdf] Received file: ${file.name}, Type: ${file.type}, Size: ${file.size}. Sending to microservice at ${PDF_EXTRACTION_SERVICE_URL}.`);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const formData = new FormData();
    formData.append('file', buffer, {
        filename: file.name,
        contentType: file.type || 'application/pdf',
    });

    try {
        const response = await fetch(PDF_EXTRACTION_SERVICE_URL, {
            method: 'POST',
            body: formData as any,
            headers: formData.getHeaders(),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            const errorMessage = `PDF extraction microservice failed with status: ${response.status} ${response.statusText} - ${errorBody}`;
            console.error(`[extractTextFromPdf] Error from microservice: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const successBody = await response.json();
        if (typeof successBody.text !== 'string') {
            console.error('[extractTextFromPdf] Microservice response did not contain a valid text string.', successBody);
            throw new Error('Invalid response format from PDF extraction microservice.');
        }

        console.log('[extractTextFromPdf] Text successfully extracted by microservice. Length:', successBody.text.length);
        return successBody.text;

    } catch (error: unknown) {
        let errorMessage = 'Unknown error during PDF microservice call';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`[extractTextFromPdf] Error calling PDF extraction microservice: ${errorMessage}`, error);
        throw new Error(`Failed to extract text from PDF via microservice: ${errorMessage}`);
    }
}

// New function to handle buffer input directly
export async function extractTextFromPdfBuffer(
    buffer: Buffer,
    filename: string,
    contentType: string = 'application/pdf' // Default contentType
): Promise<string> {
    console.log(`[extractTextFromPdfBuffer] Received buffer for file: ${filename}, Type: ${contentType}, Size: ${buffer.length}. Sending to microservice at ${PDF_EXTRACTION_SERVICE_URL}.`);

    const formData = new FormData();
    formData.append('file', buffer, {
        filename: filename,
        contentType: contentType,
    });

    try {
        const response = await fetch(PDF_EXTRACTION_SERVICE_URL, {
            method: 'POST',
            body: formData as any, // FormData type from 'form-data' might not perfectly align with fetch's BodyInit
            headers: formData.getHeaders(),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            const errorMessage = `PDF extraction microservice failed with status: ${response.status} ${response.statusText} - ${errorBody}`;
            console.error(`[extractTextFromPdfBuffer] Error from microservice: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const successBody = await response.json();
        if (typeof successBody.text !== 'string') {
            console.error('[extractTextFromPdfBuffer] Microservice response did not contain a valid text string.', successBody);
            throw new Error('Invalid response format from PDF extraction microservice.');
        }

        console.log('[extractTextFromPdfBuffer] Text successfully extracted by microservice. Length:', successBody.text.length);
        return successBody.text;

    } catch (error: unknown) {
        let errorMessage = 'Unknown error during PDF microservice call via buffer';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        console.error(`[extractTextFromPdfBuffer] Error calling PDF extraction microservice: ${errorMessage}`, error);
        throw new Error(`Failed to extract text from PDF via microservice (buffer): ${errorMessage}`);
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function extractTextFromDocx(file: File): Promise<string> {
    console.log('[extractTextFromDocx] Received file:', file.name, 'Type:', file.type, 'Size:', file.size);
    try {
        const arrayBuffer = await file.arrayBuffer();
        console.log('[extractTextFromDocx] Converted to ArrayBuffer. Length:', arrayBuffer.byteLength);

        const nodeBuffer = Buffer.from(arrayBuffer);
        console.log('[extractTextFromDocx] Converted to Node.js Buffer. Length:', nodeBuffer.length);

        const result = await mammoth.extractRawText({ buffer: nodeBuffer });
        const text = result.value;

        if (result.messages && result.messages.length > 0) {
            console.warn('[extractTextFromDocx] Messages during DOCX parsing:', result.messages);
        }
        console.log('[extractTextFromDocx] DOCX parsed successfully. Text length:', text.length);
        return text;
    } catch (error) {
        console.error('[extractTextFromDocx] Error during DOCX processing:', error);
        throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
