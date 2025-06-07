/**
 * Expected clean, aggregated extraction outputs for validating the simulator.
 * These should correspond to the ideal outcome after processing MockPDFSamples
 * and (successfully repaired) MockLLMResponses.
 */

import { ExtractedConcepts } from '@/types'; // Assuming ExtractedConcepts is your target type

export const expectedExtractionResults: Record<string, ExtractedConcepts> = {
    pdfSample001: {
        // Expected result for mockPdfSamples.sample1, assuming all fields are extracted correctly from its single chunk
        "Research Objective": "To investigate the impact of sunlight on plant growth.",
        "Methods": "Experimental setup with controlled variables.",
        "Dataset(s)": "50 potted plants of the same species.",
        "Key Findings": "Plants exposed to more sunlight showed increased growth.",
        "Limitations": "Study conducted in a single greenhouse, limiting generalizability.",
        "Future Work": "Investigate other environmental factors.",
        "Applications": "Horticulture, agriculture.",
        "principles": ["Photosynthesis"],
        "methods": ["Controlled Experiment"],
        "frameworks": [],
        "theories": ["Plant Physiology"]
    },
    pdfSample002: {
        // Expected result for mockPdfSamples.sample2, after aggregation from its 3 chunks
        // This assumes successful extraction and aggregation of fields spread across chunks.
        // For simplicity, let's assume the most complete information is retained.
        "Research Objective": "Explore novel quantum algorithms.",
        "Methods": "We employed a qubit simulation framework. Algorithms tested on simulated quantum hardware.",
        "Dataset(s)": "Simulated qubit states and gate operations data.", // Repaired from almostJson in MockLLMResponses
        "Key Findings": "Algorithm X shows a 50% speedup over classical counterparts for specific problem sets.", // Or from errorsAndList if that's chosen
        "Limitations": "Current quantum hardware is noisy and error-prone. Simulation does not fully capture real-world noise.", // Or from errorsAndList
        "Future Work": "Test on actual quantum hardware. Refine algorithm for noise tolerance.", // Or from errorsAndList
        "Applications": "Cryptography, materials science, drug discovery.", // Aggregated or from most complete chunk
        "principles": ["Quantum Mechanics", "Superposition", "Entanglement"], // Aggregated
        "methods": ["Quantum Simulation", "Algorithm Benchmarking"], // Aggregated
        "frameworks": ["Qiskit"], // From chunk2
        "theories": ["Quantum Information Theory"] // From chunk3
    },
    // Add more expected results corresponding to other mockPdfSamples
}; 