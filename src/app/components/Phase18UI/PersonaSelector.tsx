"use client";

import React from "react";
import type { PersonaType } from "@/types";

// Temporary stub values, to be replaced by the constants provided in the mission brief
const PERSONAS: PersonaType[] = ["researcher", "educator", "creator"];

interface PersonaSelectorProps {
  onSelect: (persona: PersonaType) => void;
}

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center mb-6">
      <h2 className="text-xl font-semibold mb-2">Select Persona</h2>
      <div className="flex gap-4">
        {PERSONAS.map((persona) => (
          <button
            key={persona}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => onSelect(persona)}
          >
            {persona.charAt(0).toUpperCase() + persona.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PersonaSelector; 