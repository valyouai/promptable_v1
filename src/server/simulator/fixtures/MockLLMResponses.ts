/**
 * Mock LLM extraction outputs for testing the ExtractionKernel simulator.
 * These simulate what the LLM might return for different text chunks,
 * including various malformations to test the repair layer.
 */

// Corresponds to chunks from mockPdfSamples.sample1
const sample1Responses = {
    chunk1: {
        // Simulates a well-formed JSON response
        valid: `{
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
    }`,
        // Simulates a common malformation: trailing comma
        trailingComma: `{
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
      "theories": ["Plant Physiology"],
    }`,
        // Simulates response with unquoted keys (jsonrepair should handle this)
        unquotedKeys: `{
      ResearchObjective: "To investigate the impact of sunlight on plant growth.",
      Methods: "Experimental setup with controlled variables.",
      Dataset: "50 potted plants of the same species."
    }`,
    },
};

// Corresponds to chunks from mockPdfSamples.sample2
const sample2Responses = {
    chunk1: {
        // Page 1 content: Introduction, partial Research Objective
        markdownAndText: `
      ### Introduction Section
      The primary aim is to explore novel quantum algorithms.
      This document details foundational principles.
      {"Research Objective": "Explore novel quantum algorithms", "principles": ["Quantum Mechanics"]}
    `,
    },
    chunk2: {
        // Page 2 content: Methods, Dataset
        almostJson: `{
      "Methods": "We employed a qubit simulation framework. Algorithms tested on simulated quantum hardware.",
      "Dataset(s)": "Simulated qubit states and gate operations data", // Missing closing quote for value
      "frameworks": [Qiskit] // Unquoted array element
    }`,
    },
    chunk3: {
        // Page 3 content: Key Findings, Limitations, Future Work, Applications
        plainText: `
      Key Findings include a 50% speedup for Algorithm X.
      Limitations: Noisy hardware is an issue.
      Future Work: Test on real hardware.
      Applications: Cryptography, materials science.
      Theories: [Quantum Information Theory]
      This concludes the preliminary results.
    `,
        // Another version for chunk3, almost valid but with errors
        errorsAndList: `{
      "Key Findings": "Algorithm X shows 50% speedup.",
      "Limitations": "Noisy hardware; simulation limitations.",
      "Future Work": "Test on actual quantum hardware. Refine for noise tolerance", 
      "Applications": "Cryptography, materials science, drug discovery",
      "theories": ["Quantum Information Theory",]
      "Notes": "This is an extra field not in schema."
    }`
    },
};

export const mockLLMResponses = {
    pdfSample001: sample1Responses,
    pdfSample002: sample2Responses,
    // ... add more responses corresponding to other mockPdfSamples
};

/**
 * Helper function to get a specific mock LLM response.
 * The simulator can use this to cycle through different response types for a given chunk.
 */
export function getMockLLMResponse(
    sampleId: string,
    chunkId: string, // e.g., 'chunk1', 'chunk2'
    responseType: string = 'valid' // e.g., 'valid', 'trailingComma', 'markdownAndText'
): string | undefined {
    const sample = mockLLMResponses[sampleId as keyof typeof mockLLMResponses];
    if (sample) {
        const chunkResponses = sample[chunkId as keyof typeof sample];
        if (chunkResponses) {
            return chunkResponses[responseType as keyof typeof chunkResponses];
        }
    }
    console.warn(`Mock LLM response not found for ${sampleId}, ${chunkId}, ${responseType}`);
    return undefined; // Or return a default malformed string
} 