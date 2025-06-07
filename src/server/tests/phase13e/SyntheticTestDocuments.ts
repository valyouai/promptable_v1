export const SyntheticTestDocuments = {
    FullyClear: `
    This research introduces the agile methodology, focusing on principles of rapid adaptation, flexibility, and self-organization. 
    Methods employed include Scrum, Kanban, and Extreme Programming. The framework is based on the Agile Manifesto.
    Theories include Lean Theory and Complex Adaptive Systems.
  `,

    HighlyAmbiguous: `
    This paper discusses several ideas that may or may not apply to iterative processes. Certain aspects could align with adaptive thinking.
    Some frameworks seem relevant, although further clarity is needed. Multiple methods are under evaluation but not conclusively defined.
  `,

    DependencyConflict: `
    The research heavily emphasizes Self-Organization and Adaptation principles. However, methods remain unclear.
    Frameworks possibly involved include Scrum and SAFE, but no strong link is established.
    Theories are indirectly referenced through Evolutionary Theory.
  `,

    RecoveryKeywordTest: `
    The document mentions adaptation, self-organization, agile manifesto, Kanban, Lean Theory, and Scrum.
    However, no explicit categorization is provided.
  `,

    // 🔬 Additional edge tests for Phase 13E robustness:
    PartialRecoveryOnly: `
    This study slightly references adaptation and agile but omits most direct methods or frameworks.
  `,

    NoSignal: `
    This text discusses philosophical approaches without directly addressing methods, frameworks, or principles.
  `
}; 