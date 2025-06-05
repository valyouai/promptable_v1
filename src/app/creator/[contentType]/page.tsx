"use client"
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // Import useParams hook
import DocumentUploader from '@/components/DocumentUploader';
import AnalysisPreview from '@/components/AnalysisPreview';
import SystemPromptGenerator from '@/components/SystemPromptGenerator';
import ExportOptions from '@/components/ExportOptions';
import { ExtractedConcepts, SystemPromptResult } from '@/types';
import { GenerationConfig, Persona } from '@/lib/prompt-templates';

// interface PageProps {
//   // params: { persona: string; contentType: string }; // No longer needed as prop
// }

const GenerationPage: React.FC = ({ }) => {
  const params = useParams();
  const persona: Persona = 'creator'; // Hardcode persona as 'creator'
  const contentType = params.contentType as string; // Access contentType via hook and cast to string
  // const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Removed as not currently used
  const [extractedConcepts, setExtractedConcepts] = useState<ExtractedConcepts | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState<boolean>(false);
  const [generatedPromptResult, setGeneratedPromptResult] = useState<SystemPromptResult | undefined>(undefined);
  const [documentId, setDocumentId] = useState<string>(''); // Placeholder for document ID

  useEffect(() => {
    // In a real application, you might fetch initial data or document status here
    // For MVP, we're assuming a fresh start or relying on user interaction.
  }, [persona, contentType]);

  useEffect(() => {
    // Effect to log when generatedPromptResult changes
    console.log('[Creator Page useEffect] generatedPromptResult state updated:', generatedPromptResult);
    if (generatedPromptResult) {
      console.log('[Creator Page useEffect] systemPrompt from state (first 200 chars):', generatedPromptResult.systemPrompt?.substring(0, 200));
      console.log('[Creator Page useEffect] systemPrompt from state total length:', generatedPromptResult.systemPrompt?.length);
    }
  }, [generatedPromptResult]); // Dependency array ensures this runs when generatedPromptResult changes

  const handleDocumentUpload = async (file: File) => {
    setIsProcessingDocument(true);
    setExtractedConcepts(null);
    setGeneratedPromptResult(undefined);
    // It's good practice to also reset documentId if a new file is uploaded
    // unless the backend handles document versioning under the same ID, 
    // but for now, we'll stick to the user's provided patch structure.
    // setDocumentId(''); 

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // More specific error message based on response status if available
        const errorText = await response.text();
        throw new Error(`Document upload failed: ${response.status} ${errorText || 'Unknown error'}`);
      }

      // Assuming UploadResponse is implicitly { documentId: string } or similar based on usage.
      // If UploadResponse is a defined type, it should be imported.
      const uploadData: { documentId: string } = await response.json(); 
      console.log("Upload Response Received:", uploadData);
      setDocumentId(uploadData.documentId);

      // 🔥 New live extraction logic begins here:
      if (uploadData.documentId) { // Only proceed if documentId was successfully obtained
        console.log(`Attempting to extract concepts for documentId: ${uploadData.documentId}`);
        const extractionResponse = await fetch(`/api/extract-concepts/${uploadData.documentId}`);

        if (!extractionResponse.ok) {
          const errorText = await extractionResponse.text();
          throw new Error(`Concept extraction failed: ${extractionResponse.status} ${errorText || 'Unknown error'}`);
        }

        const actualConcepts: ExtractedConcepts = await extractionResponse.json();
        setExtractedConcepts(actualConcepts);
        console.log('Successfully extracted and set concepts:', actualConcepts);
      } else {
        throw new Error('No documentId received from upload, cannot extract concepts.');
      }

    } catch (error) {
      console.error('Error in document upload or concept extraction process:', error);
      // Provide a more user-friendly error message
      if (error instanceof Error) {
        alert(`An error occurred: ${error.message}. Please try again.`);
      } else {
        alert('An unknown error occurred during document processing. Please try again.');
      }
      // Ensure states are reset on error
      setExtractedConcepts(null);
      setDocumentId('');
    } finally {
      setIsProcessingDocument(false);
    }
  };

  // Refactored to only accept `config` as an argument.
  // Other values (extractedConcepts, documentId, persona, contentType)
  // are accessed directly from this component's state or scope.
  const handleGeneratePrompt = async (config: GenerationConfig) => {
    setIsGeneratingPrompt(true);
    setGeneratedPromptResult(undefined);

    // Using `extractedConcepts` from component state
    if (!extractedConcepts) {
      alert('Please upload and process a document first to extract concepts.');
      setIsGeneratingPrompt(false);
      return;
    }

    // Using `documentId`, `persona`, `contentType`, and `extractedConcepts`
    // directly from the component's state/scope.
    console.log('Attempting to generate prompt with:', {
      documentId,         // From component state
      persona,            // From component scope
      contentType,        // From component scope (derived from params)
      focusAreas: config.focusAreas,
      complexityLevel: config.complexityLevel,
      outputStyle: config.outputStyle,
      extractedConcepts,  // From component state
    });

    try {
      const response = await fetch('/api/generate-system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,         // From component state
          persona,            // From component scope
          contentType,        // From component scope
          focusAreas: config.focusAreas,
          complexityLevel: config.complexityLevel,
          outputStyle: config.outputStyle,
          extractedConcepts,  // From component state
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate system prompt.');
      }

      const result: SystemPromptResult = await response.json();
      console.log('[Creator Page] Client received API response for generate-system-prompt:', result);
      setGeneratedPromptResult(result);
    } catch (error) {
      console.error('Error generating system prompt:', error);
      alert('Failed to generate system prompt. Please try again.');
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // Commenting out or removing render phase logs for a cleaner console during normal operation
  // console.log('[Creator Page Render] Value of generatedPromptResult during render:', generatedPromptResult);
  // if (generatedPromptResult) {
  //   console.log('[Creator Page Render] systemPrompt length during render:', generatedPromptResult.systemPrompt?.length);
  // }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Generate Prompt for {persona} / {contentType}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1">
          {/* Conditionally render DocumentUploader: only if extractedConcepts is null */}
          {!extractedConcepts && (
            <DocumentUploader
              onUpload={handleDocumentUpload}
              acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
              isProcessing={isProcessingDocument}
              processingStatus={isProcessingDocument ? 'Processing document...' : undefined}
            />
          )}

          {extractedConcepts && ( // Show analysis preview if concepts are extracted
            <div className="mt-8">
              <AnalysisPreview
                documentId={documentId}
                extractedConcepts={extractedConcepts}
              />
            </div>
          )}
        </div>

        <div className="col-span-1">
          {extractedConcepts && ( // Show prompt generator if concepts are extracted
            <SystemPromptGenerator
              onGenerate={handleGeneratePrompt}
              isLoading={isGeneratingPrompt}
            />
          )}

          {generatedPromptResult && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Generated Prompt:</h3>
              <div className="rounded-md border border-gray-700 dark:border-gray-600">
                <pre className="whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm">
                  {generatedPromptResult.systemPrompt}
                </pre>
              </div>
              <ExportOptions systemPrompt={generatedPromptResult.systemPrompt} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationPage; 