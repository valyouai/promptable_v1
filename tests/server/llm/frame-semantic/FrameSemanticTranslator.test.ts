import { FrameSemanticTranslator } from "@/server/llm/frame-semantic/FrameSemanticTranslator";

describe("Frame-Semantic Translator", () => {
    it("should prefix frames correctly", () => {
        const input = {
            mappedConcepts: {
                mappedPrinciples: ["Test Principle"],
                mappedMethods: ["Test Method"],
                mappedFrameworks: ["Test Framework"],
                mappedTheories: ["Test Theory"],
            },
            persona: "educator",
        };

        const output = FrameSemanticTranslator.translate(input);
        expect(output.adaptedPrinciples[0]).toContain("[Frame: Principle]");
        expect(output.adaptedMethods[0]).toContain("[Frame: Method]");
        expect(output.adaptedFrameworks[0]).toContain("[Frame: Framework]");
        expect(output.adaptedTheories[0]).toContain("[Frame: Theory]");
    });
}); 