"use client";

import React from "react";
import type { ExtractedConcepts } from "@/types";

interface Props {
  extractedConcepts: ExtractedConcepts;
  synthesizedPrompt: string | null;
  onGenerate: () => void;
  isGenerating: boolean;
}

const SystemPromptGenerator: React.FC<Props> = ({
  synthesizedPrompt,
  onGenerate,
  isGenerating,
}) => {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">System Prompt Output</h2>

      <button
        onClick={onGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={isGenerating}
      >
        {isGenerating ? "Generating..." : "Generate System Prompt"}
      </button>

      {synthesizedPrompt && (
        <div className="mt-6 p-4 border rounded bg-gray-50 whitespace-pre-wrap">
          {synthesizedPrompt}
        </div>
      )}
    </div>
  );
};

export default SystemPromptGenerator; 