import openai from './openai';
export async function extractConcepts(text) {
    const prompt = `Extract key concepts, principles, methods, and frameworks from the following research text.
  Format the output as a JSON object with keys: "principles", "methods", "frameworks", "theories".
  Each key should contain an array of strings. If a category is not found, provide an empty array.

  Research Text:
  """
  ${text}
  """

  JSON Output:`;
    try {
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'gpt-4o', // Using gpt-4o as it's generally good for structured output
            response_format: { type: "json_object" },
            temperature: 0.2,
        });
        const rawResponse = completion.choices[0].message.content;
        if (!rawResponse) {
            throw new Error('No response from OpenAI for concept extraction.');
        }
        const parsedResponse = JSON.parse(rawResponse);
        // Basic validation to ensure the structure matches
        const validatedConcepts = {
            principles: Array.isArray(parsedResponse.principles) ? parsedResponse.principles.map(String) : [],
            methods: Array.isArray(parsedResponse.methods) ? parsedResponse.methods.map(String) : [],
            frameworks: Array.isArray(parsedResponse.frameworks) ? parsedResponse.frameworks.map(String) : [],
            theories: Array.isArray(parsedResponse.theories) ? parsedResponse.theories.map(String) : [],
        };
        return validatedConcepts;
    }
    catch (error) {
        console.error('Error extracting concepts:', error);
        // Return empty arrays or re-throw based on desired error handling
        return { principles: [], methods: [], frameworks: [], theories: [] };
    }
}
