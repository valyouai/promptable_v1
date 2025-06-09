import { TextDecoder } from 'util';

export function safeDecodeBuffer(buffer: Buffer): string {
    if (process.env.TEST_MODE === 'true') {
        console.log(`[SafeDocumentDecoder] Buffer received, length=${buffer.length}`);
    }

    try {
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const decoded = decoder.decode(buffer);
        return decoded;
    } catch {
        console.error('[SafeDocumentDecoder] Decoding failed, returning fallback.');
        return buffer.toString('utf-8'); // fallback decode even on error
    }
} 