import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '@/app/api/generate-system-prompt/route'; // Adjust if path is different
import { Persona, ContentType, GenerationConfig } from '@/lib/prompt-templates';
import type { ExtractedConcepts } from '@/types'; // ExtractedConcepts comes from @/types
import type { TransformedConceptItem } from '@/lib/contextual-transformer'; // Added import

describe('/api/generate-system-prompt POST handler', () => {
    test('should successfully generate a system prompt with valid inputs', async () => {
        const mockRawExtractedConcepts: ExtractedConcepts = {
            principles: ['Raw principle 1: Less is more in UI design', 'Raw principle 2: Users prefer intuitive navigation'],
            methods: ['Raw method 1: A/B testing for conversion optimization'],
            frameworks: ['Raw framework 1: HEART for UX measurement'],
            theories: ['Raw theory 1: Cognitive Load Theory'],
        };

        const requestBody = {
            persona: 'creator' as Persona,
            contentType: 'visual-content-analysis' as ContentType,
            focusAreas: ['composition', 'color theory'],
            complexityLevel: 'intermediate' as GenerationConfig['complexityLevel'],
            outputStyle: 'directive' as GenerationConfig['outputStyle'],
            extractedConcepts: mockRawExtractedConcepts,
        };

        const request = new Request('http://localhost/api/generate-system-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 200, 'Response status should be 200');
        assert.strictEqual(responseBody.success, true, 'Response success should be true');
        assert.ok(responseBody.systemPrompt && responseBody.systemPrompt.length > 0, 'System prompt should be a non-empty string');
        assert.ok(responseBody.systemPrompt.includes('**Your Capabilities:**'), 'System prompt should include standard structural elements');

        // Assertions for transformed concepts (based on the current mock in lib/openai.ts for "transform" prompts)
        assert.ok(responseBody.extractedConcepts, 'Response should include transformed concepts');
        assert.ok(Array.isArray(responseBody.extractedConcepts.principles), 'Transformed principles should be an array');
        assert.ok(
            responseBody.extractedConcepts.principles.some((p: TransformedConceptItem) => p.transformed_insight.startsWith('Mocked: Transformed principle')),
            'Transformed principles should match mock output'
        );
        assert.ok(
            responseBody.extractedConcepts.methods.some((m: TransformedConceptItem) => m.transformed_insight.startsWith('Mocked: Testing methodology')),
            'Transformed methods should match mock output'
        );

        assert.ok(responseBody.metadata, 'Response should include metadata');
        assert.strictEqual(responseBody.metadata.persona, 'creator', 'Metadata persona should match input');
        assert.strictEqual(responseBody.metadata.contentType, 'visual-content-analysis', 'Metadata contentType should match input');
    });

    test('should return 400 if required parameters are missing (e.g., extractedConcepts)', async () => {
        const requestBody = {
            persona: 'educator' as Persona,
            contentType: 'curriculum-design-assistant' as ContentType,
            focusAreas: [],
            complexityLevel: 'basic' as GenerationConfig['complexityLevel'],
            outputStyle: 'directive' as GenerationConfig['outputStyle'],
            // extractedConcepts is intentionally omitted
        };

        const request = new Request('http://localhost/api/generate-system-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        assert.strictEqual(response.status, 400, 'Response status should be 400 for missing params');
        assert.strictEqual(responseBody.error, 'Missing required generation parameters or extracted concepts.', 'Error message for missing params not as expected');
    });

    test('should successfully generate a base prompt if transformation yields empty concepts', async () => {
        const mockEmptyRawExtractedConcepts: ExtractedConcepts = {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };

        const requestBody = {
            persona: 'researcher' as Persona,
            contentType: 'methodology-replicator' as ContentType,
            focusAreas: [],
            complexityLevel: 'intermediate' as GenerationConfig['complexityLevel'],
            outputStyle: 'directive' as GenerationConfig['outputStyle'],
            extractedConcepts: mockEmptyRawExtractedConcepts, // API receives empty raw concepts
        };

        const request = new Request('http://localhost/api/generate-system-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const response = await POST(request);
        const responseBody = await response.json();

        // transformInsights will return empty concepts directly because input raw concepts are empty
        // generateSystemPrompt will then produce a base prompt

        assert.strictEqual(response.status, 200, 'Response status should be 200 even with no transformed concepts');
        assert.strictEqual(responseBody.success, true, 'Response success should be true');
        assert.ok(responseBody.systemPrompt && responseBody.systemPrompt.length > 0, 'System prompt should be a non-empty base string');
        assert.ok(responseBody.systemPrompt.includes('**Research-Informed Knowledge Base:**'), 'System prompt should include base structure even if concepts section is empty');

        assert.ok(responseBody.extractedConcepts, 'Response should include (empty) transformed concepts object');
        assert.strictEqual(responseBody.extractedConcepts.principles.length, 0, 'Transformed principles should be empty');
        assert.strictEqual(responseBody.extractedConcepts.methods.length, 0, 'Transformed methods should be empty');
        assert.strictEqual(responseBody.extractedConcepts.frameworks.length, 0, 'Transformed frameworks should be empty');
        assert.strictEqual(responseBody.extractedConcepts.theories.length, 0, 'Transformed theories should be empty');

        assert.ok(responseBody.metadata, 'Response should include metadata');
        assert.strictEqual(responseBody.metadata.persona, 'researcher', 'Metadata persona should match input');
        assert.strictEqual(responseBody.metadata.contentType, 'methodology-replicator', 'Metadata contentType should match input');
    });
}); 