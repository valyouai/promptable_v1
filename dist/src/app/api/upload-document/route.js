import { NextResponse } from 'next/server';
import { processDocument } from '@/lib/document-processor';
import { extractConcepts } from '@/lib/concept-extractor';
// import openai from '@/lib/openai'; // Uncomment if needed for other AI tasks
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Set a higher limit for body parsing, e.g., 10MB
        },
    },
};
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        if (!file) {
            return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
        }
        const fileType = file.type;
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(fileType)) {
            return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
        }
        const extractedText = await processDocument(file);
        const analysisResult = await extractConcepts(extractedText);
        return NextResponse.json({
            message: 'File uploaded and processed successfully!',
            extractedText,
            analysisResult,
        });
    }
    catch (error) {
        console.error('Error processing file upload:', error);
        return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
    }
}
