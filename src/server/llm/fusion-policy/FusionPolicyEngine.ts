// src/server/llm/fusion-policy/FusionPolicyEngine.ts

// import { TransferKernelConceptSet } from "../prompt-generator/PromptGeneratorTypes"; // Will be removed if not used elsewhere
import { TraceableConcept, ExtractedConcepts } from "../../../types"; // Assuming TraceableConcept is in src/types/index.ts

export class FusionPolicyEngine {

    private static anchorMap: Map<string, string> = new Map([
        // Anchor: Reflection
        ["reflection", "Reflection"],
        ["reflection pattern", "Reflection"],
        ["reflection patterns", "Reflection"],
        // Anchor: Template
        ["template", "Template"],
        ["template pattern", "Template"],
        // Anchor: Infinite Generation
        ["infinite generation", "Infinite Generation"],
        ["infinite generation pattern", "Infinite Generation"],
        // Anchor: Persona
        ["persona", "Persona"],
        ["persona pattern", "Persona"],
        // Anchor: Alternative Approaches
        ["alternative approaches", "Alternative Approaches"],
        ["alternative approaches pattern", "Alternative Approaches"],
        // Anchor: Cognitive Verifier
        ["cognitive verifier", "Cognitive Verifier"],
        ["cognitive verifier pattern", "Cognitive Verifier"],
        // Anchor: Fact Check List
        ["fact check list", "Fact Check List"],
        ["fact check list pattern", "Fact Check List"],
        // Anchor: Context Manager
        ["context manager", "Context Manager"],
        ["context manager pattern", "Context Manager"],
        // Anchor: Game Play
        ["game play", "Game Play"],
        ["game play pattern", "Game Play"],
        // Anchor: Recipe
        ["recipe", "Recipe"],
        ["recipe pattern", "Recipe"],
        // Anchor: Refusal Breaker
        ["refusal breaker", "Refusal Breaker"],
        ["refusal breaker pattern", "Refusal Breaker"],
        // Anchor: Visualization Generator
        ["visualization generator", "Visualization Generator"],
        ["visualization generator pattern", "Visualization Generator"],
    ]);

    private static remappedToAnchorCount = 0; // Phase 26.C: Counter

    static applyPolicy(conceptSet: ExtractedConcepts): ExtractedConcepts {
        this.remappedToAnchorCount = 0; // Reset for each call
        const log = {
            principles: { pre: conceptSet.principles?.length || 0, post: 0 },
            methods: { pre: conceptSet.methods?.length || 0, post: 0 },
            frameworks: { pre: conceptSet.frameworks?.length || 0, post: 0 },
            theories: { pre: conceptSet.theories?.length || 0, post: 0 },
        };

        const policyAdjustedPrinciples = this._normalizeConceptList(conceptSet.principles);
        const policyAdjustedMethods = this._normalizeConceptList(conceptSet.methods);
        const policyAdjustedFrameworks = this._normalizeConceptList(conceptSet.frameworks);
        const policyAdjustedTheories = this._normalizeConceptList(conceptSet.theories);

        log.principles.post = policyAdjustedPrinciples.length;
        log.methods.post = policyAdjustedMethods.length;
        log.frameworks.post = policyAdjustedFrameworks.length;
        log.theories.post = policyAdjustedTheories.length;

        console.log("--- FusionPolicyEngine.applyPolicy Applied (Value Normalization, Anchoring & Initial Deduplication) ---");
        console.log(`Principles: ${log.principles.pre} -> ${log.principles.post} (Reduced by ${log.principles.pre - log.principles.post})`);
        console.log(`Methods: ${log.methods.pre} -> ${log.methods.post} (Reduced by ${log.methods.pre - log.methods.post})`);
        console.log(`Frameworks: ${log.frameworks.pre} -> ${log.frameworks.post} (Reduced by ${log.frameworks.pre - log.frameworks.post})`);
        console.log(`Theories: ${log.theories.pre} -> ${log.theories.post} (Reduced by ${log.theories.pre - log.theories.post})`);
        console.log(`FusionPolicyEngine soft clustering applied: ${this.remappedToAnchorCount} concepts remapped to anchors.`); // Phase 26.C Log

        return {
            principles: policyAdjustedPrinciples,
            methods: policyAdjustedMethods,
            frameworks: policyAdjustedFrameworks,
            theories: policyAdjustedTheories,
        };
    }

    // Renamed from normalizeConcepts to _normalizeConceptList for clarity
    // This method still operates on TraceableConcept and returns TraceableConcept
    // as it's used by applyPolicy before weighting.
    private static _normalizeConceptList(concepts: TraceableConcept[] | undefined): TraceableConcept[] {
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
        let baseNormalized = input.trim().toLowerCase();
        if (!baseNormalized) return '';
        baseNormalized = baseNormalized.replace(/\bpattern\b/gi, '').trim();
        baseNormalized = baseNormalized.replace(/\bpatterns\b/gi, '').trim();
        baseNormalized = baseNormalized.replace(/\s+/g, ' ').trim();

        // Phase 26.C: Anchor mapping
        if (this.anchorMap.has(baseNormalized)) {
            const anchorTermFromMap = this.anchorMap.get(baseNormalized)!;
            // For the key, use the anchor term itself, normalized again
            return anchorTermFromMap.trim().toLowerCase().replace(/\bpattern\b/gi, '').trim().replace(/\bpatterns\b/gi, '').trim().replace(/\s+/g, ' ').trim();
        }
        return baseNormalized;
    }

    // Gets the final presentation value (includes Title Casing)
    private static _getPresentationValue(input: string): string {
        if (typeof input !== 'string') return '';
        const initialNormalizedKey = input.trim().toLowerCase().replace(/\bpattern\b/gi, '').trim().replace(/\bpatterns\b/gi, '').trim().replace(/\s+/g, ' ').trim();

        if (this.anchorMap.has(initialNormalizedKey)) {
            const anchorTermDisplay = this.anchorMap.get(initialNormalizedKey)!; // This is already TitleCased

            // Check if a true remapping occurred (input wasn't already the anchor in its basic form)
            const normalizedAnchorTermDisplay = anchorTermDisplay.trim().toLowerCase().replace(/\bpattern\b/gi, '').trim().replace(/\bpatterns\b/gi, '').trim().replace(/\s+/g, ' ').trim();
            if (initialNormalizedKey !== normalizedAnchorTermDisplay) {
                this.remappedToAnchorCount++;
            }
            return anchorTermDisplay;
        }

        if (!initialNormalizedKey) return '';
        return initialNormalizedKey.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Phase 26.B: Semantic Equivalence Collapse - Operates on ExtractedConcepts
    static collapseSemanticEquivalents(inputSet: ExtractedConcepts): ExtractedConcepts {
        return {
            principles: this._deduplicateConceptList(inputSet.principles),
            methods: this._deduplicateConceptList(inputSet.methods),
            frameworks: this._deduplicateConceptList(inputSet.frameworks),
            theories: this._deduplicateConceptList(inputSet.theories),
        };
    }

    // Operates on TraceableConcept[]
    private static _deduplicateConceptList(concepts: TraceableConcept[] | undefined): TraceableConcept[] {
        if (!concepts) return [];
        const uniqueConceptsMap = new Map<string, TraceableConcept>();
        for (const concept of concepts) {
            if (concept && typeof concept.value === 'string') {
                const deduplicationKey = this._getNormalizedStringKey(concept.value);
                if (deduplicationKey && !uniqueConceptsMap.has(deduplicationKey)) {
                    uniqueConceptsMap.set(deduplicationKey, concept);
                }
            }
        }
        return Array.from(uniqueConceptsMap.values());
    }
} 