import React from "react";

interface Props {
  onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<Props> = ({ onFileUpload }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileUpload(file);
  };

  return (
    <div className="mb-6">
      <label htmlFor="file-upload" className="sr-only">
        Choose file
      </label>
      <input id="file-upload" name="file-upload" type="file" accept=".pdf,.docx,.txt" onChange={handleChange} />
    </div>
  );
};

export default FileUploader; 