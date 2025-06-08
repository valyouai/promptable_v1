// src/server/llm/fusion-policy/FusionPolicyEngine.ts

import { TransferKernelConceptSet } from "../prompt-generator/PromptGeneratorTypes";
import { TraceableConcept } from "../../../types"; // Assuming TraceableConcept is in src/types/index.ts

export class FusionPolicyEngine {

    static applyPolicy(conceptSet: TransferKernelConceptSet): TransferKernelConceptSet {
        const log = {
            principles: { pre: conceptSet.personaPrinciples?.length || 0, post: 0 },
            methods: { pre: conceptSet.personaMethods?.length || 0, post: 0 },
            frameworks: { pre: conceptSet.personaFrameworks?.length || 0, post: 0 },
            theories: { pre: conceptSet.personaTheories?.length || 0, post: 0 },
        };

        const policyAdjustedPrinciples = this._normalizeConceptList(conceptSet.personaPrinciples);
        const policyAdjustedMethods = this._normalizeConceptList(conceptSet.personaMethods);
        const policyAdjustedFrameworks = this._normalizeConceptList(conceptSet.personaFrameworks);
        const policyAdjustedTheories = this._normalizeConceptList(conceptSet.personaTheories);

        log.principles.post = policyAdjustedPrinciples.length;
        log.methods.post = policyAdjustedMethods.length;
        log.frameworks.post = policyAdjustedFrameworks.length;
        log.theories.post = policyAdjustedTheories.length;

        console.log("--- FusionPolicyEngine.applyPolicy Applied (Value Normalization & Initial Deduplication) ---");
        console.log(`Principles: ${log.principles.pre} -> ${log.principles.post} (Reduced by ${log.principles.pre - log.principles.post})`);
        console.log(`Methods: ${log.methods.pre} -> ${log.methods.post} (Reduced by ${log.methods.pre - log.methods.post})`);
        console.log(`Frameworks: ${log.frameworks.pre} -> ${log.frameworks.post} (Reduced by ${log.frameworks.pre - log.frameworks.post})`);
        console.log(`Theories: ${log.theories.pre} -> ${log.theories.post} (Reduced by ${log.theories.pre - log.theories.post})`);

        return {
            personaPrinciples: policyAdjustedPrinciples,
            personaMethods: policyAdjustedMethods,
            personaFrameworks: policyAdjustedFrameworks,
            personaTheories: policyAdjustedTheories,
        };
    }

    // Renamed from normalizeConcepts to _normalizeConceptList for clarity
    private static _normalizeConceptList(concepts: TraceableConcept[]): TraceableConcept[] {
        if (!concepts) return [];
        const normalizedMap = new Map<string, TraceableConcept>();

        for (const concept of concepts) {
            if (concept && typeof concept.value === 'string') {
                const normalizedValueKey = this._getNormalizedStringKey(concept.value); // Use a key for the map
                const presentationValue = this._getPresentationValue(concept.value); // Get the final display value

                if (normalizedValueKey) {
                    // Store with the normalized key, but the concept object has the presentationValue
                    normalizedMap.set(normalizedValueKey, {
                        ...concept,
                        value: presentationValue,
                    });
                }
            } else {
                // console.warn('''Invalid concept encountered during normalization: ${concept}''');
            }
        }
        return Array.from(normalizedMap.values());
    }

    // Gets a consistent key for deduplication (lowercase, pattern free, etc.)
    private static _getNormalizedStringKey(input: string): string {
        if (typeof input !== 'string') return '';
        let result = input.trim().toLowerCase();
        if (!result) return '';
        result = result.replace(/\bpattern\b/gi, '').trim();
        result = result.replace(/\bpatterns\b/gi, '').trim();
        result = result.replace(/\s+/g, ' ').trim();
        return result;
    }

    // Gets the final presentation value (includes Title Casing)
    private static _getPresentationValue(input: string): string {
        const key = this._getNormalizedStringKey(input); // Get the core normalized key first
        if (!key) return '';
        // Title Case the key for presentation
        return key.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Phase 26.B: Semantic Equivalence Collapse
    static collapseSemanticEquivalents(inputSet: TransferKernelConceptSet): TransferKernelConceptSet {
        return {
            personaPrinciples: this._deduplicateConceptList(inputSet.personaPrinciples),
            personaMethods: this._deduplicateConceptList(inputSet.personaMethods),
            personaFrameworks: this._deduplicateConceptList(inputSet.personaFrameworks),
            personaTheories: this._deduplicateConceptList(inputSet.personaTheories),
        };
    }

    private static _deduplicateConceptList(concepts: TraceableConcept[]): TraceableConcept[] {
        if (!concepts) return [];
        const uniqueConceptsMap = new Map<string, TraceableConcept>();
        for (const concept of concepts) {
            if (concept && typeof concept.value === 'string') {
                // The concept.value is already normalized for presentation by applyPolicy
                // For deduplication key, reuse _getNormalizedStringKey for consistency.
                const deduplicationKey = this._getNormalizedStringKey(concept.value);
                if (deduplicationKey && !uniqueConceptsMap.has(deduplicationKey)) {
                    uniqueConceptsMap.set(deduplicationKey, concept); // Store the first-seen concept object
                }
            }
        }
        return Array.from(uniqueConceptsMap.values());
    }
} 