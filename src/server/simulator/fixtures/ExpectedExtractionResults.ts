/**
 * Expected clean, aggregated extraction outputs for validating the simulator.
 * These should correspond to the ideal outcome after processing MockPDFSamples
 * and (successfully repaired) MockLLMResponses.
 */

import { ExtractedConcepts, TraceableConcept } from '@/types'; // Assuming ExtractedConcepts is your target type

export const expectedExtractionResults: Record<string, ExtractedConcepts> = {
    fixture1_initial: {
        principles: ["Initial Principle"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Initial Method"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: [],
        theories: ["Initial Theory"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    fixture1_rawExtracted: {
        principles: ["Photosynthesis"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Controlled Experiment"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: [].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Plant Physiology"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    pdfSample001: {
        principles: ["Core Principle A"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Method B"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Framework C"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Theory D"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    pdfSample002: {
        principles: ["Quantum Mechanics", "Superposition", "Entanglement"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Quantum Simulation", "Algorithm Benchmarking", "Bell Test"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Qiskit", "Density Matrix Formalism"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Quantum Information Theory", "Computational Complexity Theory"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    testDoc1_Base: {
        principles: ["Photosynthesis", "Cellular Respiration"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Controlled Experiment", "Microscopy"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Scientific Method"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Plant Physiology", "Evolutionary Biology"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    testDoc2_Complex: {
        principles: ["General Relativity", "Special Relativity"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        methods: ["Tensor Calculus", "Thought Experiments"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        frameworks: ["Minkowski Spacetime"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
        theories: ["Field Theory"].map(s => ({ value: s, source: "Fixture" } as TraceableConcept)),
    },
    testDoc3_EmptyResults: {
        principles: [],
        methods: [],
        frameworks: [],
        theories: [],
    },
    // Add more expected results corresponding to other mockPdfSamples
}; 