"use client";
import React from 'react';
import Link from 'next/link';
const researcherContentTypes = [
    {
        name: "Methodology Replicator",
        description: "Extract research methods into systematic AI prompts",
        example: "Analyze a scientific paper to generate prompts for replicating its experimental setup.",
        route: "/researcher/methodology-replicator"
    },
    {
        name: "Literature Analysis Framework",
        description: "Turn papers into comprehensive review AI systems",
        example: "Distill multiple research articles into prompts for a systematic literature review.",
        route: "/researcher/literature-analysis-framework"
    },
    {
        name: "Hypothesis Generation Engine",
        description: "Extract reasoning patterns for AI research assistance",
        example: "Analyze a dataset and related papers to generate prompts for new hypotheses.",
        route: "/researcher/hypothesis-generation-engine"
    },
    {
        name: "Data Analysis Systematizer",
        description: "Convert analytical approaches into AI data processing prompts",
        example: "Transform a statistical analysis paper into prompts for data cleaning and modeling.",
        route: "/researcher/data-analysis-systematizer"
    },
    {
        name: "Research Question Formulator",
        description: "Extract inquiry patterns into question-generating AI",
        example: "Analyze a research proposal to generate prompts for refining research questions.",
        route: "/researcher/research-question-formulator"
    },
    {
        name: "Academic Writing Optimizer",
        description: "Transform writing research into AI writing assistant prompts",
        example: "Convert a guide on academic writing into prompts for structuring a thesis.",
        route: "/researcher/academic-writing-optimizer"
    },
];
export default function ResearcherPage() {
    return (<div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">Choose Your Content Type (Researcher)</h1>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {researcherContentTypes.map((type, index) => (<Link href={type.route} key={index}>
            <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
              <p className="text-gray-600 mb-4">{type.description}</p>
              <p className="text-sm text-gray-500 italic">Example: {type.example}</p>
            </div>
          </Link>))}
      </section>
    </div>);
}
