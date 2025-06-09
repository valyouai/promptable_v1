import React from 'react';
import type { AnalogicalMappingOutput, AnalogicalMapping } from '@/types';
import DebugDataInspector from './DebugDataInspector';
import UnifiedCollapsibleSection from './UnifiedCollapsibleSection';

interface Props {
  data: AnalogicalMappingOutput;
}

const AnalogicalMappingViewer: React.FC<Props> = ({ data }) => {
  return (
    <UnifiedCollapsibleSection title="Analogical Mapping Results">
      <div className="p-4 border rounded-md bg-white shadow-sm my-4">
        <h2 className="text-lg font-semibold mb-2">
          --- DEBUG: AnalogicalMappingViewer ---
        </h2>

        {data.mappedAnalogies.length === 0 ? (
          <p>No analogies mapped.</p>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {data.mappedAnalogies.map((mapping: AnalogicalMapping) => (
              <li key={mapping.id}>
                <div className="font-medium">
                  {mapping.sourceConcept} ➔ {mapping.targetConcept}
                </div>
                <div className="text-sm text-gray-600">
                  Source Field: {mapping.sourceField} | Target Field: {mapping.targetField}
                </div>
                <div className="text-sm text-gray-500">
                  Alignment Score: {mapping.alignmentScore.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  Reasoning: {mapping.reasoning}
                </div>
              </li>
            ))}
          </ul>
        )}
        <DebugDataInspector label="AnalogicalMapping" data={data} />
      </div>
    </UnifiedCollapsibleSection>
  );
};

export default AnalogicalMappingViewer; 