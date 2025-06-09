"use client";

import React, { useState } from "react";
import PersonaSelector from "./PersonaSelector";
import ContentTypeSelector from "./ContentTypeSelector";
import ExtractionWorkspace from "../Phase16UI/ExtractionWorkspace";
import type { PersonaType } from "@/types";

const UploadWorkspace: React.FC = () => {
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);

  const handlePersonaSelect = (selectedPersona: PersonaType) => {
    setPersona(selectedPersona);
    setContentType(null); // reset content type if persona changes
  };

  const handleContentTypeSelect = (selectedContentType: string) => {
    setContentType(selectedContentType);
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
      {!persona ? (
        <PersonaSelector onSelect={handlePersonaSelect} />
      ) : !contentType ? (
        <ContentTypeSelector onSelect={handleContentTypeSelect} />
      ) : (
        <ExtractionWorkspace persona={persona} contentType={contentType} />
      )}
    </div>
  );
};

export default UploadWorkspace; 