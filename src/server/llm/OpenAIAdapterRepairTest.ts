// src/server/llm/OpenAIAdapterRepairTest.ts
import { jsonrepair } from 'jsonrepair';

// Test cases from actual LLM outputs
const TEST_CASES = [
    // Natural language response (no JSON) - should attempt to repair into an empty object or fail gracefully
    `The research objective of the Sparse Priming Representations (SPR) project is to develop techniques...`,

    // Markdown-style response - should attempt to repair into an empty object or fail gracefully
    `### Methods\n\n1. Distillation of complex ideas\n2. Context-driven statements`,

    // Almost valid JSON but missing quotes for keys
    `{Research Objective: "Develop SPR techniques", Methods: "Distillation"}`,

    // Valid JSON but with extra text before and after
    `Here's the extracted data: {"Research Objective": "SPR research"}`,

    // Array without quotes for string elements, missing quotes for key
    `{principles: [memory efficiency, token reduction]}`,

    // From our logs - real failure case: "Not explicitly mentioned." should try to repair into a JSON object if possible.
    `Not explicitly mentioned.`,

    // A slightly more complex, almost valid JSON with a trailing comma and unquoted string in array
    `{\n    "Key Findings": "Finding One",\n    "Limitations": "Limitation Two",\n    "Keywords": ["keyword1", keyword2,]\n  }`,

    // JSON with unescaped newlines in a string (jsonrepair might handle this by escaping or removing)
    `{\n    "Applications": "This is a multi-line\\napplication description."\n  }`,

    // Malformed JSON with an unclosed array
    `{\n    "principles": ["principle1", "principle2"\n  }`
];

/**
 * Simulates the parsing and repair logic of OpenAIAdapter.call
 * without making actual OpenAI API calls.
 */
async function simulateParseAndRepair(contentToParse: string): Promise<unknown> {
    if (!contentToParse) {
        console.warn('[SIMULATE] Empty response received from LLM');
        return {};
    }

    try {
        return JSON.parse(contentToParse);
    } catch (error: unknown) {
        console.warn('[SIMULATE] Initial JSON.parse FAILED, attempting repair...', error);
        try {
            const repaired = jsonrepair(contentToParse);
            return JSON.parse(repaired);
        } catch (repairError: unknown) {
            console.warn('[SIMULATE] JSON repair failed. Returning raw content.', repairError);
            return { output: contentToParse };
        }
    }
}

async function runRepairTests() {
    console.log('🚀 Starting Phase 7A Repair Layer Validation Tests\n');

    for (const [i, testCase] of TEST_CASES.entries()) {
        console.log(`🧪 Test Case ${i + 1}:`);
        console.log(`Input (first 80 chars): "${testCase.slice(0, 80)}..."`);

        try {
            // Directly call the simulation function
            const mockResponse = await simulateParseAndRepair(testCase);

            console.log('✅ Test Result (Parsed/Repaired):', JSON.stringify(mockResponse, null, 2));
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.log('❌ Test Encountered Unexpected Error:', error.message);
            } else {
                console.log('❌ Test Encountered Unexpected Error:', error);
            }
        }

        console.log('\n---\n');
    }
    console.log('🏁 All Phase 7A Repair Layer Validation Tests Completed.');
}

runRepairTests(); 