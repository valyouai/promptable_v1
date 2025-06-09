import { TransferKernelEngine } from "@/server/llm/transfer-kernel/TransferKernelEngine";
import { ExtractedConcepts, PersonaType } from "@/types";
import { OntologyDomain } from "@/server/llm/ontology-scaffold/OntologyScaffoldTypes";

describe("Phase 22 Transfer Kernel Validation", () => {

    const baseExtraction: ExtractedConcepts = {
        principles: ["Tokenization"],
        methods: ["Attention Mechanism"],
        frameworks: ["Transformer Architecture"],
        theories: ["Self-Attention"],
        notes: "Base notes for testing preservation."
    };

    const personaScenarios: { persona: PersonaType; domain: OntologyDomain }[] = [
        { persona: "researcher", domain: "literature" },
        { persona: "educator", domain: "literature" }, // Test different persona, same domain
        { persona: "creator", domain: "literature" },  // Test different persona, same domain
        { persona: "researcher", domain: "education" },// Test same persona, different domain
        { persona: "educator", domain: "education" },
        { persona: "creator", domain: "business" },
        // Add more scenarios as needed, e.g., creator with education domain
        { persona: "creator", domain: "education" },
    ];

    personaScenarios.forEach(({ persona, domain }) => {
        it(`should correctly adapt transfer kernel for persona: ${persona}, domain: ${domain}`, () => {
            // Type assertion for domain to satisfy TransferKernelEngine's expected input
            const typedDomain = domain as OntologyDomain;

            const output = TransferKernelEngine.runTransfer(baseExtraction, persona, typedDomain);

            console.log(`\n--- Output for Persona: ${persona}, Domain: ${domain} ---`);
            console.dir(output, { depth: null });

            // Base checks - ensure arrays are populated
            expect(output.personaPrinciples.length).toBeGreaterThan(0);
            expect(output.personaMethods.length).toBeGreaterThan(0);
            expect(output.personaFrameworks.length).toBeGreaterThan(0);
            expect(output.personaTheories.length).toBeGreaterThan(0);

            // Spot check content based on expected transformations (simplified examples)
            if (persona === "researcher" && domain === "literature") {
                expect(output.personaPrinciples[0]).toContain("Text Segmentation");
                expect(output.personaPrinciples[0]).toContain("(precise)");
            }
            if (persona === "educator" && domain === "education") {
                expect(output.personaPrinciples[0]).toContain("Lesson Chunking");
                expect(output.personaPrinciples[0]).toContain("(balanced)");
            }
            if (persona === "creator" && domain === "business") {
                expect(output.personaPrinciples[0]).toContain("Process Decomposition");
                expect(output.personaPrinciples[0]).toContain("(generalized)");
            }
            if (persona === "creator" && domain === "literature") {
                expect(output.personaMethods[0]).toContain("Thematic Focus Mapping"); // From literature map
                expect(output.personaMethods[0]).toContain("(generalized)"); // From creator profile
            }
        });
    });

}); 