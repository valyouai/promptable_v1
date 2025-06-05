import { transformInsights } from '@/lib/contextual-transformer';
import { generateSystemPrompt } from '@/lib/prompt-templates';
// Mock extracted concepts for testing
const mockExtractedConcepts = {
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
// Test configuration
const TEST_PERSONAS = ['creator', 'educator', 'researcher'];
const TEST_CONTENT_TYPES = {
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
export async function validatePersonaSystem() {
    const results = [];
    console.log('🚀 Starting persona system validation...\n');
    for (const persona of TEST_PERSONAS) {
        console.log(`Testing ${persona.toUpperCase()} persona:`);
        for (const contentType of TEST_CONTENT_TYPES[persona]) {
            try {
                console.log(`  - Testing ${contentType}...`);
                // Test transformation
                const transformedConcepts = await transformInsights(mockExtractedConcepts, persona, contentType);
                // Count transformed concepts
                const conceptsCount = Object.values(transformedConcepts)
                    .reduce((acc, arr) => acc + arr.length, 0);
                // Test system prompt generation
                const systemPrompt = generateSystemPrompt(transformedConcepts, persona, contentType, { focusAreas: [], complexityLevel: 'intermediate', outputStyle: 'directive' });
                results.push({
                    persona,
                    contentType,
                    success: true,
                    transformedConceptsCount: conceptsCount,
                    systemPromptLength: systemPrompt.length
                });
                console.log(`    ✅ Success - ${conceptsCount} concepts, ${systemPrompt.length} chars`);
            }
            catch (error) {
                results.push({
                    persona,
                    contentType,
                    success: false,
                    transformedConceptsCount: 0,
                    systemPromptLength: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                console.log(`    ❌ Failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        console.log('');
    }
    return results;
}
export function generateValidationReport(results) {
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    let report = `# Persona System Validation Report\n\n`;
    report += `## Summary\n`;
    report += `- **Total Tests:** ${totalCount}\n`;
    report += `- **Successful:** ${successCount}\n`;
    report += `- **Failed:** ${totalCount - successCount}\n`;
    report += `- **Success Rate:** ${successRate}%\n\n`;
    // Group by persona
    for (const persona of TEST_PERSONAS) {
        const personaResults = results.filter(r => r.persona === persona);
        const personaSuccess = personaResults.filter(r => r.success).length;
        report += `## ${persona.charAt(0).toUpperCase() + persona.slice(1)} Persona (${personaSuccess}/${personaResults.length})\n\n`;
        for (const result of personaResults) {
            const status = result.success ? '✅' : '❌';
            report += `${status} **${result.contentType}**\n`;
            if (result.success) {
                report += `   - Transformed concepts: ${result.transformedConceptsCount}\n`;
                report += `   - System prompt length: ${result.systemPromptLength} characters\n`;
            }
            else {
                report += `   - Error: ${result.error}\n`;
            }
            report += '\n';
        }
    }
    // Add recommendations
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
        report += `## Recommendations\n\n`;
        report += `The following combinations failed and need attention:\n\n`;
        for (const failed of failedResults) {
            report += `- **${failed.persona}/${failed.contentType}**: ${failed.error}\n`;
        }
    }
    return report;
}
// Example usage function
export async function runValidation() {
    console.log('Running persona system validation...');
    const results = await validatePersonaSystem();
    const report = generateValidationReport(results);
    console.log('\n' + '='.repeat(50));
    console.log(report);
    console.log('='.repeat(50));
    return results;
}
// Export test data for manual testing
export { mockExtractedConcepts, TEST_PERSONAS, TEST_CONTENT_TYPES };
