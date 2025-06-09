import { MultiHopComposerInput, MultiHopComposerOutput } from "./MultiHopComposerTypes";
import type { TraceableConcept } from "@/types";

export class MultiHopComposerEngine {
    static compose(input: MultiHopComposerInput): MultiHopComposerOutput {
        console.log("--- Multi-Hop Reasoning Composer Activated ---");

        const { conceptSet } = input;
        const hops: string[] = [];

        // Value-safe multi-hop scaffolding — now safely dereferencing .value from TraceableConcept[]
        conceptSet.principles.forEach((principle: TraceableConcept) => {
            conceptSet.methods.forEach((method: TraceableConcept) => {
                hops.push(
                    `Apply principle "${principle.value}" using method "${method.value}".`
                );
            });
        });

        conceptSet.methods.forEach((method: TraceableConcept) => {
            conceptSet.frameworks.forEach((framework: TraceableConcept) => {
                hops.push(
                    `Use method "${method.value}" within framework "${framework.value}".`
                );
            });
        });

        conceptSet.frameworks.forEach((framework: TraceableConcept) => {
            conceptSet.theories.forEach((theory: TraceableConcept) => {
                hops.push(
                    `Framework "${framework.value}" reflects theory "${theory.value}".`
                );
            });
        });

        return { composedMappings: hops };
    }
} 