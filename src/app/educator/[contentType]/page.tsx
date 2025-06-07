"use client"
// import React, { useState, useEffect } from 'react'; // Old import
import * as React from 'react'; // Using namespace import for React
import { useParams } from 'next/navigation'; // Import useParams hook
import DocumentUploader from '@/components/DocumentUploader';
import AnalysisPreview from '@/components/AnalysisPreview';
import SystemPromptGenerator from '@/components/SystemPromptGenerator';
import ExportOptions from '@/components/ExportOptions';
import { ExtractedConcepts, SystemPromptResult, ExtractionResult, CognitiveKernelResult } from '@/types';
import { Persona } from '@/lib/prompt-templates';

const GenerationPage: React.FC = ({ }) => {
  const params = useParams();
  const persona = (params?.persona as Persona) ?? 'educator';
  const contentType = params.contentType as string; 
  const [extractedConcepts, setExtractedConcepts] = React.useState<ExtractedConcepts | null>(null);
  const [isProcessingDocument, setIsProcessingDocument] = React.useState<boolean>(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState<boolean>(false);
  const [generatedPromptResult, setGeneratedPromptResult] = React.useState<SystemPromptResult | undefined>(undefined);
  const [documentId, setDocumentId] = React.useState<string>(''); 
  const [fullExtractionResult, setFullExtractionResult] = React.useState<ExtractionResult | null>(null); 

  React.useEffect(() => {
    // console.log('[Educator Page useEffect] persona, contentType updated:', persona, contentType);
  }, [persona, contentType]);

  React.useEffect(() => {
    console.log('[Educator Page useEffect] generatedPromptResult state updated:', generatedPromptResult);
    if (generatedPromptResult) {
      console.log('[Educator Page useEffect] systemPrompt from state (first 200 chars):', generatedPromptResult.systemPrompt?.substring(0, 200));
      console.log('[Educator Page useEffect] systemPrompt from state total length:', generatedPromptResult.systemPrompt?.length);
    }
  }, [generatedPromptResult]); 

  const handleDocumentUpload = async (file: File) => {
    setIsProcessingDocument(true);
    setExtractedConcepts(null); 
    setFullExtractionResult(null); 
    setGeneratedPromptResult(undefined); 

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('persona', persona);

      const response = await fetch('/api/runExtraction', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorDetails = 'Extraction failed';
        try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.details || response.statusText;
        } catch {
            errorDetails = `Extraction failed with status: ${response.status} ${response.statusText}`;
        }
        console.error('Extraction failed:', errorDetails);
        alert(`Error: ${errorDetails}`); 
        setExtractedConcepts(null);
        setFullExtractionResult(null);
        return; 
      }

      const cognitiveKernelResult = await response.json() as CognitiveKernelResult; 
      console.log('Full Kernel Response From API:', cognitiveKernelResult); 

      if (cognitiveKernelResult && cognitiveKernelResult.extractionResult) {
        setExtractedConcepts(cognitiveKernelResult.extractionResult.finalConcepts); 
        setFullExtractionResult(cognitiveKernelResult.extractionResult); 
        setDocumentId(cognitiveKernelResult.extractionResult.documentId ?? ''); 
      } else {
        console.error('Extraction response not in expected CognitiveKernelResult format or extractionResult is missing:', cognitiveKernelResult);
        alert('Error: Received an unexpected response format from the server.');
        setExtractedConcepts(null);
        setFullExtractionResult(null);
        setDocumentId('');
      }

    } catch (err) {
      console.error('Error during document upload and extraction:', err);
      let errorMessage = "An unknown error occurred.";
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      alert(`Error: ${errorMessage}`);
      setExtractedConcepts(null);
      setFullExtractionResult(null);
      setDocumentId('');
    } finally {
      setIsProcessingDocument(false);
    }
  };

  const handleGeneratePrompt = async () => {
    setIsGeneratingPrompt(true);
    setGeneratedPromptResult(undefined);

    if (!fullExtractionResult || !fullExtractionResult.finalConcepts) {
        console.error('[Educator Page] No full extraction result or final concepts available to generate prompt.');
        alert('Please ensure a document has been processed and concepts are extracted before generating a prompt.');
        setIsGeneratingPrompt(false);
        return;
    }

    console.log('Attempting to generate prompt with:', {
        persona,
        contentType,
        extractedConcepts: fullExtractionResult.finalConcepts,
    });

    try {
        const response = await fetch('/api/generate-system-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                persona: persona, 
                contentType: contentType,
                extractedConcepts: fullExtractionResult.finalConcepts, 
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
            return; 
        }

        const resultData: SystemPromptResult = await response.json(); 
        console.log('[Educator Page] Received API response for generate-system-prompt:', resultData);
        setGeneratedPromptResult(resultData); 

    } catch (error) {
        console.error('Error in handleGeneratePrompt catch block:', error);
        alert(`An error occurred while generating the prompt: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
        setIsGeneratingPrompt(false);
    }
};

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Generate Prompt for {persona} / {contentType}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-1">
          {!extractedConcepts && !fullExtractionResult && (
            <DocumentUploader
              onUpload={handleDocumentUpload}
              acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']}
              isProcessing={isProcessingDocument}
              processingStatus={isProcessingDocument ? 'Processing document...' : undefined}
            />
          )}

          {extractedConcepts && (
            <div className="mt-8">
              <AnalysisPreview
                documentId={documentId} 
                extractedConcepts={extractedConcepts}
              />
            </div>
          )}
        </div>

        <div className="col-span-1">
          {extractedConcepts && (
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