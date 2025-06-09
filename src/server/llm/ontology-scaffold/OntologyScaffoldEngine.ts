import { OntologyScaffoldInput, OntologyMappedConcepts, OntologyDomain } from "./OntologyScaffoldTypes";
import { TraceableConcept } from "@/types";

export class OntologyScaffoldEngine {
    static map(input: OntologyScaffoldInput): OntologyMappedConcepts {
        console.log("--- Ontology Scaffold Activated ---");
        console.log("Frame Adapted Concepts:", input.frameAdaptedConcepts);
        console.log("Domain:", input.domain);
        console.log("Persona:", input.persona);

        const domainMap = this.getDomainMap(input.domain);

        const applyOntologyMapping = (
            concepts: ReadonlyArray<TraceableConcept>,
            mapping: Record<string, string>
        ): TraceableConcept[] => {
            return concepts.map(originalConcept => {
                const termToMap = originalConcept.value;
                let finalMappedValue = termToMap;

                if (mapping.hasOwnProperty(termToMap)) {
                    finalMappedValue = mapping[termToMap];
                } else {
                    const frameMatch = termToMap.match(/\[Frame: [^]]+\] (.*)/);
                    if (frameMatch && frameMatch[1]) {
                        const conceptContentOnly = frameMatch[1];
                        if (mapping.hasOwnProperty(conceptContentOnly)) {
                            finalMappedValue = mapping[conceptContentOnly];
                        }
                    }
                }
                return {
                    ...originalConcept,
                    value: finalMappedValue,
                };
            });
        };

        return {
            ontologyPrinciples: applyOntologyMapping(input.frameAdaptedConcepts.adaptedPrinciples, domainMap),
            ontologyMethods: applyOntologyMapping(input.frameAdaptedConcepts.adaptedMethods, domainMap),
            ontologyFrameworks: applyOntologyMapping(input.frameAdaptedConcepts.adaptedFrameworks, domainMap),
            ontologyTheories: applyOntologyMapping(input.frameAdaptedConcepts.adaptedTheories, domainMap),
        };
    }

    static getDomainMap(domain: OntologyDomain): Record<string, string> {
        // ⚠️ VERY MINIMAL INITIAL BRIDGE — Will expand in 22.D+
        // The keys here should ideally match the *output* of the FrameSemanticTranslator

        if (domain === "literature") {
            return {
                "[Frame: Principle] Tokenization": "Text Segmentation",
                "[Frame: Method] Attention Mechanism": "Thematic Focus Mapping",
                "[Frame: Framework] Transformer Architecture": "Narrative Structure Model",
                "[Frame: Theory] Self-Attention": "Motif Recurrence Hypothesis",
                // Added examples for base concepts if frame prefix is missed
                "Tokenization": "Text Segmentation",
                "Attention Mechanism": "Thematic Focus Mapping",
                "Transformer Architecture": "Narrative Structure Model",
                "Self-Attention": "Motif Recurrence Hypothesis"
            };
        }

        if (domain === "education") {
            return {
                "[Frame: Principle] Tokenization": "Lesson Chunking",
                "[Frame: Method] Attention Mechanism": "Active Engagement Technique",
                "[Frame: Framework] Transformer Architecture": "Instructional Sequencing Model",
                "[Frame: Theory] Self-Attention": "Student Personalization Principle",
                "Tokenization": "Lesson Chunking",
                "Attention Mechanism": "Active Engagement Technique",
                "Transformer Architecture": "Instructional Sequencing Model",
                "Self-Attention": "Student Personalization Principle"
            };
        }

        if (domain === "business") {
            return {
                "[Frame: Principle] Tokenization": "Process Decomposition",
                "[Frame: Method] Attention Mechanism": "Resource Prioritization",
                "[Frame: Framework] Transformer Architecture": "Workflow Coordination Model",
                "[Frame: Theory] Self-Attention": "Market Signal Amplification Theory",
                "Tokenization": "Process Decomposition",
                "Attention Mechanism": "Resource Prioritization",
                "Transformer Architecture": "Workflow Coordination Model",
                "Self-Attention": "Market Signal Amplification Theory"
            };
        }

        return {};
    }
} 