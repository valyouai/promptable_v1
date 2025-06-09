import React, { useState } from 'react';

interface Props {
  title: string;
  children: React.ReactNode;
}

const UnifiedCollapsibleSection: React.FC<Props> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-4 border rounded shadow-sm bg-white p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-base font-semibold text-blue-600 hover:underline"
      >
        {expanded ? `▼ ${title}` : `▶ ${title}`}
      </button>

      {expanded && (
        <div className="mt-3">{children}</div>
      )}
    </div>
  );
};

export default UnifiedCollapsibleSection; 