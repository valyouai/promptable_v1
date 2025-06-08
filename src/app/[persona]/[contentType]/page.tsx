"use client"; // Mark as a Client Component

import { useParams } from 'next/navigation';
import ExtractionWorkspace from "@/app/components/Phase16UI/ExtractionWorkspace";
import type { PersonaType } from "@/types";
import { ALLOWED_PERSONAS } from "@/types";

export default function ContentTypePage() {
  const params = useParams();
  const routePersona = params.persona as string;
  const routeContentType = params.contentType as string; // Get contentType

  if (!routePersona || !ALLOWED_PERSONAS.includes(routePersona as PersonaType)) {
    // Handle invalid or missing persona. You might want a dedicated error component here.
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">
          Error: Invalid or missing persona in URL. Allowed personas are: {ALLOWED_PERSONAS.join(', ')}.
        </p>
      </div>
    );
  }

  // Basic validation for contentType (e.g., ensure it's not empty)
  // More specific validation (e.g., against a predefined list) could be added if needed.
  if (!routeContentType || typeof routeContentType !== 'string' || routeContentType.trim() === '') {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-500">
          Error: Invalid or missing content type in URL.
        </p>
      </div>
    );
  }

  const currentPersona = routePersona as PersonaType;
  const currentContentType = routeContentType.trim();

  return <ExtractionWorkspace persona={currentPersona} contentType={currentContentType} />;
}
