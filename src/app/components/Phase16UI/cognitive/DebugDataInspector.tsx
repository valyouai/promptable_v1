import React, { useState } from 'react';

interface DebugDataInspectorProps {
  label: string;
  data: unknown;
}

const DebugDataInspector: React.FC<DebugDataInspectorProps> = ({ label, data }) => {
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('Copied raw data to clipboard');
  };

  return (
    <div className="mt-2 border-t pt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-semibold text-blue-600 hover:underline"
      >
        {expanded ? `Hide ${label} Debug Data` : `Show ${label} Debug Data`}
      </button>

      {expanded && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <pre>{JSON.stringify(data, null, 2)}</pre>
          <button
            onClick={handleCopy}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Copy JSON
          </button>
        </div>
      )}
    </div>
  );
};

export default DebugDataInspector; 