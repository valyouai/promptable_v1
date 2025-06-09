"use client";

import React from "react";

// Temporary stub values, to be replaced by the constants provided in the mission brief
const CONTENT_TYPES = [
  "literature-analysis-framework",
  "research-question-formulator",
  "data-analysis-systematizer",
];

interface ContentTypeSelectorProps {
  onSelect: (contentType: string) => void;
}

const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <h2 className="text-xl font-semibold mb-2">Select Content Type</h2>
      <div className="flex gap-4 flex-wrap justify-center">
        {CONTENT_TYPES.map((contentType) => (
          <button
            key={contentType}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => onSelect(contentType)}
          >
            {contentType}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentTypeSelector; 