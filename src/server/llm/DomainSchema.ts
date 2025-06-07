export const DOMAIN_SCHEMA = {
    fields: ["principles", "methods", "frameworks", "theories"] as const,
    recoveryKeywords: {
        principles: ["adaptation", "self-organization", "modularity", "scalability", "robustness", "decentralization"],
        methods: ["agent-based modeling", "reinforcement learning", "genetic algorithm"],
        frameworks: ["multi-agent system", "cellular automata", "actor model"],
        theories: ["game theory", "network theory", "complexity theory"],
    },
    dependencies: {
        principles: ["methods", "frameworks", "theories"],
        methods: ["principles", "frameworks", "theories"],
        frameworks: ["principles", "methods", "theories"],
        theories: ["principles", "methods", "frameworks"],
    },
    isValidField(field: string): boolean {
        return (this.fields as readonly string[]).includes(field);
    }
};

export type DomainField = keyof typeof DOMAIN_SCHEMA.recoveryKeywords; 