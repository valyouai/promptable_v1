import fs from 'fs/promises';
import path from 'path';
import { config } from '@/lib/config';

// const STORAGE_DIR = path.join(process.cwd(), 'uploads');

export class StorageDriver {
    static async fetchDocument(documentId: string): Promise<string> {
        const storageDirPath = config.uploads.dirPath;
        const filePath = path.join(storageDirPath, `${documentId}.txt`);

        try {
            // Check if the directory exists. 
            // For fetching, we primarily care if the *file* exists, but ensuring directory exists is good practice.
            await fs.access(storageDirPath);
        } catch (_error) {
            // If storageDirPath doesn't exist, it's a server config issue or first run.
            console.error(`[STORAGE] Storage directory ${storageDirPath} does not exist. Attempting to create.`);
            try {
                await fs.mkdir(storageDirPath, { recursive: true });
            } catch (mkdirError) {
                console.error(`[STORAGE] Failed to create storage directory ${storageDirPath}:`, mkdirError);
                throw new Error(`Storage directory ${storageDirPath} could not be created or accessed.`);
            }
        }

        try {
            await fs.access(filePath); // Check if the specific file exists
            const fileBuffer = await fs.readFile(filePath);
            return fileBuffer.toString('utf-8');
        } catch (error) {
            console.error(`[STORAGE] Error accessing or reading file ${filePath} for documentId: ${documentId}:`, error);
            throw new Error(`Document with ID '${documentId}' not found.`);
        }
    }
} 