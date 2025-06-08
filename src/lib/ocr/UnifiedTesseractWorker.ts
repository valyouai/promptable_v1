import { createWorker } from 'tesseract.js';

// Diagnostic log
console.log('createWorker (from tesseract.js) is:', createWorker);

// Interface for opts, derived from user's snippet for clarity
interface UnifiedWorkerOptions {
    language?: string;
    logger?: (m: unknown) => void;
    workerPath?: string;
    corePath?: string;
    langPath?: string;
}

export async function getUnifiedTesseractWorker(opts: UnifiedWorkerOptions = {}) {
    if (typeof window === 'undefined') {
        throw new Error("Tesseract.js worker is only supported client-side. Do not call getUnifiedTesseractWorker from server-side code.");
    }

    const {
        language = 'eng',
        logger, // Pass logger directly as per user snippet
        workerPath = '/tesseract/worker.min.js', // Use direct path from user snippet
        corePath = '/tesseract/tesseract-core.wasm.js', // Use direct path from user snippet
        langPath = '/tesseract/lang-data', // Use direct path from user snippet
    } = opts;

    // Dev mode logging for effective paths
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Dev Mode] Tesseract.js effective paths for createWorker:\n    Language: ${language}\n    WorkerPath: ${workerPath}\n    CorePath: ${corePath}\n    LangPath: ${langPath}`);
    }

    // Using type assertion (as any) for diagnostic purposes for createWorker
    const worker = await createWorker(
        language,
        undefined, // Pass undefined for OEM to use the default
        { workerPath, corePath, langPath, logger } // v5 API call structure, options object as 3rd arg
    );

    // Diagnostic log for worker object
    console.log('Worker prototype methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(worker)));

    return worker;
}

// Ensure any previous example usage or other parts of the file are preserved if they were outside this function.
// ... existing code ...
// (The previously existing example usage block, if any, would be here)
// (async () => {
//     if (process.env.NODE_ENV === 'development') { // Adjusted DEV_MODE to process.env.NODE_ENV
//         try {
//             console.log("Attempting to create a unified Tesseract worker for 'eng'...");
//             const worker = await getUnifiedTesseractWorker({ language: 'eng' });
//             console.log("English worker created. Performing recognition test...");
//             // Example: const { data: { text } } = await worker.recognize('path/to/your/image.png');
//             // console.log("Recognition result:", text);
//             await worker.terminate();
//             console.log("English worker terminated.");
//         } catch (error) {
//             console.error("Error during unified worker example usage:", error);
//         }
//     }
// })(); 