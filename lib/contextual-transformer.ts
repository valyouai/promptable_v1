import { ExtractedConcepts } from '@/types';
import { Persona, ContentType } from '@/lib/prompt-templates';
import openai from './openai'; // Import OpenAI client
// import { encoding_for_model, TiktokenModel } from "@dqbd/tiktoken"; // Old import
// import { TextDecoder } from 'util'; // No longer needed as tokenizer helper handles it
import { countTokens, encodeText, decodeTokens } from '@/lib/tokenizer'; // New tokenizer helper

export interface TransformedConceptItem {
    raw_insight: string;
    transformed_insight: string;
}

export interface TransformedConcepts {
    principles: TransformedConceptItem[];
    methods: TransformedConceptItem[];
    frameworks: TransformedConceptItem[];
    theories: TransformedConceptItem[];
}

// Define persona-specific context mappings
const PERSONA_CONTEXTS: Record<Persona, { focus: string; approach: string; language: string }> = {
    creator: {
        focus: "creative content production, storytelling, visual design, and audience engagement",
        approach: "practical application for content creation, brand building, and creative workflows",
        language: "actionable, creative, and audience-focused"
    },
    educator: {
        focus: "pedagogical implementation, learning design, student engagement, and educational effectiveness",
        approach: "instructional design, curriculum development, and evidence-based teaching practices",
        language: "educational, learner-centered, and pedagogically sound"
    },
    researcher: {
        focus: "academic rigor, systematic analysis, methodology, and scholarly contribution",
        approach: "research methodology, analytical frameworks, and academic writing standards",
        language: "scholarly, methodologically precise, and academically rigorous"
    }
};

// Define content-type specific transformations
const CONTENT_TYPE_CONTEXTS: Record<ContentType, string> = {
    // Creator content types
    "visual-content-analysis": "analyzing and creating compelling visual content that drives engagement",
    "content-strategy-framework": "developing strategic content plans and methodologies",
    "narrative-structure-extractor": "crafting compelling stories and narrative frameworks",
    "creative-process-optimizer": "streamlining creative workflows and ideation processes",
    "brand-voice-synthesizer": "developing consistent brand communication and messaging",
    "innovation-methodology-builder": "creating innovative approaches and creative solutions",

    // Educator content types
    "learning-theory-implementer": "applying educational theories to practical teaching scenarios",
    "assessment-strategy-generator": "creating effective evaluation and feedback systems",
    "curriculum-design-assistant": "structuring educational content and learning sequences",
    "student-engagement-optimizer": "enhancing learner motivation and participation",
    "knowledge-transfer-framework": "facilitating effective learning and knowledge retention",
    "educational-technology-integrator": "incorporating technology to enhance learning outcomes",

    // Researcher content types
    "methodology-replicator": "applying research methodologies to new investigations",
    "literature-analysis-framework": "conducting systematic literature reviews and analysis",
    "hypothesis-generation-engine": "formulating testable research questions and hypotheses",
    "data-analysis-systematizer": "organizing and analyzing research data effectively",
    "research-question-formulator": "developing focused and researchable questions",
    "academic-writing-optimizer": "structuring academic papers and scholarly communication"
};

function buildPersonaSpecificPrompt(persona: Persona, contentType: ContentType): string {
    const personaContext = PERSONA_CONTEXTS[persona];
    const contentContext = CONTENT_TYPE_CONTEXTS[contentType];

    return `You are an AI assistant specializing in transforming raw research concepts into ${personaContext.language} insights for ${personaContext.focus}.

Your target user is a ${persona} who needs help with ${contentContext}.

Your transformation approach should focus on ${personaContext.approach}.

TRANSFORMATION GUIDELINES:
1. Filter for relevance: Only include insights that directly apply to ${contentContext}
2. Reframe language: Use ${personaContext.language} terminology and framing
3. Ensure actionability: Transform abstract concepts into concrete, implementable strategies
4. Maintain categorization: Keep principles, methods, frameworks, and theories separate
5. Persona alignment: Every insight should clearly benefit a ${persona}'s work

QUALITY STANDARDS:
- Each transformed insight should be immediately applicable to ${contentContext}
- Use domain-specific vocabulary appropriate for ${persona}s
- Focus on practical implementation over theoretical discussion
- Ensure insights are specific enough to guide actual work

If a raw insight cannot be meaningfully transformed for this persona/content type combination, omit it entirely.`;
}

export async function transformInsights(
    rawConcepts: ExtractedConcepts,
    persona: Persona,
    contentType: ContentType
): Promise<TransformedConcepts> {
    console.log('[transformInsights] Received rawConcepts:', JSON.stringify(rawConcepts, null, 2));
    console.log(`[transformInsights] Persona: ${persona}, ContentType: ${contentType}`);

    const isEmptyInput =
        rawConcepts.principles.length === 0 &&
        rawConcepts.methods.length === 0 &&
        rawConcepts.frameworks.length === 0 &&
        rawConcepts.theories.length === 0;

    if (isEmptyInput) {
        console.log('[transformInsights] Received empty input — returning empty transformed concepts.');
        return {
            principles: [],
            methods: [],
            frameworks: [],
            theories: [],
        };
    }

    // Format raw insights for processing
    const rawInsightsString = Object.entries(rawConcepts)
        .map(([key, value]) => `### ${key.charAt(0).toUpperCase() + key.slice(1)}\n${value.map((item: string) => `- ${item}`).join('\n')}`)
        .join('\n\n');

    // --- Token budget safeguard for rawInsightsString ---
    const maxTokensForInsights = 12000; // Budget for the raw insights part of the prompt
    let safeRawInsightsString = rawInsightsString;
    const insightsModelName = "gpt-4o-mini"; // Model used in this specific function

    try {
        const insightsTokenCount = countTokens(rawInsightsString, insightsModelName);

        if (insightsTokenCount > maxTokensForInsights) {
            console.warn(`[transformInsights] RawInsightsString with ${insightsTokenCount} tokens exceeds budget of ${maxTokensForInsights}. Truncating.`);
            const encodedInsights = encodeText(rawInsightsString, insightsModelName);
            const truncatedEncodedInsights = encodedInsights.slice(0, maxTokensForInsights);
            safeRawInsightsString = decodeTokens(truncatedEncodedInsights, insightsModelName);
            console.log(`[transformInsights] Truncated rawInsightsString to approx. ${maxTokensForInsights} tokens. New length: ${safeRawInsightsString.length} chars.`);
        } else {
            console.log(`[transformInsights] RawInsightsString with ${insightsTokenCount} tokens is within budget. No truncation needed.`);
        }
    } catch (err) {
        console.error('[transformInsights] Error during token budgeting for rawInsightsString. Using untruncated version. Error:', err);
        // safeRawInsightsString remains rawInsightsString (initialized above)
        // insightsTokenCount = -1; // Indicate budgeting failure - this variable is not used elsewhere after this block
    }
    // encoding.free() is no longer needed
    // --- End token budget safeguard ---

    // Build persona-specific system message
    const systemMessage = buildPersonaSpecificPrompt(persona, contentType);

    // Create user message with examples based on persona, using the safeRawInsightsString
    const userMessage = `Transform the following raw research insights for a ${persona} working on ${contentType}:\n\n${safeRawInsightsString}\n\nReturn ONLY a valid JSON object with keys 'principles', 'methods', 'frameworks', and 'theories', where each value is an array of transformed insights.\n\nExample transformation pattern for ${persona}:\n${getExampleTransformation(persona, contentType)}`;

    console.log('[transformInsights] System Message for OpenAI:', systemMessage);
    console.log('[transformInsights] User Message for OpenAI:', userMessage);

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemMessage },
                { role: 'user', content: userMessage },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 2000, // Ensure enough tokens for comprehensive responses
        });

        const transformedText = response.choices[0].message.content;
        console.log('[transformInsights] Raw response content from OpenAI:', transformedText);

        if (!transformedText) {
            console.error('[transformInsights] OpenAI response content is empty or null.');
            throw new Error('OpenAI response content is empty.');
        }

        const transformedConcepts: TransformedConcepts = JSON.parse(transformedText);
        console.log('[transformInsights] Parsed transformedConcepts:', JSON.stringify(transformedConcepts, null, 2));

        // Validate that we have meaningful content
        if (!hasValidContent(transformedConcepts)) {
            console.warn("[transformInsights] Transformed concepts appear to be empty or invalid based on hasValidContent check.");
            console.log("[transformInsights] Falling back to mapped rawConcepts due to empty/invalid transformed content.");
            // Map rawConcepts to TransformedConcepts structure for fallback, using updated property names
            return {
                principles: rawConcepts.principles.map(p => ({ raw_insight: p, transformed_insight: "[Transformation N/A - Fallback]" })),
                methods: rawConcepts.methods.map(m => ({ raw_insight: m, transformed_insight: "[Transformation N/A - Fallback]" })),
                frameworks: rawConcepts.frameworks.map(f => ({ raw_insight: f, transformed_insight: "[Transformation N/A - Fallback]" })),
                theories: rawConcepts.theories.map(t => ({ raw_insight: t, transformed_insight: "[Transformation N/A - Fallback]" })),
            };
        }

        console.log("[transformInsights] Successfully transformed concepts.");
        return transformedConcepts;
    } catch (error) {
        console.error('[transformInsights] Error during OpenAI call or processing:', error);
        console.log("[transformInsights] Falling back to mapped rawConcepts due to error.");
        // Fallback to mapped raw concepts to ensure system stability and type conformity, using updated property names
        return {
            principles: rawConcepts.principles.map(p => ({ raw_insight: p, transformed_insight: "[Transformation Failed - Error]" })),
            methods: rawConcepts.methods.map(m => ({ raw_insight: m, transformed_insight: "[Transformation Failed - Error]" })),
            frameworks: rawConcepts.frameworks.map(f => ({ raw_insight: f, transformed_insight: "[Transformation Failed - Error]" })),
            theories: rawConcepts.theories.map(t => ({ raw_insight: t, transformed_insight: "[Transformation Failed - Error]" })),
        };
    }
}

function getExampleTransformation(persona: Persona, contentType: ContentType): string {
    const examples: Record<Persona, Partial<Record<ContentType, string>>> = {
        creator: {
            "visual-content-analysis": "Raw: 'Cognitive load theory in learning' → Transformed: 'Apply cognitive load principles to create visually clean content that doesn't overwhelm viewers, using strategic white space and progressive information reveal'",
            "content-strategy-framework": "Raw: 'Systems thinking approach' → Transformed: 'Build content ecosystems where each piece connects and amplifies others, creating compound engagement effects across platforms'"
        },
        educator: {
            "learning-theory-implementer": "Raw: 'Spaced repetition for memory' → Transformed: 'Design lesson sequences with built-in review cycles, spacing key concepts across multiple sessions to enhance long-term retention'",
            "assessment-strategy-generator": "Raw: 'Formative assessment principles' → Transformed: 'Create low-stakes knowledge checks throughout lessons to gauge understanding and adjust instruction in real-time'"
        },
        researcher: {
            "methodology-replicator": "Raw: 'Mixed methods approach' → Transformed: 'Establish systematic protocols for combining quantitative data collection with qualitative analysis to strengthen research validity'",
            "literature-analysis-framework": "Raw: 'Thematic analysis process' → Transformed: 'Develop coding frameworks for systematic identification of patterns across research literature, ensuring reproducible analysis'"
        }
    };

    return examples[persona]?.[contentType] || "Raw insight → Persona-specific transformed insight";
}

function hasValidContent(concepts: TransformedConcepts): boolean {
    const totalItems = Object.values(concepts).reduce((acc, arr) => acc + arr.length, 0);
    return totalItems > 0;
}

// Export persona and content type mappings for use in other parts of the system
export { PERSONA_CONTEXTS, CONTENT_TYPE_CONTEXTS }; 