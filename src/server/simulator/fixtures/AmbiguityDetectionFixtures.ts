import type { ExtractedConcepts } from "@/types";

export const ambiguityDetectionFixtures: Record<string, ExtractedConcepts> = {
    fixture1_emptyPrinciples: {
        principles: [],
        methods: ["Method A", "Method B"],
        frameworks: ["Framework X"],
        theories: ["Theory Y"],
        notes: "All fields present, but principles is empty."
    },
    fixture2_missingMethods: {
        principles: ["Principle 1"],
        // methods field is completely missing
        frameworks: ["Framework Z"],
        theories: ["Theory Alpha"],
        notes: "Methods field is deliberately omitted."
    } as unknown as ExtractedConcepts, // Cast needed because 'methods' is missing from literal
    fixture3_placeholderInFrameworks: {
        principles: ["Principle 2"],
        methods: ["Method C"],
        frameworks: ["Placeholder for framework details"],
        theories: ["Theory Beta"],
        notes: "Frameworks contains a placeholder string."
    },
    fixture4_uncertaintyInTheories: {
        principles: ["Principle 3"],
        methods: ["Method D", "Method E"],
        frameworks: ["Framework Gamma"],
        theories: ["possibly Theory Delta", "could be Theory Epsilon"],
        notes: "Theories array contains strings with uncertainty phrases."
    },
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