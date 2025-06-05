import React, { useState } from 'react';
import { GenerationConfig } from '@/lib/prompt-templates';

interface SystemPromptGeneratorProps {
  onGenerate: (config: GenerationConfig) => void;
  isLoading: boolean;
}

const SystemPromptGenerator: React.FC<SystemPromptGeneratorProps> = ({
  onGenerate,
  isLoading,
}) => {
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [complexityLevel, setComplexityLevel] = useState<GenerationConfig['complexityLevel']>('intermediate');
  const [outputStyle, setOutputStyle] = useState<GenerationConfig['outputStyle']>('directive');

  const handleGenerate = () => {
    const config: GenerationConfig = {
      focusAreas,
      complexityLevel,
      outputStyle,
    };
    onGenerate(config);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Generate System Prompt</h2>

      {/* Customization Options */}
      <div className="mb-4">
        <label htmlFor="focusAreas" className="block text-gray-700 text-sm font-bold mb-2">Focus Areas (comma-separated):</label>
        <input
          type="text"
          id="focusAreas"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={focusAreas.join(', ')}
          onChange={(e) => setFocusAreas(e.target.value.split(',').map(s => s.trim()))}
          placeholder="e.g., Principle 1, Method 2"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="complexity" className="block text-gray-700 text-sm font-bold mb-2">Complexity Level:</label>
        <select
          id="complexity"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={complexityLevel}
          onChange={(e) => setComplexityLevel(e.target.value as GenerationConfig['complexityLevel'])}
        >
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="outputStyle" className="block text-gray-700 text-sm font-bold mb-2">Output Style:</label>
        <select
          id="outputStyle"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={outputStyle}
          onChange={(e) => setOutputStyle(e.target.value as GenerationConfig['outputStyle'])}
        >
          <option value="directive">Directive</option>
          <option value="conversational">Conversational</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Generating...' : 'Generate System Prompt'}
      </button>

      {/* The following block that renders the prompt is being removed,
         as the parent page (page.tsx) is responsible for displaying the final prompt. 
         Keeping this would result in a duplicate rendering.
      */}
      {/* 
      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded-md">
          <h3 className="text-lg font-bold mb-2">Generated Prompt:</h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-200 p-3 rounded-md">{result.systemPrompt}</pre>
          {/* Export Options will go here later * /}
        </div>
      )}
      */}
    </div>
  );
};

export default SystemPromptGenerator; 