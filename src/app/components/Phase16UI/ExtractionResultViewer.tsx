import React from "react";
import type { ExtractedConcepts } from "@/types";

interface Props {
  data: ExtractedConcepts;
}

const ExtractionResultViewer: React.FC<Props> = ({ data }) => {
  const renderList = (title: string, items: string[]) => (
    <div className="mb-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {items.length > 0 ? (
        <ul className="list-disc list-inside">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No items found.</p>
      )}
    </div>
  );

  return (
    <div className="my-6">
      {renderList("Principles", data.principles)}
      {renderList("Methods", data.methods)}
      {renderList("Frameworks", data.frameworks)}
      {renderList("Theories", data.theories)}
    </div>
  );
};

export default ExtractionResultViewer; 