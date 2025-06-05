import React from 'react';

interface DocumentUploaderProps {
  onUpload: (file: File) => void;
  acceptedTypes: string[];
  isProcessing: boolean;
  processingStatus?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUpload,
  acceptedTypes,
  isProcessing,
  processingStatus,
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onUpload(event.target.files[0]);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
        disabled={isProcessing}
      />
      <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
        {isProcessing ? processingStatus || 'Processing...' : 'Drag & Drop or Click to Upload Document'}
      </label>
      {isProcessing && (
        <p className="mt-2 text-sm text-gray-500">{processingStatus}</p>
      )}
    </div>
  );
};

export default DocumentUploader; 