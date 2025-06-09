import { TraceabilityAgentEngine } from "@/server/llm/traceability-agent/TraceabilityAgentEngine";
import { ExtractedConcepts } from "@/types"; // Import ExtractedConcepts for typing the input

describe("Traceability Agent Engine", () => {
    it("should flag missing trace sources and not flag valid sources", () => {
        const input: ExtractedConcepts = {
            principles: [
                { value: "Sparse Representations", source: "" }, // Missing source
                { value: "Quantum Entanglement", source: "Section 3.1" } // Valid source
            ],
            methods: [
                { value: "Contrastive Tuning", source: "Page 2" }, // Valid source
                { value: "Backpropagation", source: "  " } // Effectively missing (whitespace only)
            ],
            frameworks: [], // Empty, should not cause issues
            theories: [
                { value: "String Theory", source: "Appendix A" } // Valid
            ],
        };

        const issues = TraceabilityAgentEngine.verifyTraceAnchors(input);

        expect(issues).toHaveLength(2);
        expect(issues).toContain('Missing source trace for principles → "Sparse Representations"');
        expect(issues).toContain('Missing source trace for methods → "Backpropagation"');
        expect(issues).not.toContain('Missing source trace for principles → "Quantum Entanglement"');
        expect(issues).not.toContain('Missing source trace for methods → "Contrastive Tuning"');
        expect(issues).not.toContain('Missing source trace for theories → "String Theory"');
    });

    it("should return no issues if all concepts have valid trace sources", () => {
        const input: ExtractedConcepts = {
            principles: [
                { value: "Superposition", source: "Page 1" }
            ],
            methods: [
                { value: "Gradient Descent", source: "Chapter 4" }
            ],
            frameworks: [
                { value: "TensorFlow", source: "Docs" }
            ],
            theories: [
                { value: "General Relativity", source: "Einstein 1915" }
            ],
        };
        const issues = TraceabilityAgentEngine.verifyTraceAnchors(input);
        expect(issues).toHaveLength(0);
    });

    it("should handle empty concept categories correctly", () => {
        const input: ExtractedConcepts = {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };
        const issues = TraceabilityAgentEngine.verifyTraceAnchors(input);
        expect(issues).toHaveLength(0);
    });

    it("should handle concepts with sources that are not empty but might need validation by other means", () => {
        const input: ExtractedConcepts = {
            principles: [{ value: "Test Principle", source: "Placeholder Source" }],
            methods: [],
            frameworks: [],
            theories: [],
        };
        const issues = TraceabilityAgentEngine.verifyTraceAnchors(input);
        expect(issues).toHaveLength(0); // verifyTraceAnchors only checks for empty/whitespace sources
    });
}); 