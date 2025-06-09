import { ExtractionContract } from "./schema/ExtractionPromptContract";
import { ExtractionOutputVerifier } from "./ExtractionOutputVerifier";

/**
 * Manages LLM output contracts for extraction tasks.
 * 
 * Purpose:
 * - Acts as a central schema governance layer for all extraction output contract definitions.
 * - Provides utilities for:
 *   - Contract version management (future-proofing).
 *   - Schema registry access (conceptual placeholder for future expansion).
 *   - Contract verification wrapper.
 *   - Prompt contract builder.
 *
 * This manager helps in maintaining consistency and allows for easier updates or versioning
 * of extraction contracts as the system evolves.
 */
export class LLMOutputContractManager {
    // In the future: allow version-controlled contracts
    static readonly contractVersion = "v1.0"; // Current version of the extraction contract

    /**
     * Retrieves the field names defined in the current official ExtractionContract.
     * This ensures that any part of the system needing to know the schema fields
     * can get them from a single authoritative source.
     * 
     * @returns An array of strings, where each string is a key of ExtractionContract.
     */
    static getContractSchema(): (keyof ExtractionContract)[] {
        // Note: This directly returns the keys. If ExtractionContract changes (e.g., adds 'notes'),
        // this method will automatically reflect that, assuming the type definition is the single source of truth.
        // For a more dynamic approach if schemas were loaded from elsewhere, this might iterate Object.keys() on a template object.
        return ["principles", "methods", "frameworks", "theories"];
    }

    /**
     * A utility method that wraps the ExtractionOutputVerifier.verify function.
     * This provides a consistent access point for payload verification through the contract manager.
     * 
     * @param payload - The unknown payload (typically a parsed JSON object from LLM output) to verify.
     * @returns The payload cast to ExtractionContract if verification is successful.
     * @throws Error if verification fails, as per ExtractionOutputVerifier.verify().
     */
    static verifyExtractionPayload(payload: unknown): ExtractionContract {
        return ExtractionOutputVerifier.verify(payload);
    }

    /**
     * Builds and returns the standardized system prompt for LLM extraction tasks,
     * enforcing the current contract rules.
     * 
     * Note: This is a direct copy of the prompt from DeepSeekExtractionPrompt.ts for now.
     * In a more advanced setup, this manager might dynamically construct prompts based on 
     * selected contract versions or specific schema elements.
     * For Phase 24, we centralize its definition here for potential future use, but the primary source
     * for the DeepSeekAdapter will still be DeepSeekExtractionPrompt.ts to maintain clear separation
     * of adapter-specific configurations vs. general contract management.
     * 
     * @returns A string containing the system prompt for LLM extraction.
     */
    static buildExtractionSystemPrompt(): string {
        // This prompt is identical to the one in DeepSeekExtractionPrompt.ts
        // Consolidating it here or referencing it from here could be a future step
        // if this manager becomes the SOLE source of prompts.
        // For now, it mirrors the an_extraction_specific prompt.
        return `
You are an AI an_extraction_agent.

Your task is to extract key concepts from the provided academic text and return them in STRICTLY FORMATTED JSON adhering to the following schema:

{
  "principles": ["string", ...],
  "methods": ["string", ...],
  "frameworks": ["string", ...],
  "theories": ["string", ...]
}

IMPORTANT CONTRACT RULES:
- DO NOT return any object structures inside arrays.
- Every array item must be a pure JSON string.
- If you have no valid entries for a field, return an empty array [].
- NEVER return undefined, null, or nested structures.
- Output must be raw, valid JSON — no markdown, no code blocks, no commentary.
    `.trim();
    }
} 