"use client";

import * as React from 'react';
import { useParams } from 'next/navigation';
import DocumentUploader from '@/components/DocumentUploader';
import AnalysisPreview from '@/components/AnalysisPreview';
import SystemPromptGenerator from '@/components/SystemPromptGenerator';
import ExportOptions from '@/components/ExportOptions';
import type {
    ExtractedConcepts,
    CognitiveKernelResult,
    SystemPromptResult,
    PersonaType, 
    GenerationConfig
} from '@/types';
import { ALLOWED_PERSONAS } from '@/types';

// Placeholder for a simple Error Boundary or error display component
const KernelErrorBoundary: React.FC<{ error: { message: string; details?: string } | null }> = ({ error }) => {
    if (!error) return null;
    return (
        <div style={{ border: '1px solid red', color: 'red', padding: '10px', margin: '10px 0' }}>
            <h4>Error Occurred</h4>
            <p><strong>Message:</strong> {error.message}</p>
            {error.details && <p><strong>Details:</strong> {error.details}</p>}
        </div>
    );
};

const DynamicPersonaPage: React.FC = () => {
    const params = useParams();
    const [persona, setPersona] = React.useState<PersonaType | null>(null);
    const [contentType, setContentType] = React.useState<string | null>(null);

    // State Management
    const [documentId, setDocumentId] = React.useState<string>('');
    const [cognitiveKernelResult, setCognitiveKernelResult] = React.useState<CognitiveKernelResult | null>(null);
    const [extractedConcepts, setExtractedConcepts] = React.useState<ExtractedConcepts | null>(null);
    const [generatedPromptResult, setGeneratedPromptResult] = React.useState<SystemPromptResult | null>(null);
    
    const [isProcessingDocument, setIsProcessingDocument] = React.useState<boolean>(false);
    const [isGeneratingPrompt, setIsGeneratingPrompt] = React.useState<boolean>(false);
    const [errorState, setErrorState] = React.useState<{ message: string; details?: string } | null>(null);

    React.useEffect(() => {
        const routePersona = params.persona as string;
        const routeContentType = params.contentType as string;

        if (ALLOWED_PERSONAS.includes(routePersona as PersonaType)) {
            setPersona(routePersona as PersonaType);
        } else {
            setErrorState({ message: `Invalid persona in URL: ${routePersona}. Allowed: ${ALLOWED_PERSONAS.join(', ')}` });
            setPersona(null);
        }
        setContentType(routeContentType || 'default');
    }, [params]);

    const handleDocumentUpload = async (file: File, selectedPersonaForUpload: PersonaType) => {
        if (!selectedPersonaForUpload) {
            setErrorState({ message: "Persona not selected or invalid for upload." });
            return;
        }
        setIsProcessingDocument(true);
        setErrorState(null);
        setCognitiveKernelResult(null);
        setExtractedConcepts(null);
        setGeneratedPromptResult(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('persona', selectedPersonaForUpload);

        try {
            const response = await fetch('/api/runExtraction', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from server", details: response.statusText }));
                throw new Error(errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result: CognitiveKernelResult = await response.json();
            setCognitiveKernelResult(result);
            if (result.extractionResult && result.extractionResult.finalConcepts) {
                setExtractedConcepts(result.extractionResult.finalConcepts);
                if (result.extractionResult.documentId) {
                    setDocumentId(result.extractionResult.documentId);
                }
            } else {
                setErrorState({ message: "Extraction completed, but no final concepts found in the result." });
            }
        } catch (error: unknown) {
            console.error("Error during document upload/extraction:", error);
            const message = error instanceof Error ? error.message : "Failed to process document.";
            const details = error instanceof Error ? error.stack : String(error);
            setErrorState({ message, details });
        }
        setIsProcessingDocument(false);
    };

    const handleGenerateSystemPrompt = async (config: GenerationConfig) => {
        if (!extractedConcepts || !persona || !contentType) {
            setErrorState({ message: "Cannot generate system prompt: Missing extracted concepts, persona, or content type." });
            return;
        }
        setIsGeneratingPrompt(true);
        setErrorState(null);

        try {
            const response = await fetch('/api/generate-system-prompt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    extractedConcepts,
                    persona,
                    contentType,
                    generationConfig: config,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from server", details: response.statusText }));
                throw new Error(errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result: SystemPromptResult = await response.json();
            setGeneratedPromptResult(result);
        } catch (error: unknown) {
            console.error("Error generating system prompt:", error);
            const message = error instanceof Error ? error.message : "Failed to generate system prompt.";
            const details = error instanceof Error ? error.stack : String(error);
            setErrorState({ message, details });
        }
        setIsGeneratingPrompt(false);
    };

    if (!persona) {
        return (
            <div className="container mx-auto p-4">
                <KernelErrorBoundary error={errorState} />
                {!errorState && <p>Loading persona information or invalid persona...</p>}
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4 capitalize">Dynamic Persona Page: {persona} - {contentType}</h1>
            
            <KernelErrorBoundary error={errorState} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-1">
                    {!cognitiveKernelResult && (
                        <DocumentUploader
                            onUpload={(file: File) => handleDocumentUpload(file, persona)} 
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
                            extractedConcepts={extractedConcepts}
                            onGenerate={handleGenerateSystemPrompt} 
                            isGenerating={isGeneratingPrompt}
                            generatedPromptResult={generatedPromptResult}
                        />
                    )}
                    {generatedPromptResult && generatedPromptResult.success && (
                         <div className="mt-8">
                            <ExportOptions 
                                systemPromptResult={generatedPromptResult} 
                                extractedConcepts={extractedConcepts} 
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DynamicPersonaPage;
