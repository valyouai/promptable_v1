import { PromptCompilerInput, CompiledPromptOutput } from "./PromptCompilerTypes";
import { DomainTransferProfiles } from "@/server/llm/domain-profiles/DomainTransferProfiles";
import { conceptToString } from '../utils/conceptToString';

export class PromptCompilerEngine {
    static compile(input: PromptCompilerInput): CompiledPromptOutput {
        console.log("--- Persona-Aware Prompt Compiler Activated (Domain-Aware) ---");

        const { persona, domain, conceptSet, personaProfile } = input;

        // Ensure domain and persona are strings (already guaranteed by type, but good for runtime safety if types were looser)
        const safePersona = persona ?? "(unspecified persona)";
        const safeDomainKey = domain ?? "(unspecified domain key)";

        const domainProfile = DomainTransferProfiles[safeDomainKey] || DomainTransferProfiles["business"]; // Default fallback

        // Safe access to domainProfile properties
        const safeDomainDisplayName = domainProfile?.domain ?? "(unspecified domain name)";
        const safeDomainDescription = domainProfile?.description ?? "(no domain description provided)";
        const safeScaffoldingInstructions = domainProfile?.scaffoldingInstructions ?? "(no scaffolding instructions provided)";

        const verbosityFactor = personaProfile.domainAdaptationFlexibility; // These are numbers, no ?? needed unless they could be undefined
        const theoryDepth = personaProfile.translationConservativeness;
        const exampleAggression = personaProfile.semanticBridgeAggressiveness;

        // Concept formatting using conceptToString utility
        const principles = conceptSet.personaPrinciples.map(p =>
            `${conceptToString(p)}${verbosityFactor > 0.6 ? " — critical foundation for this task" : ""}`
        ).join(", ") || "(no principles provided)";

        const methods = conceptSet.personaMethods.map(m =>
            `${conceptToString(m)}${exampleAggression > 0.6 ? " (explore variations actively)" : ""}`
        ).join(", ") || "(no methods provided)";

        const frameworks = conceptSet.personaFrameworks.map(f =>
            conceptToString(f) // No specific suffix in original code for frameworks beyond what conceptToString provides
        ).join(", ") || "(no frameworks provided)";

        const theories = conceptSet.personaTheories.map(t =>
            `${conceptToString(t)}${theoryDepth > 0.6 ? " (requires deeper theoretical understanding)" : ""}`
        ).join(", ") || "(no theories provided)";

        // Master System Prompt Template
        // Using {{domainKey}} for the input.domain and {{domainDisplayName}} for domainProfile.domain
        const systemPromptTemplate = `
You are an AI {{persona}} operating in the domain of {{domainDisplayName}} (context key: {{domainKey}}).

Domain Context:
{{domainDescription}}

Core Principles:
{{principles}}

Key Methods:
{{methods}}

Frameworks:
{{frameworks}}

Theoretical Models:
{{theories}}

Instructional Scaffolding Guidelines:
{{scaffoldingInstructions}}

Instructional Style:
- Adjust explanations based on audience skill.
- Balance theory and practice dynamically.
- Emphasize key adaptations for task success.
    `;

        // Perform safe replacements
        let compiled = systemPromptTemplate;
        compiled = compiled.replace("{{persona}}", safePersona);
        compiled = compiled.replace("{{domainKey}}", safeDomainKey); // As per your plan using input.domain (key)
        compiled = compiled.replace("{{domainDisplayName}}", safeDomainDisplayName); // Display name from profile
        compiled = compiled.replace("{{domainDescription}}", safeDomainDescription);
        compiled = compiled.replace("{{principles}}", principles);
        compiled = compiled.replace("{{methods}}", methods);
        compiled = compiled.replace("{{frameworks}}", frameworks);
        compiled = compiled.replace("{{theories}}", theories);
        compiled = compiled.replace("{{scaffoldingInstructions}}", safeScaffoldingInstructions);

        return {
            fullSystemPrompt: compiled.trim(), // Trim to remove leading/trailing newlines from template
            traceMap: { // TraceMap remains crucial
                principles: conceptSet.personaPrinciples,
                methods: conceptSet.personaMethods,
                frameworks: conceptSet.personaFrameworks,
                theories: conceptSet.personaTheories,
            }
        };
    }
} 