import { PromptCompilerEngine } from "@/server/llm/prompt-compiler/PromptCompilerEngine";
import { PersonaTransferProfiles } from "@/server/llm/persona-transfer/PersonaTransferProfiles";

describe("Prompt Compiler Domain Expansion", () => {
    it("should synthesize domain-specific scaffold for law", () => {
        const input = {
            persona: "researcher",
            domain: "law",
            conceptSet: {
                personaPrinciples: ["Statutory Interpretation", "Precedent Weighting"],
                personaMethods: ["Case Analysis"],
                personaFrameworks: ["Regulatory Compliance Models"],
                personaTheories: ["Doctrine of Precedent"],
            },
            personaProfile: PersonaTransferProfiles["researcher"],
        };

        const output = PromptCompilerEngine.compile(input);
        expect(output.fullSystemPrompt).toContain("Legal Knowledge Application");
        expect(output.fullSystemPrompt).toContain("Regulatory Compliance Models");
    });
}); 