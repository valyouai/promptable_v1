"use client";
import React from 'react';
import Link from 'next/link';
const creatorContentTypes = [
    {
        name: "Visual Content Analysis System",
        description: "Extract visual principles for AI image/video tools",
        example: "Analyze an image to generate prompts for style transfer.",
        route: "/creator/visual-content-analysis"
    },
    {
        name: "Content Strategy Framework",
        description: "Turn research into content creation methodology",
        example: "Distill a marketing research paper into a content calendar strategy.",
        route: "/creator/content-strategy-framework"
    },
    {
        name: "Narrative Structure Extractor",
        description: "Extract storytelling patterns and techniques",
        example: "Analyze a screenplay to generate prompts for plot development.",
        route: "/creator/narrative-structure-extractor"
    },
    {
        name: "Creative Process Optimizer",
        description: "Transform research into creative workflow prompts",
        example: "Convert a study on brainstorming techniques into AI-guided ideation prompts.",
        route: "/creator/creative-process-optimizer"
    },
    {
        name: "Brand Voice Synthesizer",
        description: "Extract communication patterns and tone frameworks",
        example: "Analyze brand guidelines to create prompts for consistent brand messaging.",
        route: "/creator/brand-voice-synthesizer"
    },
    {
        name: "Innovation Methodology Builder",
        description: "Convert innovation research into actionable AI prompts",
        example: "Transform a design thinking paper into prompts for new product development.",
        route: "/creator/innovation-methodology-builder"
    },
];
export default function CreatorPage() {
    return (<div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">Choose Your Content Type (Creator)</h1>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {creatorContentTypes.map((type, index) => (<Link href={type.route} key={index}>
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-gray-600 mb-4">{type.description}</p>
              <p className="text-sm text-gray-500 italic">Example: {type.example}</p>
            </div>
          </Link>))}
      </section>
    </div>);
}
