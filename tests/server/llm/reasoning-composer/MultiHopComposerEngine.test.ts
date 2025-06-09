import { MultiHopComposerEngine } from "@/server/llm/reasoning-composer/MultiHopComposerEngine";

describe("Multi-Hop Reasoning Composer", () => {
    it("should compose reasoning chains from concept set", () => {
        const input = {
            conceptSet: {
                personaPrinciples: ["Prompt Engineering"],
                personaMethods: ["img2img"],
                personaFrameworks: ["Stable Diffusion"],
                personaTheories: ["Text-to-Image Models"],
            },
            persona: "educator",
            domain: "ai_art",
        };

        const output = MultiHopComposerEngine.compose(input);
        expect(output.composedMappings).toContain('Apply principle "Prompt Engineering" using method "img2img".');
        expect(output.composedMappings).toContain('Use method "img2img" within framework "Stable Diffusion".');
        expect(output.composedMappings).toContain('Framework "Stable Diffusion" reflects theory "Text-to-Image Models".');
    });
}); 