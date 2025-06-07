// src/server/simulator/fixtures/MockPDFSamples.ts

/**
 * Mock document content for testing the ExtractionKernel simulator.
 * Each sample represents the text content that would typically be extracted from a PDF.
 */

export const mockPdfSamples = {
    sample1: {
        id: 'pdfSample001',
        name: 'Simple Research Abstract',
        content: `
      Research Objective: To investigate the impact of sunlight on plant growth.
      Methods: Experimental setup with controlled variables.
      Dataset(s): 50 potted plants of the same species.
      Key Findings: Plants exposed to more sunlight showed increased growth.
      Limitations: Study conducted in a single greenhouse, limiting generalizability.
      Future Work: Investigate other environmental factors.
      Applications: Horticulture, agriculture.
      principles: ["Photosynthesis"],
      methods: ["Controlled Experiment"],
      frameworks: [],
      theories: ["Plant Physiology"]
    `,
        // Expected number of chunks for this content (can be adjusted based on chunker logic)
        expectedChunks: 1,
    },
    sample2: {
        id: 'pdfSample002',
        name: 'Multi-Page Document Excerpt',
        content: `
      Page 1: Introduction to Quantum Computing.
      Research Objective: Explore novel quantum algorithms.
      This section lays out the foundational principles of quantum mechanics relevant to computing.

      Page 2: Methodology for Algorithm Design.
      Methods: We employed a qubit simulation framework.
      The algorithms were tested on simulated quantum hardware.
      Dataset(s): Simulated qubit states and gate operations data.

      Page 3: Preliminary Results and Discussion.
      Key Findings: Algorithm X shows a 50% speedup over classical counterparts for specific problem sets.
      Limitations: Current quantum hardware is noisy and error-prone. Simulation does not fully capture real-world noise.
      Future Work: Test on actual quantum hardware. Refine algorithm for noise tolerance.
      Applications: Cryptography, materials science, drug discovery.
      principles: ["Superposition", "Entanglement"],
      methods: ["Quantum Simulation", "Algorithm Benchmarking"],
      frameworks: ["Qiskit"],
      theories: ["Quantum Information Theory"]
    `,
        expectedChunks: 3, // Assuming one chunk per page for simplicity
    },
    // Add more diverse samples as needed
};

export type MockPdfSample = (typeof mockPdfSamples)[keyof typeof mockPdfSamples]; 