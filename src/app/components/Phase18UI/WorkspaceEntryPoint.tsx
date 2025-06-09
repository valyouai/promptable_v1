"use client";

import React, { useState } from "react";
import PersonaSelector from "./PersonaSelector";
import ContentTypeSelector from "./ContentTypeSelector";
import ExtractionWorkspace from "../Phase16UI/ExtractionWorkspace";
import type { PersonaType } from "@/types";

const WorkspaceEntryPoint: React.FC = () => {
  const [persona, setPersona] = useState<PersonaType | null>(null);
  const [contentType, setContentType] = useState<string | null>(null);

  if (persona && contentType) {
    return (
      <ExtractionWorkspace persona={persona} contentType={contentType} />
    );
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-semibold mb-4">Select Persona & Content Type</h1>
      <PersonaSelector onSelect={setPersona} />
      {persona && <ContentTypeSelector onSelect={setContentType} />}
    </div>
  );
};

export default WorkspaceEntryPoint; 