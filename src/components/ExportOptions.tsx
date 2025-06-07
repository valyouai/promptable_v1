"use client";

import * as React from 'react';
import type { SystemPromptResult, ExtractedConcepts } from '@/types';

interface ExportOptionsProps {
  systemPromptResult: SystemPromptResult | null;
  extractedConcepts: ExtractedConcepts | null;
  // Add other props as needed, e.g., for different export formats or persona-specific options
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ systemPromptResult, extractedConcepts }) => {
  if (!systemPromptResult || !systemPromptResult.success) {
    return <p style={{ marginTop: '10px' }}>No system prompt available to export.</p>;
  }

  const handleExportJson = () => {
    const exportData = {
      systemPrompt: systemPromptResult.systemPrompt,
      extractedConcepts: extractedConcepts,
      metadata: systemPromptResult.metadata,
    };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptable-export-${systemPromptResult.metadata.documentTitle || 'untitled'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Exported data as JSON:", exportData);
  };

  const handleExportText = () => {
    let textContent = `System Prompt:\n${systemPromptResult.systemPrompt}\n\n`;
    textContent += `Extracted Concepts:\n${JSON.stringify(extractedConcepts, null, 2)}\n\n`;
    textContent += `Metadata:\n${JSON.stringify(systemPromptResult.metadata, null, 2)}`;

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promptable-export-${systemPromptResult.metadata.documentTitle || 'untitled'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("Exported data as Text");
  };

  return (
    <div style={{ border: '1px solid #eee', padding: '20px', marginTop: '20px' }}>
      <h3>Export Options (Placeholder)</h3>
      <p>System Prompt generated successfully. You can now export the results.</p>
      <div style={{ marginTop: '10px'}}>
        <button onClick={handleExportJson} style={{ marginRight: '10px' }}>Export as JSON</button>
        <button onClick={handleExportText}>Export as Text</button>
      </div>
      {/* Add more export options here as needed */}
    </div>
  );
};

export default ExportOptions; 