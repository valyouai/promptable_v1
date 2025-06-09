export interface DomainTransferProfile {
    domain: string;
    description: string;
    scaffoldingInstructions: string;
}

export const DomainTransferProfiles: Record<string, DomainTransferProfile> = {
    "ai_art": {
        domain: "AI Art Generation",
        description: "Applying diffusion models, prompt engineering, and generative workflows to create images, art assets, and visual outputs.",
        scaffoldingInstructions: `
- Explain prompt structure with modifiers, weights, and embeddings.
- Cover models: Stable Diffusion, Midjourney, DALL-E.
- Discuss sampler selection, CFG scale, and denoising techniques.
- Include negative prompts and seed manipulation examples.
- Support img2img, inpainting, and upscaling.
`,
    },

    "medicine": {
        domain: "Medical Research Translation",
        description: "Translating clinical studies, treatment protocols, and research findings into applied healthcare instruction.",
        scaffoldingInstructions: `
- Explain clinical methodologies and trial structures.
- Translate research outcomes into clinical guidelines.
- Highlight evidence levels and contraindications.
- Prioritize patient safety frameworks.
- Distinguish between hypothesis vs validated protocols.
`,
    },

    "law": {
        domain: "Legal Knowledge Application",
        description: "Adapting legal doctrine, case law, and statutory interpretation into advisory prompts.",
        scaffoldingInstructions: `
- Translate legal precedents into practical advisory steps.
- Map statutes to compliance obligations.
- Highlight jurisdictional differences where applicable.
- Avoid unauthorized legal advice language.
- Include citations to legal authority where possible.
`,
    },

    "engineering": {
        domain: "Technical Systems Design",
        description: "Transforming engineering research into applied system designs, specifications, and build instructions.",
        scaffoldingInstructions: `
- Map theoretical models into applied systems.
- Emphasize design constraints and tradeoffs.
- Include calculations, tolerances, and material choices.
- Reference relevant engineering standards.
- Provide stepwise implementation scaffolds.
`,
    },

    "education": {
        domain: "Instructional Design",
        description: "Translating subject matter into scaffolded lesson plans and student-centered learning sequences.",
        scaffoldingInstructions: `
- Sequence concepts from fundamentals to application.
- Include examples, exercises, and practice assessments.
- Adapt explanation depth by learner proficiency.
- Include scaffolding strategies for error correction.
- Reference curriculum standards where applicable.
`,
    },

    "business": {
        domain: "Business Strategy Adaptation",
        description: "Transforming management frameworks, market research, and business models into applied advisory scaffolds.",
        scaffoldingInstructions: `
- Translate strategy frameworks into actionable steps.
- Include SWOT, market positioning, and risk assessments.
- Emphasize KPI development and performance metrics.
- Map frameworks to specific business stages.
- Support cross-functional integration (finance, ops, marketing).
`,
    },
}; 