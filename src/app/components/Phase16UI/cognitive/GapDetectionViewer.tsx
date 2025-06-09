import React from 'react';
import type { GapDetectionOutput, IdentifiedGap } from '@/types';
import DebugDataInspector from './DebugDataInspector';
import UnifiedCollapsibleSection from './UnifiedCollapsibleSection';

interface Props {
  data: GapDetectionOutput;
}

const GapDetectionViewer: React.FC<Props> = ({ data }) => {
  return (
    <UnifiedCollapsibleSection title="Gap Detection Results">
      <div className="p-4 border rounded-md bg-white shadow-sm my-4">
        <h2 className="text-lg font-semibold mb-2">
          --- DEBUG: GapDetectionViewer ---
        </h2>

        {data.identifiedGaps.length === 0 ? (
          <p>No gaps identified.</p>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {data.identifiedGaps.map((gap: IdentifiedGap) => (
              <li key={gap.id}>
                <div className="font-medium">Gap Type: {gap.gapType}</div>
                <div className="text-sm text-gray-600">Description: {gap.description}</div>
                <div className="text-sm text-gray-500">Related Fields: {gap.relatedFields.join(', ')}</div>
              </li>
            ))}
          </ul>
        )}
        <DebugDataInspector label="GapDetection" data={data} />
      </div>
    </UnifiedCollapsibleSection>
  );
};

export default GapDetectionViewer; 