"use client";

import React from 'react';
import Link from 'next/link';

const educatorContentTypes = [
  {
    name: "Learning Theory Implementer",
    description: "Extract pedagogical principles into teaching AI",
    example: "Apply cognitive load theory from research to AI lesson planning.",
    route: "/educator/learning-theory-implementer"
  },
  {
    name: "Assessment Strategy Generator",
    description: "Turn research into evaluation framework prompts",
    example: "Distill a paper on formative assessment into AI-generated quiz questions.",
    route: "/educator/assessment-strategy-generator"
  },
  {
    name: "Curriculum Design Assistant",
    description: "Extract educational structures and sequences",
    example: "Analyze a curriculum framework to generate prompts for course outlines.",
    route: "/educator/curriculum-design-assistant"
  },
  {
    name: "Student Engagement Optimizer",
    description: "Convert engagement research into practical AI tools",
    example: "Transform a study on gamification into AI prompts for interactive learning.",
    route: "/educator/student-engagement-optimizer"
  },
  {
    name: "Knowledge Transfer Framework",
    description: "Transform learning research into AI tutoring prompts",
    example: "Convert a paper on effective tutoring into AI-guided student support prompts.",
    route: "/educator/knowledge-transfer-framework"
  },
  {
    name: "Educational Technology Integrator",
    description: "Extract EdTech principles for AI implementation",
    example: "Analyze research on blended learning to generate prompts for tech integration.",
    route: "/educator/educational-technology-integrator"
  },
];

export default function EducatorPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">Choose Your Content Type (Educator)</h1>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {educatorContentTypes.map((type, index) => (
          <Link href={type.route} key={index}>
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-gray-600 mb-4">{type.description}</p>
              <p className="text-sm text-gray-500 italic">Example: {type.example}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
