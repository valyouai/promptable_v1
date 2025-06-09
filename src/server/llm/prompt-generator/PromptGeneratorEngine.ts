import { PromptGeneratorInput, SystemPromptOutput } from "./PromptGeneratorTypes";
import { PersonaPromptTemplates } from "./PromptTemplates";

export class PromptGeneratorEngine {
    static generate(input: PromptGeneratorInput): SystemPromptOutput {
        console.log("--- Prompt Generator Activated ---");

        const template = PersonaPromptTemplates[input.persona] || PersonaPromptTemplates["researcher"];

        const interpolate = (block: string): string =>
            block
                .replace("{{domain}}", input.domain)
                .replace("{{principles}}", input.conceptSet.personaPrinciples.join(", "))
                .replace("{{methods}}", input.conceptSet.personaMethods.join(", "))
                .replace("{{frameworks}}", input.conceptSet.personaFrameworks.join(", "))
                .replace("{{theories}}", input.conceptSet.personaTheories.join(", "));

        return {
            fullSystemPrompt: interpolate(template),
        };
    }
} 