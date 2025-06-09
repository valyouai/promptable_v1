export interface PersonaWeightProfile {
    persona: string;
    weights: {
        principles: number;
        methods: number;
        frameworks: number;
        theories: number;
    };
}

export const PersonaWeightProfiles: PersonaWeightProfile[] = [
    {
        persona: "educator",
        weights: {
            principles: 1.5,
            methods: 1.3,
            frameworks: 1.2,
            theories: 1.0
        }
    },
    {
        persona: "researcher",
        weights: {
            principles: 1.0,
            methods: 1.2,
            frameworks: 1.0,
            theories: 1.5
        }
    },
    {
        persona: "creator",
        weights: {
            principles: 1.2,
            methods: 1.5,
            frameworks: 1.3,
            theories: 0.8
        }
    },
    {
        persona: "strategist",
        weights: {
            principles: 1.3,
            methods: 1.4,
            frameworks: 1.5,
            theories: 1.2
        }
    }
]; 