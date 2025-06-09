import { SMELiteEngine } from "@/server/llm/sme-lite/SMELiteEngine";

describe("SME-Lite Engine", () => {
    it("should return valid mappings from basic input", () => {
        const input = {
            finalConcepts: {
                principles: ["Test Principle"],
                methods: ["Test Method"],
                frameworks: ["Test Framework"],
                theories: ["Test Theory"],
            },
            persona: "researcher",
        };

        const output = SMELiteEngine.map(input);
        expect(output.mappedPrinciples).toContain("Test Principle");
    });
}); 