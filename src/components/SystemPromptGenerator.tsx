"use client";

import * as React from 'react';
import type { ExtractedConcepts, SystemPromptResult, GenerationConfig } from '@/types';

interface SystemPromptGeneratorProps {
  extractedConcepts: ExtractedConcepts | null;
  onGenerate: (config: GenerationConfig) => void;
  isGenerating?: boolean;
  generatedPromptResult?: SystemPromptResult | null;
}

const SystemPromptGenerator: React.FC<SystemPromptGeneratorProps> = 
  ({ extractedConcepts, onGenerate, isGenerating, generatedPromptResult }) => {
  
  const [config, setConfig] = React.useState<GenerationConfig>({}); // Simple config state for the placeholder

  const handleGenerateClick = () => {
    if (extractedConcepts) {
      onGenerate(config); // Pass current config state
    }
  };

  // Basic input to simulate changing generation config
  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
        setConfig(JSON.parse(e.target.value));
    } catch (err) {
        console.warn("Invalid JSON for config:", err);
        setConfig({ rawText: e.target.value }); // Fallback to raw text if JSON is invalid
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: '20px', marginTop: '20px' }}>
      <h3>System Prompt Generator (Placeholder)</h3>
      {!extractedConcepts && <p>Waiting for extracted concepts...</p>}
      {extractedConcepts && (
        <>
          <div>
            <h4>Generation Configuration (JSON):</h4>
            <textarea 
                rows={3} 
                style={{ width: '100%', border: '1px solid #ddd', padding: '5px'}} 
                placeholder='Enter JSON config, e.g., { "tone": "formal" }' 
                onChange={handleConfigChange}
                aria-label="Generation configuration in JSON format"
            />
          </div>
          <button onClick={handleGenerateClick} disabled={isGenerating || !extractedConcepts} style={{ marginTop: '10px' }}>
            {isGenerating ? 'Generating...' : 'Generate System Prompt'}
          </button>
        </>
      )}
      {generatedPromptResult && (
        <div style={{ marginTop: '10px' }}>
          <h4>Generated Prompt Result:</h4>
          {generatedPromptResult.success ? (
            <pre style={{ whiteSpace: 'pre-wrap', background: '#f9f9f9', padding: '10px' }}>
              {generatedPromptResult.systemPrompt}
            </pre>
          ) : (
            <p style={{ color: 'red' }}>Failed to generate prompt.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SystemPromptGenerator; 