import { DOMAIN_SCHEMA, type DomainField } from './DomainSchema';
import type { ExtractedConcepts } from '@/types';

// Represents the strength of co-occurrence between fields.
// e.g., { principles: { methods: 2, frameworks: 1 } } means principles co-occurred with methods twice.
export type DependencyGraph = Partial<Record<DomainField, Partial<Record<DomainField, number>>>>;

export interface DependencyInsight {
    field: DomainField;
    strength: number; // Could be a count or a normalized score
}

export class DependencyModel {
    private graph: DependencyGraph;

    constructor() {
        this.graph = {};
        this.initializeFromSchema();
    }

    /**
     * Initializes the dependency graph with baseline connections from the DOMAIN_SCHEMA.
     * This gives a starting point for expected co-occurrences.
     */
    private initializeFromSchema(): void {
        for (const field of DOMAIN_SCHEMA.fields) {
            if (!this.graph[field]) {
                this.graph[field] = {};
            }
            const schemaDependencies = DOMAIN_SCHEMA.dependencies[field as DomainField];
            if (schemaDependencies) {
                for (const dep of schemaDependencies) {
                    // Initialize with a base weight, e.g., 1, to represent schema-defined link
                    this._incrementDependency(field as DomainField, dep as DomainField, 1);
                }
            }
        }
        console.log("[DependencyModel] Initialized with schema dependencies:", this.graph);
    }

    /**
     * Analyzes the provided concepts and updates the dependency graph based on co-occurring fields.
     * @param concepts The extracted concepts from a document.
     */
    public analyzeDependencies(concepts: ExtractedConcepts): void {
        const presentFields = (DOMAIN_SCHEMA.fields as readonly string[]).filter(
            field => concepts[field] &&
                (Array.isArray(concepts[field]) ? (concepts[field] as string[]).length > 0 : typeof concepts[field] === 'string')
        ) as DomainField[];

        if (presentFields.length < 2) {
            // Not enough fields present to establish a co-occurrence link
            return;
        }

        for (let i = 0; i < presentFields.length; i++) {
            for (let j = i + 1; j < presentFields.length; j++) {
                const fieldA = presentFields[i];
                const fieldB = presentFields[j];
                // Increment co-occurrence count for both directions
                this._incrementDependency(fieldA, fieldB);
                this._incrementDependency(fieldB, fieldA);
            }
        }
        console.log(`[DependencyModel] Updated graph after analyzing concepts. Present fields: ${presentFields.join(', ')}. Graph:`, this.graph);
    }

    /**
     * Gets potential dependent fields for a given field, ordered by strength.
     * @param field The field to get dependencies for.
     * @param threshold Minimum strength for a dependency to be included.
     * @returns An array of DependencyInsight objects.
     */
    public getPotentialDependencies(field: DomainField, threshold: number = 0): DependencyInsight[] {
        const dependencies = this.graph[field];
        if (!dependencies) {
            return [];
        }

        const insights: DependencyInsight[] = [];
        for (const dependentField in dependencies) {
            if (dependencies.hasOwnProperty(dependentField)) {
                const strength = dependencies[dependentField as DomainField];
                if (strength && strength > threshold) {
                    insights.push({ field: dependentField as DomainField, strength });
                }
            }
        }

        // Sort by strength in descending order
        return insights.sort((a, b) => b.strength - a.strength);
    }

    /**
     * Helper to increment the co-occurrence count between two fields.
     */
    private _incrementDependency(fieldA: DomainField, fieldB: DomainField, incrementBy: number = 1): void {
        if (!this.graph[fieldA]) {
            this.graph[fieldA] = {};
        }
        const fieldADeps = this.graph[fieldA]!;

        if (!fieldADeps[fieldB]) {
            fieldADeps[fieldB] = 0;
        }
        fieldADeps[fieldB]! += incrementBy;
    }

    /**
     * Returns the current state of the dependency graph.
     * @returns The dependency graph.
     */
    public getGraph(): DependencyGraph {
        return this.graph;
    }

    // Placeholder for a method to build an initial model based on a corpus or extensive research data
    // public static async buildInitialCorpusModel(corpus: Document[]): Promise<DependencyGraph> { 
    //     // To be implemented: analyze a large set of documents to establish a baseline dependency graph
    //     console.log("[DependencyModel] buildInitialCorpusModel called with corpus of length:", corpus.length);
    //     return {};
    // }
}

// Example Usage (for testing - remove or comment out for production)
/*
const model = new DependencyModel();
const sampleConcepts1: ExtractedConcepts = {
    principles: ["Modularity", "Scalability"],
    methods: ["Agent-based Modeling"],
    frameworks: [],
    theories: []
};
model.analyzeDependencies(sampleConcepts1);
console.log("Dependencies for 'principles':", model.getPotentialDependencies("principles"));
console.log("Dependencies for 'methods':", model.getPotentialDependencies("methods"));

const sampleConcepts2: ExtractedConcepts = {
    principles: ["Robustness"],
    methods: [],
    frameworks: ["Multi-agent System"],
    theories: ["Game Theory"]
};
model.analyzeDependencies(sampleConcepts2);
console.log("Dependencies for 'principles' after 2nd analysis:", model.getPotentialDependencies("principles"));
console.log("Dependencies for 'frameworks':", model.getPotentialDependencies("frameworks"));
console.log("Full graph:", JSON.stringify(model.graph, null, 2)); 
*/ 