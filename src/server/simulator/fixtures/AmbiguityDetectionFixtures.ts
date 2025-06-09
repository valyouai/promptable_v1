import { ExtractedConcepts, TraceableConcept } from "@/types";

export const ambiguityDetectionFixtures = {
    fixture1_emptyPrinciples: {
        principles: [],
        methods: ["Method A", "Method B"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Framework X"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Theory Y"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    } as ExtractedConcepts,
    fixture2_allClear: {
        principles: ["Clear Principle"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Clear Method"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Clear Framework"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Clear Theory"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    } as ExtractedConcepts,
    fixture3_hedgingInPrinciplesAndNotes: {
        principles: ["Possibly Principle 1", "Principle 2"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Method X"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Framework Y"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Theory Z"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    } as ExtractedConcepts,
    fixture4_notesEmptyAndMethodsAmbiguous: {
        principles: ["Solid Principle"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Maybe Method Alpha", "Method Beta"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Framework Gamma"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Theory Delta"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    } as ExtractedConcepts,
    fixture5_llmHedgingInNotes: {
        principles: ["Principle 4"],
        methods: ["Method F"],
        frameworks: ["Framework Omega"],
        theories: ["Theory Zeta"],
        notes: "It appears that the findings are preliminary. Further investigation might be needed."
    },
    fixture6_singletonUncertainty: {
        principles: ["Principle 5"],
        methods: ["Method G"],
        frameworks: ["maybe Framework Kappa"], // Singleton with uncertainty
        theories: ["Theory Eta"],
        notes: "Frameworks has a single entry with hedging language."
    },
    fixture7_emptyNotesAndTheories: {
        principles: ["Principle 6"],
        methods: ["Method H"],
        frameworks: ["Framework Lambda"],
        theories: [],
        notes: "" // Empty notes string
    },
    fixture8_multipleAmbiguities: {
        principles: ["maybe Principle 7"],
        methods: [], // Empty array
        frameworks: ["details TBD"], // Placeholder
        theories: ["Uncertain about this one"],
        notes: "It seems likely that there are some ambiguities here, but it is not entirely clear."
    },
    fixture9_perfectlyClear: { // A non-ambiguous case for baseline
        principles: ["Solid Principle A", "Solid Principle B"],
        methods: ["Well-defined Method X", "Clear Method Y"],
        frameworks: ["Established Framework Z"],
        theories: ["Proven Theory Q"],
        notes: "This extraction is considered clear and unambiguous."
    },
    fixture10_notesOnlyHedging: {
        principles: ["Another Principle"],
        methods: ["Standard Method"],
        frameworks: ["Common Framework"],
        theories: ["Accepted Theory"],
        notes: "It could be that this is all there is to say."
    }
};

// Example of how to use a fixture (for testing elsewhere, not for direct execution here)
// import { AmbiguityDetectorAgent } from '../../llm/AmbiguityDetectorAgent';
// const testFixture = ambiguityDetectionFixtures.fixture4_uncertaintyInTheories;
// const ambiguities = AmbiguityDetectorAgent.detectAmbiguities(testFixture);
// console.log("Ambiguities for fixture4:", ambiguities); 