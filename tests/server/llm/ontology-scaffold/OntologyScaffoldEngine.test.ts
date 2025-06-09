import { OntologyScaffoldEngine } from "@/server/llm/ontology-scaffold/OntologyScaffoldEngine";
import { FrameAdaptedConcepts } from "@/server/llm/frame-semantic/FrameSemanticTypes";
import { OntologyDomain } from "@/server/llm/ontology-scaffold/OntologyScaffoldTypes";

describe("Ontology Scaffold Engine", () => {
    it("should correctly map for literature domain", () => {
        const inputAdaptedConcepts: FrameAdaptedConcepts = {
            adaptedPrinciples: ["[Frame: Principle] Tokenization"],
            adaptedMethods: ["[Frame: Method] Attention Mechanism"],
            adaptedFrameworks: ["[Frame: Framework] Transformer Architecture"],
            adaptedTheories: ["[Frame: Theory] Self-Attention"],
        };
        const input = {
            frameAdaptedConcepts: inputAdaptedConcepts,
            domain: "literature" as OntologyDomain,
            persona: "researcher",
        };

        const output = OntologyScaffoldEngine.map(input);
        expect(output.ontologyPrinciples).toContain("Text Segmentation");
        expect(output.ontologyMethods).toContain("Thematic Focus Mapping");
        expect(output.ontologyFrameworks).toContain("Narrative Structure Model");
        expect(output.ontologyTheories).toContain("Motif Recurrence Hypothesis");
    });

    it("should correctly map for education domain", () => {
        const inputAdaptedConcepts: FrameAdaptedConcepts = {
            adaptedPrinciples: ["[Frame: Principle] Tokenization"],
            adaptedMethods: ["[Frame: Method] Attention Mechanism"],
            adaptedFrameworks: ["[Frame: Framework] Transformer Architecture"],
            adaptedTheories: ["[Frame: Theory] Self-Attention"],
        };
        const input = {
            frameAdaptedConcepts: inputAdaptedConcepts,
            domain: "education" as OntologyDomain,
            persona: "educator",
        };

        const output = OntologyScaffoldEngine.map(input);
        expect(output.ontologyPrinciples).toContain("Lesson Chunking");
        expect(output.ontologyMethods).toContain("Active Engagement Technique");
        expect(output.ontologyFrameworks).toContain("Instructional Sequencing Model");
        expect(output.ontologyTheories).toContain("Student Personalization Principle");
    });

    it("should correctly map for business domain", () => {
        const inputAdaptedConcepts: FrameAdaptedConcepts = {
            adaptedPrinciples: ["[Frame: Principle] Tokenization"],
            adaptedMethods: ["[Frame: Method] Attention Mechanism"],
            adaptedFrameworks: ["[Frame: Framework] Transformer Architecture"],
            adaptedTheories: ["[Frame: Theory] Self-Attention"],
        };
        const input = {
            frameAdaptedConcepts: inputAdaptedConcepts,
            domain: "business" as OntologyDomain,
            persona: "creator",
        };

        const output = OntologyScaffoldEngine.map(input);
        expect(output.ontologyPrinciples).toContain("Process Decomposition");
        expect(output.ontologyMethods).toContain("Resource Prioritization");
        expect(output.ontologyFrameworks).toContain("Workflow Coordination Model");
        expect(output.ontologyTheories).toContain("Market Signal Amplification Theory");
    });

    it("should return original term if no mapping exists", () => {
        const inputAdaptedConcepts: FrameAdaptedConcepts = {
            adaptedPrinciples: ["[Frame: Principle] Unknown Principle"],
            adaptedMethods: ["[Frame: Method] Obscure Method"],
            adaptedFrameworks: [],
            adaptedTheories: [],
        };
        const input = {
            frameAdaptedConcepts: inputAdaptedConcepts,
            domain: "literature" as OntologyDomain,
            persona: "researcher",
        };

        const output = OntologyScaffoldEngine.map(input);
        expect(output.ontologyPrinciples).toContain("[Frame: Principle] Unknown Principle");
        expect(output.ontologyMethods).toContain("[Frame: Method] Obscure Method");
    });

    it("should map base concepts if frame prefix is missed but base term exists in map", () => {
        const inputAdaptedConcepts: FrameAdaptedConcepts = {
            adaptedPrinciples: ["Tokenization"], // No [Frame: ...] prefix
            adaptedMethods: ["[Frame: Method] Attention Mechanism"], // With prefix
            adaptedFrameworks: [],
            adaptedTheories: [],
        };
        const input = {
            frameAdaptedConcepts: inputAdaptedConcepts,
            domain: "literature" as OntologyDomain,
            persona: "researcher",
        };
        const output = OntologyScaffoldEngine.map(input);
        expect(output.ontologyPrinciples).toContain("Text Segmentation"); // Mapped from base term
        expect(output.ontologyMethods).toContain("Thematic Focus Mapping"); // Mapped with prefix
    });
}); 