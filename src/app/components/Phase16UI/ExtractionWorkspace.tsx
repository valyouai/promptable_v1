"use client";

import React, { useState } from "react";
import FileUploader from "./FileUploader";
import ExtractionProgress from "./ExtractionProgress";
import ExtractionResultViewer from "./ExtractionResultViewer";
import SystemPromptGenerator from "./SystemPromptGenerator";
import KernelErrorBoundary from "./KernelErrorBoundary";
import type { PersonaType, CognitiveKernelResult, ExtractedConcepts, TransferKernelConceptSet } from "@/types";
import AbductiveHypothesesViewer from './cognitive/AbductiveHypothesesViewer';
import GapDetectionViewer from './cognitive/GapDetectionViewer';
import AnalogicalMappingViewer from './cognitive/AnalogicalMappingViewer';
import RelevanceFilteringViewer from './cognitive/RelevanceFilteringViewer';
import DebugDataInspector from './cognitive/DebugDataInspector';

interface ExtractionWorkspaceProps {
  persona: PersonaType;
  contentType: string;
}

const ExtractionWorkspace: React.FC<ExtractionWorkspaceProps> = ({ persona, contentType }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CognitiveKernelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [synthesizedPrompt, setSynthesizedPrompt] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setSynthesizedPrompt(null);
    setPromptError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("persona", persona);
      const response = await fetch("/api/runExtraction", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || errorData.details || errorDetails;
        } catch {
          errorDetails = response.statusText || errorDetails;
        }
        throw new Error(errorDetails);
      }

      const data: CognitiveKernelResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      console.error("Error during file upload:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred during extraction.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSystemPrompt = async () => {
    if (!result?.extractionResult?.finalConcepts) return;
    setIsGeneratingPrompt(true);
    setPromptError(null);
    setSynthesizedPrompt(null);
    try {
      const response = await fetch("/api/generate-system-prompt", {
        method: "POST",
        body: JSON.stringify({
          extractedConcepts: result.extractionResult.finalConcepts,
          persona,
          contentType,
          generationConfig: {}
        }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || errorData.details || errorDetails;
        } catch {
          errorDetails = response.statusText || errorDetails;
        }
        throw new Error(errorDetails);
      }

      const data = await response.json();
      console.log("🔎 Synthesis Response:", data);
      setSynthesizedPrompt(data.synthesizedPrompt.content);
    } catch (err: unknown) {
      console.error("Error during prompt synthesis:", err);
      if (err instanceof Error) {
        setPromptError(err.message);
      } else {
        setPromptError("An unknown error occurred during system prompt generation.");
      }
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col p-8 overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-4">Upload Research Document</h1>
      <FileUploader onFileUpload={handleFileUpload} />

      {loading && <ExtractionProgress />}
      {error && <KernelErrorBoundary error={error} />}
      {result && !loading && (() => {
        // Source remains ExtractedConcepts for displayConcepts
        const displayConcepts: ExtractedConcepts | undefined = result?.cognitiveOutput?.relevanceFilteringOutput?.filteredConcepts 
          ?? result?.extractionResult?.finalConcepts;
        
        // Adapter helper
        const convertExtractedToTransferKernel = (concepts: ExtractedConcepts): TransferKernelConceptSet => ({
          personaPrinciples: concepts.principles ?? [],
          personaMethods: concepts.methods ?? [],
          personaFrameworks: concepts.frameworks ?? [],
          personaTheories: concepts.theories ?? [],
        });

        if (!displayConcepts) {
          return null; 
        }

        return (
          <>
            <h2 className="text-lg font-bold mb-2">--- DEBUG: ExtractionResultViewer ---</h2>
            {/* Use adapter to pass correct data structure */}
            <ExtractionResultViewer data={convertExtractedToTransferKernel(displayConcepts)} />

            {result.cognitiveOutput?.abductiveOutput && (
              <AbductiveHypothesesViewer data={result.cognitiveOutput.abductiveOutput} />
            )}

            {result?.cognitiveOutput?.gapDetectionOutput && (
              <GapDetectionViewer data={result.cognitiveOutput.gapDetectionOutput} />
            )}

            {result?.cognitiveOutput?.analogicalMappingOutput && (
              <AnalogicalMappingViewer data={result.cognitiveOutput.analogicalMappingOutput} />
            )}

            {result?.cognitiveOutput?.relevanceFilteringOutput && (
              <RelevanceFilteringViewer data={result.cognitiveOutput.relevanceFilteringOutput} />
            )}

            {/* PHASE 20: Display Self-Correction Details */}
            {result?.extractionResult?.selfCorrectionDetails && (
              <DebugDataInspector label="SelfCorrectionDetails" data={result.extractionResult.selfCorrectionDetails} />
            )}

            <h2 className="text-lg font-bold mb-2">--- DEBUG: SystemPromptGenerator ---</h2>
            <SystemPromptGenerator
              extractedConcepts={displayConcepts}
              synthesizedPrompt={synthesizedPrompt}
              onGenerate={handleGenerateSystemPrompt}
              isGenerating={isGeneratingPrompt}
            />
            {promptError && (
              <div className="mt-4 p-4 border border-red-500 bg-red-100 text-red-700 rounded">
                <p className="font-semibold">System Prompt Generation Error:</p>
                <p>{promptError}</p>
              </div>
            )}
          </>
        );
      })()}

      {/* HARNESS CONTROLS */}
      {process.env.NEXT_PUBLIC_TEST_MODE === 'true' && (
        <div className="mt-10 p-4 border border-red-500 bg-red-100 rounded">
          <h3 className="font-bold text-red-700 mb-2">17D Test Harness Controls</h3>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded mr-4"
            onClick={async () => {
              await fetch("/api/runExtraction?forceError=true");
            }}
          >
            Simulate Extraction Failure
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={async () => {
              await fetch("/api/generate-system-prompt?forceError=true");
            }}
          >
            Simulate Synthesis Failure
          </button>
        </div>
      )}
    </div>
  );
};

export default ExtractionWorkspace; 