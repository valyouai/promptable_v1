import React from 'react';

interface ExportOptionsProps {
  systemPrompt: string;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({ systemPrompt }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(systemPrompt)
      .then(() => alert('System prompt copied to clipboard!'))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const handleDownload = () => {
    const blob = new Blob([systemPrompt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system_prompt.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    alert('Share link functionality is not yet implemented in MVP.');
  };

  return (
    <div className="mt-8 p-6 bg-gray-50 rounded-lg shadow-inner">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Export Options</h2>
      <div className="flex space-x-4">
        <button
          onClick={handleCopy}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Copy to Clipboard
        </button>
        <button
          onClick={handleDownload}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
        >
          Download as TXT
        </button>
        <button
          onClick={handleShare}
          className="px-6 py-2 bg-gray-400 text-gray-800 font-medium rounded-md cursor-not-allowed"
          disabled
        >
          Share Link (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default ExportOptions; 