import React from 'react';
import type { AbductiveHypothesisOutput, Hypothesis } from '@/types';
import DebugDataInspector from './DebugDataInspector';
import UnifiedCollapsibleSection from './UnifiedCollapsibleSection';

interface Props {
  data: AbductiveHypothesisOutput;
}

const AbductiveHypothesesViewer: React.FC<Props> = ({ data }) => {
  return (
    <UnifiedCollapsibleSection title="Abductive Hypotheses">
      <div className="p-4 border rounded-md bg-white shadow-sm my-4">
        <h2 className="text-lg font-semibold mb-2">
          --- DEBUG: AbductiveHypothesesViewer ---
        </h2>

        {data.potentialHypotheses.length === 0 ? (
          <p>No hypotheses generated.</p>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {data.potentialHypotheses.map((hypothesis: Hypothesis) => (
              <li key={hypothesis.id}>
                <div className="font-medium">{hypothesis.hypothesis}</div>
                <div className="text-sm text-gray-600">
                  Justification: {hypothesis.justification}
                </div>
              </li>
            ))}
          </ul>
        )}
        <DebugDataInspector label="AbductiveHypotheses" data={data} />
      </div>
    </UnifiedCollapsibleSection>
  );
};

export default AbductiveHypothesesViewer; 