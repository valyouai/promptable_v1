import React from 'react';
const AnalysisPreview = ({ documentId, extractedConcepts,
// onConceptSelect, // Removed from destructuring
 }) => {
    const { principles, methods, frameworks, theories } = extractedConcepts;
    // For MVP, we'll just display the concepts. Selection logic can be added later.
    return (<div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Document Analysis Preview</h2>
      <p className="text-gray-600 mb-4">Extracted concepts from your document (ID: {documentId}):</p>

      <div>
        <h3 className="text-lg font-semibold mb-2">Principles:</h3>
        {principles.length > 0 ? (<ul className="list-disc list-inside mb-4">
            {principles.map((p, index) => <li key={index}>{p}</li>)}
          </ul>) : (<p className="text-gray-500">No principles extracted.</p>)}

        <h3 className="text-lg font-semibold mb-2">Methods:</h3>
        {methods.length > 0 ? (<ul className="list-disc list-inside mb-4">
            {methods.map((m, index) => <li key={index}>{m}</li>)}
          </ul>) : (<p className="text-gray-500">No methods extracted.</p>)}

        <h3 className="text-lg font-semibold mb-2">Frameworks:</h3>
        {frameworks.length > 0 ? (<ul className="list-disc list-inside mb-4">
            {frameworks.map((f, index) => <li key={index}>{f}</li>)}
          </ul>) : (<p className="text-gray-500">No frameworks extracted.</p>)}

        <h3 className="text-lg font-semibold mb-2">Theories:</h3>
        {theories.length > 0 ? (<ul className="list-disc list-inside mb-4">
            {theories.map((t, index) => <li key={index}>{t}</li>)}
          </ul>) : (<p className="text-gray-500">No theories extracted.</p>)}
      </div>

      {/* Placeholder for concept selection/refinement UI */}
      <p className="text-sm text-gray-500 mt-4">Concept selection functionality will be added here in a later iteration.</p>
    </div>);
};
export default AnalysisPreview;
