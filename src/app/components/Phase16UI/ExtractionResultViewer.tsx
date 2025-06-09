"use client";

import React from 'react';
import type { TraceableConcept, TransferKernelConceptSet } from '@/types';

// Props adjusted to expect TransferKernelConceptSet with TraceableConcept arrays
interface ExtractionResultViewerProps {
  data: TransferKernelConceptSet;
}

const ExtractionResultViewer: React.FC<ExtractionResultViewerProps> = ({ data }) => {
  // Rendering helper for any concept list
  const renderConceptList = (title: string, concepts: TraceableConcept[]) => (
    <div className="mb-4">
      <h3 className="text-md font-semibold mb-2">{title}</h3>
      {concepts.length === 0 ? (
        <p className="text-gray-500">No concepts found.</p>
      ) : (
        <ul className="list-disc ml-6">
          {concepts.map((concept, index) => (
            <li key={`${title}-${index}`}>
              <span className="font-semibold">{concept.value}</span>
              <span className="text-sm text-gray-500">
                {" "}
                (Source: {concept.source ?? 'N/A'}, Score: {concept.score?.toFixed(2) ?? 'N/A'})
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      {renderConceptList('Core Principles', data.personaPrinciples ?? [])}
      {renderConceptList('Key Methods', data.personaMethods ?? [])}
      {renderConceptList('Frameworks', data.personaFrameworks ?? [])}
      {renderConceptList('Theoretical Models', data.personaTheories ?? [])}
    </div>
  );
};

export default ExtractionResultViewer; 