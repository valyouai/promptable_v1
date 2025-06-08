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
import { getUnifiedTesseractWorker } from '@/lib/ocr/UnifiedTesseractWorker';

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
    const [systemPrompt, setSystemPrompt] = React.useState<string | null>(null);
    
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
        setDocumentId('');

        try {
            // Handle image files directly with client-side OCR
            if (file.type.startsWith("image/")) {
                console.log(`[Client OCR] Starting for image: ${file.name}`);
                const worker = await getUnifiedTesseractWorker({ language: 'eng', logger: console.log });
                const { data: { text } } = await worker.recognize(file);
                await worker.terminate();
                console.log(`[Client OCR] Completed for image: ${file.name}. Text length: ${text.length}`);

                const ocrConcepts: ExtractedConcepts = { 
                    principles: [text], 
                    methods: [], 
                    frameworks: [], 
                    theories: [],
                    notes: "Text extracted via client-side Tesseract OCR."
                };

                // Simulate a CognitiveKernelResult format from OCR text
                const simulatedResult: CognitiveKernelResult = {
                    extractionResult: {
                        finalConcepts: ocrConcepts,
                        ambiguityScores: [],
                        overallConfidence: 1.0, // Assuming high confidence for direct OCR text
                        fieldConfidences: [],
                        processingLog: ["Client-side OCR performed."],
                        documentId: `local-ocr-${Date.now()}`,
                    },
                    cognitiveOutput: { // Populating with placeholder data matching the type definitions
                        abductiveOutput: {
                            potentialHypotheses: [{
                                id: 'simulated-abductive-1',
                                hypothesis: 'Client-side OCR text available.',
                                justification: 'Text extracted directly from image on client.',
                                relatedFields: ['principles']
                            }]
                        },
                        gapDetectionOutput: {
                            identifiedGaps: [{
                                id: 'simulated-gap-1',
                                gapType: 'neglect',
                                description: 'No server-side gap analysis for client OCR.',
                                relatedFields: []
                            }]
                        },
                        analogicalMappingOutput: {
                            mappedAnalogies: [{
                                id: 'simulated-analogy-1',
                                sourceField: 'clientOCR',
                                targetField: 'initialText',
                                sourceConcept: text.substring(0, 50), // Example concept
                                targetConcept: 'N/A for client OCR simulation',
                                alignmentScore: 1.0,
                                reasoning: 'Direct text from client-side OCR.'
                            }]
                        },
                        relevanceFilteringOutput: {
                            filteredConcepts: ocrConcepts, // Use the OCR concepts here
                            filteringLog: [{
                                id: 'simulated-filter-1',
                                persona: selectedPersonaForUpload, // Use the actual persona
                                field: 'all',
                                action: 'retain',
                                reason: 'All client-side OCR text retained by default.'
                            }]
                        },
                        orchestrationLog: ["Simulated cognitive orchestration for client-side OCR."]
                    }
                };
                setCognitiveKernelResult(simulatedResult);
                if (simulatedResult.extractionResult && simulatedResult.extractionResult.finalConcepts) {
                    setExtractedConcepts(simulatedResult.extractionResult.finalConcepts);
                }
                if (simulatedResult.extractionResult && simulatedResult.extractionResult.documentId) {
                    setDocumentId(simulatedResult.extractionResult.documentId);
                }
                setIsProcessingDocument(false);
                return; // Early exit — don't call server API for images
            }

            // For non-image files — continue using your API
            console.log(`[Server Upload] Processing non-image file: ${file.name} (${file.type})`);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('persona', selectedPersonaForUpload);

            const response = await fetch('/api/runExtraction', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result: CognitiveKernelResult = await response.json();
                console.log("Extraction Result:", result);
                setCognitiveKernelResult(result);
                if (result.extractionResult && result.extractionResult.finalConcepts) {
                    setExtractedConcepts(result.extractionResult.finalConcepts);
                    if (result.extractionResult.documentId) {
                        setDocumentId(result.extractionResult.documentId);
                    }
                } else {
                    setErrorState({ message: "Extraction via server completed, but no final concepts found in the result." });
                }
            } else {
                const errorData = await response.json().catch(() => ({ message: "Failed to parse error response from server", details: response.statusText }));
                console.error("Extraction failed:", errorData);
                throw new Error(errorData.details || errorData.message || `HTTP error! status: ${response.status}`);
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
        setGeneratedPromptResult(null);

        console.log('Generating system prompt with (from page.tsx):', JSON.stringify({ extractedConcepts, persona, contentType, generationConfig: config }, null, 2));

        try {
            const response = await fetch('/api/generate-system-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ extractedConcepts, persona, contentType, generationConfig: config }),
            });

            const responseText = await response.text();  // <-- capture raw text first

            try {
                const result: SystemPromptResult = JSON.parse(responseText);
                setGeneratedPromptResult(result);
                setSystemPrompt(result.systemPrompt);
            } catch {
                console.error("Failed to parse LLM response as JSON:", responseText);
                setErrorState({
                    message: "LLM returned invalid response",
                    details: responseText.substring(0, 500), // just show first 500 chars of raw HTML for debug
                });
                setGeneratedPromptResult(null);
                setSystemPrompt(null);
            }

        } catch (error: unknown) {
            console.error("Error generating system prompt:", error);
            const message = error instanceof Error ? error.message : "Failed to generate system prompt.";
            const details = error instanceof Error ? error.stack : String(error);
            setErrorState({ message, details });
            setGeneratedPromptResult(null);
            setSystemPrompt(null);
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
                            acceptedTypes={['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'image/jpeg', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff']}
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
                    {systemPrompt && (
                        <div className="mt-8">
                            <h4>Directly from `systemPrompt` state:</h4>
                            <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px', border: '1px solid green' }}>
                                {systemPrompt}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DynamicPersonaPage;
