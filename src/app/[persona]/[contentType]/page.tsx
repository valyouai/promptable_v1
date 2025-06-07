"use client";

import * as React from 'react';
import { useState } from 'react';
// Import CognitiveKernelResult and related types if needed for stronger typing of response
// For now, we'll cast the response data as any for brevity, but proper typing is recommended.
import type { ExtractedConcepts, CognitiveKernelResult } from '@/types'; 
import { useParams } from 'next/navigation';

// Define a simple interface for expected API error responses
interface ApiErrorResponse {
  error?: string;
  details?: string;
}

export default function GenerationPage() {
  const params = useParams();
  const persona = params.persona as string;
  const contentType = params.contentType as string;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<ExtractedConcepts | null>(null);
  const [processingLog, setProcessingLog] = useState<string[] | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
        setUploadStatus('');
        setAnalysisResult(null);
        setProcessingLog(null);
      } else {
        setSelectedFile(null);
        setUploadStatus('Unsupported file type. Please upload PDF, TXT, or DOCX.');
        setAnalysisResult(null);
        setProcessingLog(null);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first.');
      return;
    }

    setUploadStatus('Uploading and analyzing...');
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('persona', persona); // Dynamically append persona

    try {
      const response = await fetch('/api/runExtraction', { 
        method: 'POST',
        body: formData,
      });

      // Try to parse JSON first, then check response.ok
      const data = await response.json(); 

      if (response.ok && data && (data as CognitiveKernelResult).extractionResult) {
        const cognitiveResult = data as CognitiveKernelResult;
        setUploadStatus('Analysis successful!');
        setAnalysisResult(cognitiveResult.extractionResult.finalConcepts);
        setProcessingLog(cognitiveResult.extractionResult.processingLog || []);
        console.log("Full API Response:", cognitiveResult);
      } else {
        // Handle error: data might be an error object or something else
        const errorData = data as ApiErrorResponse;
        const errorMsg = errorData.error || 'Analysis failed due to unknown server error.';
        const errorDetails = errorData.details || (response.statusText !== "OK" ? response.statusText : '');
        setUploadStatus(`Analysis failed: ${errorMsg}${errorDetails ? ' - ' + errorDetails : ''}`);
        setAnalysisResult(null);
        setProcessingLog(null);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('An error occurred during analysis. Check console for details.');
      setAnalysisResult(null);
      setProcessingLog(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
        Generate Prompt for {persona.charAt(0).toUpperCase() + persona.slice(1)} - {contentType.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </h1>

      <section className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">Upload Your Document</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Drag and drop your files here, or click to select</p>
          <input type="file" className="hidden" id="file-upload" onChange={handleFileChange} />
          <label htmlFor="file-upload" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
            Browse Files
          </label>
          {selectedFile && (
            <p className="mt-4 text-md text-gray-700">Selected file: <span className="font-semibold">{selectedFile.name}</span></p>
          )}
          <p className="mt-4 text-sm text-gray-500">Supported formats: PDF, TXT, DOCX</p>
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile}
            className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Upload and Analyze
          </button>
          {uploadStatus && (
            <p className="mt-4 text-md font-medium text-gray-800">{uploadStatus}</p>
          )}
          {/* Display Processing Log instead of just extracted text preview */}
          {processingLog && processingLog.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Processing Log:</h3>
              <ul className="list-disc list-inside text-gray-700 text-sm max-h-48 overflow-y-auto">
                {processingLog.map((logEntry, index) => <li key={index}>{logEntry}</li>)}
              </ul>
            </div>
          )}
          {analysisResult && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Extracted Concepts (from CognitiveKernelResult):</h3>
              {analysisResult.principles && analysisResult.principles.length > 0 && (
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Principles:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.principles.map((p: string, i: number) => <li key={i}>{p}</li>)}
                  </ul>
                </div>
              )}
              {analysisResult.methods && analysisResult.methods.length > 0 && (
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Methods:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.methods.map((m: string, i: number) => <li key={i}>{m}</li>)}
                  </ul>
                </div>
              )}
              {analysisResult.frameworks && analysisResult.frameworks.length > 0 && (
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Frameworks:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.frameworks.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
              {analysisResult.theories && analysisResult.theories.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700">Theories:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.theories.map((t: string, i: number) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
              {(!analysisResult.principles || analysisResult.principles.length === 0) &&
                (!analysisResult.methods || analysisResult.methods.length === 0) &&
                (!analysisResult.frameworks || analysisResult.frameworks.length === 0) &&
                (!analysisResult.theories || analysisResult.theories.length === 0) && (
                  <p className="text-gray-600">No specific concepts, methods, frameworks, or theories were extracted.</p>
                )}
              {/* Optionally display notes if they exist and are relevant */}
              {analysisResult.notes && (
                 <div className="mt-2">
                  <h4 className="font-semibold text-gray-700">Notes:</h4>
                  <p className="text-gray-600 whitespace-pre-wrap">{analysisResult.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
