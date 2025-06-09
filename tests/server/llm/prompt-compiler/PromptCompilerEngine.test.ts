import { PromptCompilerEngine } from "@/server/llm/prompt-compiler/PromptCompilerEngine";

describe("Prompt Compiler Engine", () => {
    it("should generate dynamic scaffold for researcher", () => {
        const input = {
            persona: "researcher",
            domain: "AI Research",
            conceptSet: {
                personaPrinciples: ["Sparse Representations", "Latent Compression"],
                personaMethods: ["Contrastive Tuning"],
                personaFrameworks: ["Semantic Kernel Engine"],
                personaTheories: ["Structure Mapping Theory"],
            },
            personaProfile: {
                domainAdaptationFlexibility: 0.2,
                semanticBridgeAggressiveness: 0.1,
                translationConservativeness: 0.9,
            },
        };

        const output = PromptCompilerEngine.compile(input);
        expect(output.fullSystemPrompt).toContain("Sparse Representations");
        expect(output.fullSystemPrompt).toContain("requires deeper theoretical understanding");
    });
}); 