"use client";
import * as React from 'react';

interface DocumentUploaderProps {
  onUpload: (file: File) => void;
  acceptedTypes?: string[];
  isProcessing?: boolean;
  processingStatus?: string;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUpload, acceptedTypes, isProcessing, processingStatus }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onUpload(event.target.files[0]);
    }
  };

  return (
    <div style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>
      <h3>Document Uploader (Placeholder)</h3>
      <input type="file" onChange={handleFileChange} accept={acceptedTypes?.join(',')} disabled={isProcessing} aria-label="File uploader" />
      {isProcessing && <p>{processingStatus || "Processing..."}</p>}
      <p className="text-sm text-gray-500 mt-2">
        Supported types: {acceptedTypes ? acceptedTypes.join(', ') : 'any'}
      </p>
    </div>
  );
};

export default DocumentUploader; 