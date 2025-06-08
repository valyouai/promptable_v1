import React from "react";

interface Props {
  error: string | null;
}

const KernelErrorBoundary: React.FC<Props> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="p-4 mb-4 bg-red-100 text-red-800 border border-red-400 rounded">
      <h4 className="font-semibold">An error occurred</h4>
      <p>{error}</p>
    </div>
  );
};

export default KernelErrorBoundary; 