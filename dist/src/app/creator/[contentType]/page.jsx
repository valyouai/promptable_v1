"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams hook
import DocumentUploader from '@/components/DocumentUploader';
import AnalysisPreview from '@/components/AnalysisPreview';
import SystemPromptGenerator from '@/components/SystemPromptGenerator';
import ExportOptions from '@/components/ExportOptions';
// interface PageProps {
//   // params: { persona: string; contentType: string }; // No longer needed as prop
// }
const GenerationPage = ({}) => {
    const params = useParams();
    const persona = 'creator'; // Hardcode persona as 'creator'
    const contentType = params.contentType; // Access contentType via hook and cast to string
    // const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Removed as not currently used
    const [extractedConcepts, setExtractedConcepts] = useState(null);
    const [isProcessingDocument, setIsProcessingDocument] = useState(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [generatedPromptResult, setGeneratedPromptResult] = useState(undefined);
    const [documentId, setDocumentId] = useState(''); // Placeholder for document ID
    useEffect(() => {
        // In a real application, you might fetch initial data or document status here
        // For MVP, we're assuming a fresh start or relying on user interaction.
    }, [persona, contentType]);
    const handleDocumentUpload = async (file) => {
        // setUploadedFile(file); // Removed as not currently used
        setIsProcessingDocument(true);
        setExtractedConcepts(null);
        setGeneratedPromptResult(undefined);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const uploadResponse = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
            });
            if (!uploadResponse.ok) {
                throw new Error('Document upload failed.');
            }
            const uploadData = await uploadResponse.json();
            // Assuming uploadData contains a documentId and initial processing status
            setDocumentId(uploadData.documentId || 'temp-doc-id'); // Placeholder
            // Simulate analysis - in a real scenario, this would be a separate API call
            // to /api/document/[id]/analysis after processing is complete.
            // For now, we'll mock some concepts or directly call a simple extraction.
            // A more robust implementation would poll the status endpoint.
            // For MVP, we'll directly call concept extraction for now as a temporary measure.
            // This assumes extractConcepts can be called client-side or we mock a response.
            // For now, let's mock it for demonstration.
            console.log('Simulating concept extraction...');
            setTimeout(() => {
                const mockConcepts = {
                    principles: ['Principle A', 'Principle B'],
                    methods: ['Method X', 'Method Y'],
                    frameworks: ['Framework 1', 'Framework 2'],
                    theories: ['Theory Alpha'],
                };
                setExtractedConcepts(mockConcepts);
                setIsProcessingDocument(false);
            }, 2000); // Simulate network delay
        }
        catch (error) {
            console.error('Error processing document:', error);
            setIsProcessingDocument(false);
            alert('Failed to process document. Please try again.');
        }
    };
    const handleGeneratePrompt = async (config, extractedConcepts, documentId, persona, contentType) => {
        setIsGeneratingPrompt(true);
        setGeneratedPromptResult(undefined);
        if (!extractedConcepts) {
            alert('Please upload and process a document first to extract concepts.');
            setIsGeneratingPrompt(false);
            return;
        }
        console.log('Attempting to generate prompt with:', {
            documentId,
            persona,
            contentType,
            focusAreas: config.focusAreas,
            complexityLevel: config.complexityLevel,
            outputStyle: config.outputStyle,
            extractedConcepts,
        });
        try {
            const response = await fetch('/api/generate-system-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    documentId,
                    persona,
                    contentType,
                    focusAreas: config.focusAreas,
                    complexityLevel: config.complexityLevel,
                    outputStyle: config.outputStyle,
                    extractedConcepts,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to generate system prompt.');
            }
            const result = await response.json();
            setGeneratedPromptResult(result);
        }
        catch (error) {
            console.error('Error generating system prompt:', error);
            alert('Failed to generate system prompt. Please try again.');
        }
        finally {
            setIsGeneratingPrompt(false);
        }
    };
    return (<div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Generate Prompt for {persona} / {contentType}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1">
          <DocumentUploader onUpload={handleDocumentUpload} acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']} isProcessing={isProcessingDocument} processingStatus={isProcessingDocument ? 'Processing document...' : undefined}/>

          {extractedConcepts && ( // Show analysis preview if concepts are extracted
        <div className="mt-8">
              <AnalysisPreview documentId={documentId} extractedConcepts={extractedConcepts}/>
            </div>)}
        </div>

        <div className="col-span-1">
          {extractedConcepts && ( // Show prompt generator if concepts are extracted
        <SystemPromptGenerator documentId={documentId} persona={persona} contentType={contentType} extractedConcepts={extractedConcepts} onGenerate={handleGeneratePrompt} isLoading={isGeneratingPrompt} result={generatedPromptResult}/>)}

          {generatedPromptResult && (<div className="mt-8">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Generated Prompt:</h3>
              <div className="bg-gray-100 p-4 rounded-md border border-gray-200">
                <pre className="whitespace-pre-wrap font-mono text-gray-700 text-sm">{generatedPromptResult.systemPrompt}</pre>
              </div>
              <ExportOptions systemPrompt={generatedPromptResult.systemPrompt}/>
            </div>)}
        </div>
      </div>
    </div>);
};
export default GenerationPage;
