"use client";

import * as React from 'react';
import type { ExtractedConcepts } from '@/types';

interface AnalysisPreviewProps {
  documentId: string;
  extractedConcepts: ExtractedConcepts | null;
}

const AnalysisPreview: React.FC<AnalysisPreviewProps> = ({ documentId, extractedConcepts }) => {
  if (!extractedConcepts) {
    return <p>No concepts to display.</p>;
  }

  return (
    <div style={{ border: '1px solid #eee', padding: '20px', marginTop: '20px' }}>
      <h3>Analysis Preview (Placeholder)</h3>
      <p>Document ID: {documentId || 'N/A'}</p>
      <div>
        <h4>Extracted Concepts:</h4>
        {Object.entries(extractedConcepts).map(([key, value]) => {
          if (key === 'notes' && typeof value === 'string') {
            return <div key={key}><strong>{key}:</strong> <pre>{value}</pre></div>;
          }
          if (Array.isArray(value) && value.length > 0) {
            return (
              <div key={key}>
                <strong>{key}:</strong>
                <ul>
                  {value.map((item, index) => (
                    <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
                  ))}
                </ul>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default AnalysisPreview; 