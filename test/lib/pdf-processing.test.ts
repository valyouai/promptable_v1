import { extractTextFromPdf } from '../../lib/document-processor';
import * as fs from 'fs';
import * as path from 'path';

// Simple test to verify PDF processing works
async function testPdfProcessing() {
    console.log('🧪 Testing PDF Processing...\n');

    // Create a simple test PDF content (you would use a real PDF in production)
    const testPdfPath = path.join(process.cwd(), 'test/fixtures/test.pdf');

    try {
        // Check if test PDF exists
        if (!fs.existsSync(testPdfPath)) {
            console.log('⚠️  No test PDF found at:', testPdfPath);
            console.log('   To run this test, place a PDF file at the above location.');
            return;
        }

        // Read the test PDF
        const pdfBuffer = fs.readFileSync(testPdfPath);
        const file = new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' });

        console.log('📄 Processing test PDF...');
        const extractedText = await extractTextFromPdf(file);

        console.log('✅ PDF processed successfully!');
        console.log(`📝 Extracted ${extractedText.length} characters`);
        console.log(`📋 First 200 characters: ${extractedText.substring(0, 200)}...`);

    } catch (error) {
        console.error('❌ PDF processing failed:', error);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testPdfProcessing().then(() => {
        console.log('\n✨ PDF processing test completed!');
    }).catch(error => {
        console.error('\n💥 Test failed:', error);
        process.exit(1);
    });
} 