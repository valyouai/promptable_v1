# System Architecture: Context-Aware Processing Agent

This document details the design and integration of the Context-Aware Processing Agent, a critical component responsible for transforming raw extracted research insights into persona- and content-type-specific actionable system prompts.

## 1. Problem Statement Revisited

Initially, the system could extract general principles, methods, frameworks, and theories from research documents. However, these `ExtractedConcepts` were generic. The core problem was the lack of contextualization: the same raw insight needed to be reframed differently for a 'Creator' vs. an 'Educator' or a 'Researcher', depending on their selected content type (e.g., 'Visual Content Analysis' vs. 'Learning Theory Implementer').

## 2. Solution: Context-Aware Processing Agent

The Context-Aware Processing Agent is a logical layer within our existing API pipeline that addresses this contextualization challenge. It leverages advanced AI (OpenAI GPT-4) to dynamically adapt insights based on the user's specific context.

### Key Responsibilities:

- **Filtered Relevance**: Identify and retain only those insights from the raw extraction that are relevant to the specified `persona` and `contentType`.
- **Contextual Framing**: Rephrase or explain insights in a manner that resonates with the chosen persona's domain and application.
- **Actionability**: Transform insights into specific, practical applications or directives tailored for the selected use case.

## 3. Integration into the System Pipeline

This agent is integrated as a crucial intermediary step between the initial document analysis (raw extraction) and the final system prompt generation.

**Enhanced Pipeline Flow:**

```mermaid
graph TD
    A[User Uploads Document] --> B[Document Processing & Raw Concept Extraction]
    B --> C{Send to /api/generate-system-prompt}
    C --> D[API Receives Raw Concepts + Persona/ContentType]
    D --> E[Context-Aware Processing Agent (transformInsights)]
    E --> F[Generate Tailored System Prompt]
    F --> G[Display Tailored System Prompt]
```

### Integration Points:

- **`src/app/creator/[contentType]/page.tsx`**: This client-side page now correctly passes the `persona` (hardcoded as 'creator' for this specific path segment) and `contentType` (from `useParams`) along with the `extractedConcepts` to the `/api/generate-system-prompt` endpoint.
- **`src/app/api/generate-system-prompt/route.ts`**: This Next.js API route is the primary orchestrator.
  1.  It receives the raw `extractedConcepts`, `persona`, and `contentType` from the frontend.
  2.  It then calls the `transformInsights` function (our Context-Aware Processing Agent) with these parameters.
  3.  The _transformed_ concepts (`TransformedConcepts`) are then passed to the `generateSystemPrompt` function.
- **`lib/contextual-transformer.ts`**: This new utility file encapsulates the core logic of the Context-Aware Processing Agent.
  - It defines the `transformInsights` asynchronous function.
  - Inside this function, a meticulously crafted system and user prompt are constructed for the OpenAI API. These prompts instruct the AI to perform the contextual filtering, framing, and actionability transformation on the raw insights, considering the provided `persona` and `contentType`.
  - The OpenAI model used (`gpt-4o-mini`) is chosen for its balance of capability and cost-effectiveness for this transformation task.
  - It includes a fallback mechanism: if the OpenAI call fails, the raw concepts are returned to ensure system stability, albeit without the contextualization.
- **`lib/prompt-templates.ts`**: The `generateSystemPrompt` function in this file has been updated to expect and utilize `TransformedConcepts` instead of the original `ExtractedConcepts`. This ensures that the final system prompt generation leverages the persona-specific insights directly.

## 4. Technical Implementation Details

### `lib/contextual-transformer.ts` (Core Logic)

The `transformInsights` function is designed to be highly flexible and extensible. The prompts sent to OpenAI are structured to clearly define the AI's role and the desired output format (JSON). This allows for future refinements of the contextualization process by simply adjusting the prompt instructions.

```typescript
// Example snippet from lib/contextual-transformer.ts
import openai from "./openai";
import { ExtractedConcepts } from "@/types";
import { Persona, ContentType } from "@/lib/prompt-templates";

export interface TransformedConcepts {
  principles: string[];
  methods: string[];
  frameworks: string[];
  theories: string[];
}

export async function transformInsights(
  rawConcepts: ExtractedConcepts,
  persona: Persona,
  contentType: ContentType
): Promise<TransformedConcepts> {
  const rawInsightsString = Object.entries(rawConcepts)
    .map(
      ([key, value]) =>
        `### ${key.charAt(0).toUpperCase() + key.slice(1)}\n${value
          .map((item: string) => `- ${item}`)
          .join("\n")}`
    )
    .join("\n\n");

  const systemMessage = `You are an AI assistant that specializes in taking raw, extracted research concepts and transforming them into actionable, context-specific insights. Your goal is to reframe the given principles, methods, frameworks, and theories to be highly relevant and applicable to a user with the persona of '${persona}' and focusing on the content type of '${contentType}'.\n\nProvide transformed insights that are filtered for relevance, contextualized for the persona/content type, and framed for actionability. If an insight is not relevant to the persona/content type, omit it. Do not invent new concepts, only reframe the existing ones.\n\nReturn the transformed concepts in a JSON object with the keys 'principles', 'methods', 'frameworks', and 'theories', where each value is an array of strings. Maintain the original categorization (principles, methods, etc.).\n\nExample Transformation (if persona is 'creator' and contentType is 'visual-content-analysis'):\nRaw Insight: "Sparse Priming Representation (SPR) as memory organization technique"\nTransformed Insight: "Use SPR principles to create memorable brand narratives by organizing visual elements that trigger recall"`;

  const userMessage = `Transform the following raw insights for the '${persona}' persona and '${contentType}' content type:\n\n${rawInsightsString}\n\nEnsure the output is a valid JSON object matching the TransformedConcepts interface.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const transformedText = response.choices[0].message.content;
    if (!transformedText) {
      throw new Error("OpenAI response content is empty.");
    }
    const transformedConcepts: TransformedConcepts =
      JSON.parse(transformedText);
    return transformedConcepts;
  } catch (error) {
    console.error("Error transforming insights with OpenAI:", error);
    return rawConcepts;
  }
}
```

## 5. Potential Issues and Mitigations

- **OpenAI API Failures/Timeouts**: The `try-catch` block in `transformInsights` provides a fallback to the raw concepts, preventing a complete system breakdown. Robust error logging is in place.
- **Large Prompts**: The AI model (`gpt-4o-mini`) is selected for efficiency. However, extremely large input documents might generate very long raw insights, potentially hitting OpenAI token limits for the transformation prompt. This is a potential area for future optimization (e.g., chunking raw insights if they exceed a certain length before sending to the AI).
- **Contextualization Quality**: The quality of transformed insights directly depends on the clarity and effectiveness of the prompts sent to OpenAI. Continuous refinement of these prompts based on testing and user feedback will be essential.

## 6. Future Enhancements

- **Caching**: Implement caching for transformed insights based on document ID, persona, and content type to reduce redundant OpenAI calls for repeated requests.
- **UI Feedback**: Enhance frontend with more sophisticated feedback mechanisms (e.g., toast messages) for `System prompt copied to clipboard!` or `Failed to generate system prompt.` instead of simple `alert()` calls.
- **Expanded Content Types/Personas**: As new content types and personas are added, ensure corresponding prompt adjustments and `generateSystemPrompt` logic can handle them seamlessly.
