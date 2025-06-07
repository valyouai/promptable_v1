import mammoth from 'mammoth';
import { extractTextFromPdfBuffer } from '@/lib/document-processor';

export async function parseMultipartFormData(filename: string, fileBuffer: Buffer): Promise<string> {
    if (filename.endsWith('.pdf')) {
        console.log('[parseMultipartFormData] Using extractTextFromPdfBuffer for:', filename);
        const text = await extractTextFromPdfBuffer(fileBuffer, filename);
        return text;
    }

    if (filename.endsWith('.docx')) {
        console.log('[parseMultipartFormData] Using mammoth for:', filename);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        return result.value;
    }

    // Fallback: treat as plain text
    console.log('[parseMultipartFormData] Treating as plain text:', filename);
    return fileBuffer.toString('utf8');
} 