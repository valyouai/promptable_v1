export const schemaDriftMocks = {
    sample1: {
        chunk1: {
            // Represents "principles" under different key names
            aliasPrinciple1: {
                mockResponse: { "Principle": "Emergent Behavior" },
                fullDocumentText: "This document discusses Emergent Behavior. Key methods include agent-based modeling and reinforcement learning. The system framework is often a multi-agent system or cellular automata. This relates to complexity theory and game theory."
            },
            aliasPrinciple2: {
                mockResponse: { "key_principles": ["Decentralization"] },
                fullDocumentText: "Focusing on Decentralization. No specific methods like genetic algorithm mentioned here. No frameworks like actor model. No theories such as network theory."
            },
            aliasPrinciple3: {
                mockResponse: { "Primary Ideas": "Adaptation" },
                fullDocumentText: "Primary Ideas include Adaptation. This text does not detail methods, frameworks, or theories for brevity."
            },
            // Represents "methods" under different key names
            aliasMethod1: {
                mockResponse: { "Methodologies": ["Swarm Intelligence Algo"] },
                fullDocumentText: "Methodologies cover Swarm Intelligence Algo. The core principle is self-organization. The relevant framework could be multi-agent system. The theory is network theory."
            },
            aliasMethod2: {
                mockResponse: { "approaches": "Genetic Algorithm" },
                fullDocumentText: "Approaches feature Genetic Algorithm. We also consider the principle of robustness. No specific framework mentioned. The underlying theory is game theory."
            },
            // Represents "frameworks" with varied casing or phrasing
            aliasFramework1: {
                mockResponse: { "Frameworks": ["Multi-Agent System"] },
                fullDocumentText: "Frameworks include Multi-Agent System. This supports principles like modularity. Key methods are agent-based modeling. The theory is complexity theory."
            },
            aliasFramework2: {
                mockResponse: { "system_framework": "Actor Model" },
                fullDocumentText: "The system_framework is Actor Model. This aligns with principles of self-organization. Methods might involve reinforcement learning. The theory is network theory."
            },
            // Represents "theories" with variations
            aliasTheory1: {
                mockResponse: { "Underlying Theories": ["Game Theory"] },
                fullDocumentText: "Underlying Theories: Game Theory. Principles include adaptation. Methods are genetic algorithms. Frameworks could be cellular automata."
            },
            aliasTheory2: {
                mockResponse: { "theoretical_basis": "Complexity Theory" },
                fullDocumentText: "Theoretical_basis is Complexity Theory. This relates to principles of robustness and methods like agent-based modeling. A suitable framework is the multi-agent system."
            },
            // Represents null/empty/N/A variations for a field
            emptyValuePrinciple1: {
                mockResponse: { "principles": "N/A" },
                fullDocumentText: "This document mentions agent-based modeling and the multi-agent system framework. It also touches upon game theory. Principles like adaptation are not explicitly stated."
            },
            emptyValuePrinciple2: {
                mockResponse: { "principles": null },
                fullDocumentText: "Document context: methods include reinforcement learning. Frameworks: cellular automata. Theories: network theory. Principles are null."
            },
            emptyValuePrinciple3: {
                mockResponse: { "principles": [] },
                fullDocumentText: "Principles are empty in this section. However, we discuss genetic algorithm, the actor model, and complexity theory."
            },
            emptyValuePrinciple4: {
                mockResponse: { "principles": "Not explicitly mentioned." },
                fullDocumentText: "Agent-based modeling, multi-agent systems, and game theory are the focus. Principles are not explicitly mentioned."
            },
            emptyValueMethod1: {
                mockResponse: { "methods": "None" },
                fullDocumentText: "Methods are None. Principles: adaptation, self-organization. Frameworks: actor model. Theories: network theory."
            },
            // Mixed content: some valid, some needing normalization
            mixedContent1: {
                mockResponse: {
                    "Principle": "Self-Organization",
                    "Key Methods": ["Reinforcement Learning"],
                    "models": "Cellular Automata", // "models" instead of "frameworks"
                    "theories": "N/A"
                },
                fullDocumentText: "The core principle is Self-Organization. We use Reinforcement Learning and the Cellular Automata framework. The foundational theory that applies here is game theory, and one could also consider network theory."
            },
            mixedContent2: {
                mockResponse: {
                    "principles": ["Modularity", "Scalability"],
                    "methodology": "Agent-Based Modeling", // singular "methodology"
                    "Frameworks": null, // null value
                    "Relevant Theories": "Network Theory"
                },
                fullDocumentText: "Principles: Modularity, Scalability. Methodology: Agent-Based Modeling. Frameworks like the actor model could be applied. Relevant Theories: Network Theory and complexity theory."
            },
            // Extra fields that should ideally be ignored or handled
            extraFields1: {
                mockResponse: {
                    "principles": ["Robustness"],
                    "methods": ["Evolutionary Strategies"], // Not in DOMAIN_KEYWORDS
                    "frameworks": ["Decentralized Autonomous Organization (DAO)"], // Not in DOMAIN_KEYWORDS
                    "theories": ["Information Theory"], // Not in DOMAIN_KEYWORDS
                    "confidence_score": 0.95,
                    "llm_version": "gpt-4-turbo"
                },
                fullDocumentText: "This document discusses Robustness. Evolutionary Strategies and DAOs are mentioned as examples, alongside Information Theory. We also touch upon agent-based modeling and multi-agent systems."
            },
            // Fields with string values that should be arrays
            stringToArrayField1: {
                mockResponse: {
                    "principles": "Single Principle Only",
                    "methods": "Just One Method"
                },
                fullDocumentText: "The principle is Single Principle Only. The method is Just One Method. We also use the actor model framework and network theory."
            },
            // Array fields that are strings with separators
            stringListToArrayField1: {
                mockResponse: {
                    "principles": "Principle A, Principle B",
                    "methods": "Method X; Method Y"
                },
                fullDocumentText: "Principles: Principle A, Principle B. Methods: Method X; Method Y. The framework is cellular automata, and the theory is complexity theory."
            }
        }
    }
};

export interface SchemaDriftVariation {
    mockResponse: Record<string, unknown> | string | null;
    fullDocumentText: string;
}

export function getSchemaDriftVariationData(
    sampleKey: keyof typeof schemaDriftMocks,
    chunkKey: keyof (typeof schemaDriftMocks)[typeof sampleKey],
    variationKey: keyof (typeof schemaDriftMocks)[typeof sampleKey][typeof chunkKey]
): SchemaDriftVariation | null {
    const sample = schemaDriftMocks[sampleKey];
    if (!sample) {
        console.warn(`[SchemaDriftFixtures] Sample key \"${String(sampleKey)}\" not found.`);
        return null;
    }
    const chunk = sample[chunkKey];
    if (!chunk) {
        console.warn(`[SchemaDriftFixtures] Chunk key \"${String(chunkKey)}\" not found for sample \"${String(sampleKey)}\".`);
        return null;
    }
    const variationData = chunk[variationKey] as SchemaDriftVariation; // Cast to new type
    if (variationData === undefined || variationData.mockResponse === undefined || variationData.fullDocumentText === undefined) {
        console.warn(`[SchemaDriftFixtures] Variation key \"${String(variationKey)}\" or its content not found/incomplete for chunk \"${String(chunkKey)}\" in sample \"${String(sampleKey)}\".`);
        return null;
    }
    // Return the whole variation object
    return {
        // Stringify mockResponse to simulate raw LLM output, as it was before
        mockResponse: typeof variationData.mockResponse === 'string' ? variationData.mockResponse : JSON.stringify(variationData.mockResponse),
        fullDocumentText: variationData.fullDocumentText
    };
} 