"use client"
// import React, { useState, useEffect } from 'react'; // Old import
import * as React from 'react'; // Using namespace import for React
import { useParams } from 'next/navigation'; // Import useParams hook
import DocumentUploader from '@/components/DocumentUploader';
import AnalysisPreview from '@/components/AnalysisPreview';
import SystemPromptGenerator from '@/components/SystemPromptGenerator';
import ExportOptions from '@/components/ExportOptions';
import { ExtractedConcepts, SystemPromptResult, ExtractionResult } from '@/types';
import { Persona } from '@/lib/prompt-templates';

// interface PageProps {
//   // params: { persona: string; contentType: string }; // No longer needed as prop
// }

const GenerationPage: React.FC = ({ }) => {
  const params = useParams();
  const persona: Persona = 'creator'; // Hardcode persona as 'creator'
  const contentType = params.contentType as string; // Access contentType via hook and cast to string
  // const [uploadedFile, setUploadedFile] = React.useState<File | null>(null); // Removed as not currently used
  const [extractedConcepts, setExtractedConcepts] = React.useState<ExtractedConcepts | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = React.useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState<boolean>(false);
  const [generatedPromptResult, setGeneratedPromptResult] = React.useState<SystemPromptResult | undefined>(undefined);
  const [documentId, setDocumentId] = React.useState<string>(''); // Placeholder for document ID
  const [fullExtractionResult, setFullExtractionResult] = React.useState<ExtractionResult | null>(null); // New state variable

  React.useEffect(() => {
    // In a real application, you might fetch initial data or document status here
    // For MVP, we're assuming a fresh start or relying on user interaction.
  }, [persona, contentType]);

  React.useEffect(() => {
    // Effect to log when generatedPromptResult changes
    console.log('[Creator Page useEffect] generatedPromptResult state updated:', generatedPromptResult);
    if (generatedPromptResult) {
      console.log('[Creator Page useEffect] systemPrompt from state (first 200 chars):', generatedPromptResult.systemPrompt?.substring(0, 200));
      console.log('[Creator Page useEffect] systemPrompt from state total length:', generatedPromptResult.systemPrompt?.length);
    }
  }, [generatedPromptResult]); // Dependency array ensures this runs when generatedPromptResult changes

  const handleDocumentUpload = async (file: File) => {
    setIsProcessingDocument(true);
    setExtractedConcepts(null); // Reset previous concepts
    setFullExtractionResult(null); // Reset previous full result
    setGeneratedPromptResult(undefined); // Reset previous prompt result
    // Consider if documentId needs reset or if it's still relevant for other flows.
    // setDocumentId(''); // For now, let's keep documentId management separate if used by other parts.

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Call the new /api/runExtraction route
      const response = await fetch('/api/runExtraction', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // Try to get more specific error from response body
        let errorDetails = 'Extraction failed';
        try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.details || response.statusText;
        } catch {
            // Fallback if response body is not JSON or error field doesn't exist
            errorDetails = `Extraction failed with status: ${response.status} ${response.statusText}`;
        }
        console.error('Extraction failed:', errorDetails);
        alert(`Error: ${errorDetails}`); // Show error to user
        return; // Stop further processing
      }

      const extractionResult: ExtractionResult = await response.json();
      console.log('Extraction Complete:', extractionResult);

      // Set new state variables
      setExtractedConcepts(extractionResult.finalConcepts); 
      setFullExtractionResult(extractionResult); 
      setDocumentId(extractionResult.documentId ?? ''); // Set documentId from extraction result
      // If the new API returns a documentId as part of ExtractionResult, set it here if needed.
      // For example: if (extractionResult.documentId) setDocumentId(extractionResult.documentId);

    } catch (err) {
      console.error('Error during document upload and extraction:', err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      alert(`Error: ${errorMessage}`);
      // Ensure states are reset on catch
      setExtractedConcepts(null);
      setFullExtractionResult(null);
    } finally {
      setIsProcessingDocument(false);
    }
  };

  // Updated handleGeneratePrompt function as per user's Phase 11B plan
  const handleGeneratePrompt = async (/* Removed config: GenerationConfig based on new plan */) => {
    setIsGeneratingPrompt(true);
    // setGeneratedPromptResult(undefined); // Resetting it here might be good, but user's snippet didn't explicitly show it this time.
                                        // The prior version *did* reset it.
                                        // For safety and consistency, let's keep the reset.
    setGeneratedPromptResult(undefined);

    if (!fullExtractionResult || !fullExtractionResult.finalConcepts) {
        console.error('[Creator Page] No full extraction result or final concepts available to generate prompt.');
        alert('Please ensure a document has been processed and concepts are extracted before generating a prompt.');
        setIsGeneratingPrompt(false);
        return;
    }

    // Persona and contentType are available in the component's scope.
    // documentId is still in state but might be empty if not set by the new extraction flow.
    // The API for generate-system-prompt might need to handle an optional/empty documentId.
    console.log('Attempting to generate prompt with:', {
        persona,
        contentType,
        extractedConcepts: fullExtractionResult.finalConcepts,
        // documentId, // Not explicitly included in the user's new body for generate-system-prompt
                       // If the API needs it, it should be added here.
    });

    try {
        const response = await fetch('/api/generate-system-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                persona: persona, 
                contentType: contentType,
                extractedConcepts: fullExtractionResult.finalConcepts, // Correctly using finalConcepts
                // documentId: documentId, // If API needs it
            }),
        });

        if (!response.ok) {
            let errorDetails = 'Prompt generation failed.';
            try {
                const errorData = await response.json();
                errorDetails = errorData.error || errorData.details || response.statusText;
            } catch {
                errorDetails = `Prompt generation failed. Status: ${response.status} ${response.statusText}`;
            }
            console.error('Error generating system prompt:', errorDetails);
            alert(`Error: ${errorDetails}`);
            // No explicit re-throw here, error is alerted, function will proceed to finally.
            return; // Explicitly return to avoid setting generatedPromptResult on failure.
        }

        // Assuming the API returns an object like { generatedPrompt: string } or the full SystemPromptResult
        // Your previous code expected SystemPromptResult. Let's stick to that if data matches.
        // Your new snippet for handleGeneratePrompt expects data.generatedPrompt for the string itself.
        // Let's assume the API /api/generate-system-prompt returns { systemPrompt: string, ...other SystemPromptResult fields ...}
        const resultData: SystemPromptResult = await response.json(); 
        console.log('[Creator Page] Received API response for generate-system-prompt:', resultData);
        setGeneratedPromptResult(resultData); // Store the full SystemPromptResult object

    } catch (error) {
        console.error('Error in handleGeneratePrompt catch block:', error);
        alert(`An error occurred while generating the prompt: ${error instanceof Error ? error.message : "Unknown error"}`);
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
          {!extractedConcepts && !fullExtractionResult && ( // Also hide if fullExtractionResult is present, assuming it means processing is done
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
                documentId={documentId} // This documentId might need to be sourced from fullExtractionResult if that becomes the new flow
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

          {generatedPromptResult && generatedPromptResult.systemPrompt && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2 text-gray-800">Generated System Prompt</h3>
              <div className="rounded-md border border-gray-700 dark:border-gray-600">
                <pre className="whitespace-pre-wrap font-mono text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-4 rounded text-sm">
                  {generatedPromptResult.systemPrompt}
                </pre>
              </div>
              <ExportOptions systemPrompt={generatedPromptResult.systemPrompt} />
            </div>
          )}

          {/* Added UI Display for fullExtractionResult as per Step 4 */}
          {fullExtractionResult && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold mb-2">Full Extraction Result</h2>
              <pre className="bg-gray-100 dark:bg-gray-900 dark:text-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(fullExtractionResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerationPage; 