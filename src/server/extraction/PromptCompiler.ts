// src/server/extraction/PromptCompiler.ts

/**
 * Phase 4 - Prompt Compiler v1
 * 
 * This module dynamically assembles the ExtractionEngine system prompt,
 * allowing injection of schema rules, few-shot examples, role definitions,
 * and context-specific prompt segments.
 */

export type DocumentContext = {
    title?: string;
    abstract?: string;
    keywords?: string[];
    domain?: string;
    additionalNotes?: string;
};

export class PromptCompiler {
    static compile(context: DocumentContext): string {
        const systemPreamble = this.buildPreamble();
        const schemaInstructions = this.buildSchemaInstructions();
        const fewShotExamples = this.buildFewShotExamples();
        const contextInjection = this.buildContextInjection(context);

        return [
            systemPreamble,
            schemaInstructions,
            fewShotExamples,
            contextInjection,
        ].join('\n\n');
    }

    private static buildPreamble(): string {
        return `You are a highly specialized academic concept extraction agent.
  Your task is to extract structured research concepts from scientific papers into clearly labeled fields.`;
    }

    private static buildSchemaInstructions(): string {
        return `Extract the following fields:
  - Research Objective
  - Methods
  - Dataset(s)
  - Key Findings
  - Limitations
  - Future Work
  - Applications
  - Citations
  - Keywords
  
  Always return the output in JSON format with strict field adherence.`;
    }

    private static buildFewShotExamples(): string {
        return `Example:
  Input:
  Title: "Deep Learning for Cancer Diagnosis"
  Abstract: "We propose a convolutional neural network to improve cancer diagnosis..."
  
  Output:
  {
    "Research Objective": "Improve cancer diagnosis using CNN models.",
    "Methods": "Convolutional Neural Networks, supervised training on labeled medical data.",
    "Dataset(s)": "LIDC-IDRI dataset",
    "Key Findings": "CNN outperformed traditional models by 15% accuracy.",
    "Limitations": "Limited dataset diversity; model may not generalize to rare cancers.",
    "Future Work": "Expand dataset and test on rare cancer types.",
    "Applications": "Medical diagnosis, clinical decision support.",
    "Citations": [],
    "Keywords": ["cancer diagnosis", "CNN", "deep learning"]
  }`;
    }

    private static buildContextInjection(context: DocumentContext): string {
        const { title, abstract, keywords, domain, additionalNotes } = context;

        let injection = `Document Context:`;

        if (title) injection += `\nTitle: ${title}`;
        if (abstract) injection += `\nAbstract: ${abstract}`;
        if (keywords?.length) injection += `\nKeywords: ${keywords.join(", ")}`;
        if (domain) injection += `\nDomain: ${domain}`;
        if (additionalNotes) injection += `\nNotes: ${additionalNotes}`;

        return injection;
    }
}
