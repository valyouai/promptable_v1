import React from 'react';
import type { RelevanceFilteringOutput, FilteringLogEntry } from '@/types';
import DebugDataInspector from './DebugDataInspector';
import UnifiedCollapsibleSection from './UnifiedCollapsibleSection';

interface Props {
  data: RelevanceFilteringOutput;
}

const RelevanceFilteringViewer: React.FC<Props> = ({ data }) => {
  return (
    <UnifiedCollapsibleSection title="Relevance Filtering Log">
      <div className="p-4 border rounded-md bg-white shadow-sm my-4">
        <h2 className="text-lg font-semibold mb-2">
          --- DEBUG: RelevanceFilteringViewer ---
        </h2>

        {data.filteringLog.length === 0 ? (
          <p>No filtering actions taken.</p>
        ) : (
          <ul className="list-disc list-inside space-y-2">
            {data.filteringLog.map((entry: FilteringLogEntry) => (
              <li key={entry.id}>
                <div className="font-medium">
                  Field: {entry.field} | Action: {entry.action.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600">
                  Persona: {entry.persona} | Reason: {entry.reason}
                </div>
              </li>
            ))}
          </ul>
        )}
        <DebugDataInspector label="RelevanceFiltering" data={data} />
      </div>
    </UnifiedCollapsibleSection>
  );
};

export default RelevanceFilteringViewer; 