import { PersonaTransferController } from "@/server/llm/persona-transfer/PersonaTransferController";
import { PersonaTransferInput } from "@/server/llm/persona-transfer/PersonaTransferTypes";

describe("Persona Transfer Controller", () => {
    it("should adapt for researcher (precise/balanced)", () => {
        const input: PersonaTransferInput = {
            ontologyConcepts: {
                ontologyPrinciples: ["Mapped Principle"],
                ontologyMethods: ["Mapped Method"],
                ontologyFrameworks: ["Mapped Framework"],
                ontologyTheories: ["Mapped Theory"],
            },
            persona: "researcher",
        };
        const output = PersonaTransferController.adapt(input);
        expect(output.personaPrinciples[0]).toBe("Mapped Principle (precise)");
        expect(output.personaMethods[0]).toBe("Mapped Method (precise)");
        expect(output.personaFrameworks[0]).toBe("Mapped Framework (precise)");
        expect(output.personaTheories[0]).toBe("Mapped Theory (precise)");
    });

    it("should adapt for educator (balanced)", () => {
        const input: PersonaTransferInput = {
            ontologyConcepts: {
                ontologyPrinciples: ["Mapped Principle"],
                ontologyMethods: ["Mapped Method"],
                ontologyFrameworks: ["Mapped Framework"],
                ontologyTheories: ["Mapped Theory"],
            },
            persona: "educator",
        };
        const output = PersonaTransferController.adapt(input);
        expect(output.personaPrinciples[0]).toBe("Mapped Principle (balanced)");
        expect(output.personaMethods[0]).toBe("Mapped Method (balanced)");
        expect(output.personaFrameworks[0]).toBe("Mapped Framework (balanced)");
        expect(output.personaTheories[0]).toBe("Mapped Theory (balanced)");
    });

    it("should adapt for creator (generalized/precise)", () => {
        const input: PersonaTransferInput = {
            ontologyConcepts: {
                ontologyPrinciples: ["Mapped Principle"],
                ontologyMethods: ["Mapped Method"],
                ontologyFrameworks: ["Mapped Framework"],
                ontologyTheories: ["Mapped Theory"],
            },
            persona: "creator",
        };
        const output = PersonaTransferController.adapt(input);
        expect(output.personaPrinciples[0]).toBe("Mapped Principle (generalized)"); // domainAdaptationFlexibility: 0.8
        expect(output.personaMethods[0]).toBe("Mapped Method (generalized)");    // semanticBridgeAggressiveness: 0.9
        expect(output.personaFrameworks[0]).toBe("Mapped Framework (generalized)"); // semanticBridgeAggressiveness: 0.9
        expect(output.personaTheories[0]).toBe("Mapped Theory (precise)");        // translationConservativeness: 0.1
    });

    it("should default to researcher profile for unknown persona", () => {
        const input: PersonaTransferInput = {
            ontologyConcepts: {
                ontologyPrinciples: ["Mapped Principle"],
                ontologyMethods: ["Mapped Method"],
                ontologyFrameworks: ["Mapped Framework"],
                ontologyTheories: ["Mapped Theory"],
            },
            persona: "unknown_persona_type",
        };
        const output = PersonaTransferController.adapt(input);
        expect(output.personaPrinciples[0]).toBe("Mapped Principle (precise)");
        expect(output.personaMethods[0]).toBe("Mapped Method (precise)");
        expect(output.personaFrameworks[0]).toBe("Mapped Framework (precise)");
        expect(output.personaTheories[0]).toBe("Mapped Theory (precise)");
    });
}); 