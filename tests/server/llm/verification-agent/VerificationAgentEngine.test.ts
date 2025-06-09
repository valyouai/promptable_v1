import { VerificationAgentEngine } from "@/server/llm/verification-agent/VerificationAgentEngine";

describe("Verification Agent Engine", () => {
    it("should detect missing domain label", () => {
        const input = {
            systemPrompt: "You are an AI educator.",
            persona: "educator",
            domain: "medicine",
        };

        const result = VerificationAgentEngine.verify(input);
        expect(result.passed).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues).toContain("Domain label missing from prompt.");
    });

    it("should pass clean prompt", () => {
        const input = {
            systemPrompt: "You are an AI educator operating in the domain of medicine.\nInstructional Style:",
            persona: "educator",
            domain: "medicine",
        };

        const result = VerificationAgentEngine.verify(input);
        expect(result.passed).toBe(true);
        expect(result.issues.length).toBe(0);
    });

    it("should detect placeholder terms", () => {
        const input = {
            systemPrompt: "You are an AI researcher operating in the domain of AI Art.\nCore Principles: lorem ipsum\nInstructional Style:",
            persona: "researcher",
            domain: "AI Art",
        };
        const result = VerificationAgentEngine.verify(input);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain("Detected placeholder or undefined term: 'lorem ipsum'.");
    });

    it("should detect missing instructional style header", () => {
        const input = {
            systemPrompt: "You are an AI creator operating in the domain of business.",
            persona: "creator",
            domain: "business",
        };
        const result = VerificationAgentEngine.verify(input);
        expect(result.passed).toBe(false);
        expect(result.issues).toContain("Instructional scaffold header missing.");
    });

}); 