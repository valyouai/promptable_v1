// This test suite validates the persona system, including insight transformation
// and system prompt generation. It relies on the environment-based mocking
// configured in lib/openai.ts (activated by OPENAI_API_KEY='test-key' in .env.test)
// to prevent actual OpenAI API calls during testing.
import { transformInsights } from '@/lib/contextual-transformer';
import { generateSystemPrompt } from '@/lib/prompt-templates';
import type { Persona, ContentType } from '@/lib/prompt-templates';
import type { ExtractedConcepts } from '@/types';

// Mock extracted concepts for testing
const mockExtractedConcepts: ExtractedConcepts = {
    principles: [
        "Cognitive load theory suggests learning is optimized when information is presented in manageable chunks",
        "Spaced repetition improves long-term retention through distributed practice",
        "Visual hierarchy guides attention and improves information processing",
        "Feedback loops enhance learning and performance improvement"
    ],
    methods: [
        "A/B testing for content optimization and audience analysis",
        "Iterative design process with user feedback integration",
        "Qualitative coding for thematic analysis of user behavior",
        "Mixed methods approach combining quantitative and qualitative data"
    ],
    frameworks: [
        "Design thinking methodology for problem-solving",
        "ADDIE model for instructional design and curriculum development",
        "Systems thinking approach to understanding complex interactions",
        "Agile methodology for project management and iterative development"
    ],
    theories: [
        "Social learning theory emphasizes observation and modeling",
        "Constructivist learning theory promotes active knowledge building",
        "Diffusion of innovation theory explains adoption patterns",
        "Flow theory describes optimal experience and engagement states"
    ]
};

// Mock empty extracted concepts for testing
const mockEmptyExtractedConcepts: ExtractedConcepts = {
    principles: [],
    methods: [],
    frameworks: [],
    theories: []
};

// Test configuration
const TEST_PERSONAS: Persona[] = ['creator', 'educator', 'researcher'];

const TEST_CONTENT_TYPES: Record<Persona, ContentType[]> = {
    creator: [
        'visual-content-analysis',
        'content-strategy-framework',
        'narrative-structure-extractor',
        'creative-process-optimizer',
        'brand-voice-synthesizer',
        'innovation-methodology-builder'
    ],
    educator: [
        'learning-theory-implementer',
        'assessment-strategy-generator',
        'curriculum-design-assistant',
        'student-engagement-optimizer',
        'knowledge-transfer-framework',
        'educational-technology-integrator'
    ],
    researcher: [
        'methodology-replicator',
        'literature-analysis-framework',
        'hypothesis-generation-engine',
        'data-analysis-systematizer',
        'research-question-formulator',
        'academic-writing-optimizer'
    ]
};

interface ValidationResult {
    persona: Persona;
    contentType: ContentType;
    success: boolean;
    transformedConceptsCount: number;
    systemPromptLength: number;
    error?: string;
    testRunName: string;
}

export async function validatePersonaSystem(
    conceptsToTest: ExtractedConcepts,
    testRunName: string
): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    console.log(`🚀 Starting persona system validation for ${testRunName}...\n`);

    for (const persona of TEST_PERSONAS) {
        console.log(`Testing ${persona.toUpperCase()} persona (using ${testRunName}):`);

        for (const contentType of TEST_CONTENT_TYPES[persona]) {
            try {
                console.log(`  - Testing ${contentType}...`);

                // Test transformation
                const transformedConcepts = await transformInsights(
                    conceptsToTest,
                    persona,
                    contentType
                );

                // Count transformed concepts
                const conceptsCount = Object.values(transformedConcepts)
                    .reduce((acc: number, arr: string[]) => acc + arr.length, 0);

                // Test system prompt generation
                const systemPrompt = generateSystemPrompt(
                    transformedConcepts,
                    persona,
                    contentType,
                    { focusAreas: [], complexityLevel: 'intermediate', outputStyle: 'directive' }
                );

                results.push({
                    persona,
                    contentType,
                    success: true,
                    transformedConceptsCount: conceptsCount,
                    systemPromptLength: systemPrompt.length,
                    testRunName
                });

                console.log(`    ✅ Success - ${conceptsCount} concepts, ${systemPrompt.length} chars`);

            } catch (error) {
                results.push({
                    persona,
                    contentType,
                    success: false,
                    transformedConceptsCount: 0,
                    systemPromptLength: 0,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    testRunName
                });

                console.log(`    ❌ Failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        console.log('');
    }

    return results;
}

export function generateValidationReport(results: ValidationResult[]): string {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = totalCount > 0 ? (successCount / totalCount * 100).toFixed(1) : "0.0";

    let report = `# Persona System Validation Report\n\n`;
    report += `## Overall Summary\n`;
    report += `- **Total Tests:** ${totalCount}\n`;
    report += `- **Successful:** ${successCount}\n`;
    report += `- **Failed:** ${totalCount - successCount}\n`;
    report += `- **Success Rate:** ${successRate}%\n\n`;

    const testRunNames = [...new Set(results.map(r => r.testRunName))];

    for (const runName of testRunNames) {
        report += `--- \n`;
        report += `## Test Run: ${runName}\n\n`;
        const runResults = results.filter(r => r.testRunName === runName);
        const runSuccessCount = runResults.filter(r => r.success).length;
        const runTotalCount = runResults.length;
        const runSuccessRate = runTotalCount > 0 ? (runSuccessCount / runTotalCount * 100).toFixed(1) : "0.0";

        report += `### Summary for ${runName}\n`;
        report += `- **Total Tests:** ${runTotalCount}\n`;
        report += `- **Successful:** ${runSuccessCount}\n`;
        report += `- **Failed:** ${runTotalCount - runSuccessCount}\n`;
        report += `- **Success Rate:** ${runSuccessRate}%\n\n`;

        // Group by persona for this specific run
        for (const persona of TEST_PERSONAS) {
            const personaResults = runResults.filter(r => r.persona === persona);
            if (personaResults.length === 0) continue;

            const personaSuccess = personaResults.filter(r => r.success).length;
            report += `### ${persona.charAt(0).toUpperCase() + persona.slice(1)} Persona (${personaSuccess}/${personaResults.length}) - Run: ${runName}\n\n`;

            for (const result of personaResults) {
                const status = result.success ? '✅' : '❌';
                report += `${status} **${result.contentType}**\n`;

                if (result.success) {
                    report += `   - Transformed concepts: ${result.transformedConceptsCount}\n`;
                    report += `   - System prompt length: ${result.systemPromptLength} characters\n`;
                } else {
                    report += `   - Error: ${result.error}\n`;
                }
                report += '\n';
            }
        }
    }

    // Add recommendations for failed tests across all runs
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        report += `--- \n`;
        report += `## Overall Recommendations\n\n`;
        report += `The following combinations failed and need attention:\n\n`;

        for (const failed of failedResults) {
            report += `- **[${failed.testRunName}] ${failed.persona}/${failed.contentType}**: ${failed.error}\n`;
        }
    }

    return report;
}

// Example usage function
export async function runValidation() {
    console.log('Running persona system validation...');

    const standardResults = await validatePersonaSystem(mockExtractedConcepts, "Standard Concepts");
    const emptyResults = await validatePersonaSystem(mockEmptyExtractedConcepts, "Empty Concepts");

    const allResults = [...standardResults, ...emptyResults];
    const report = generateValidationReport(allResults);

    console.log('\n' + '='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));

    return allResults;
}

// Export test data for manual testing
export { mockExtractedConcepts, mockEmptyExtractedConcepts, TEST_PERSONAS, TEST_CONTENT_TYPES };

runValidation(); 