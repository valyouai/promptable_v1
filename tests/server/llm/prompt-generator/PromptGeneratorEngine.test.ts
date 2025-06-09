import { PromptGeneratorEngine } from "@/server/llm/prompt-generator/PromptGeneratorEngine";

describe("Prompt Generator Engine", () => {
    it("should generate valid educator system prompt", () => {
        const input = {
            persona: "educator",
            domain: "AI Art",
            conceptSet: {
                personaPrinciples: ["Prompt Engineering", "Stable Diffusion Parameters"],
                personaMethods: ["img2img", "inpainting"],
                personaFrameworks: ["Stable Diffusion", "DALL-E 2"],
                personaTheories: ["Text-to-Image Models", "Classifier-Free Guidance"],
            },
        };

        const output = PromptGeneratorEngine.generate(input);
        expect(output.fullSystemPrompt).toContain("You are an AI educator");
        expect(output.fullSystemPrompt).toContain("Prompt Engineering");
        expect(output.fullSystemPrompt).toContain("img2img");
    });
}); 