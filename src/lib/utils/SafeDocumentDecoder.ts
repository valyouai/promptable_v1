import { TextDecoder } from 'util';

export function safeDecodeBuffer(buffer: Buffer): string {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    return decoder.decode(buffer);
} 