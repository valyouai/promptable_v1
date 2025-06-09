/**
 * Defines the authoritative schema contract for LLM extraction outputs.
 * This interface specifies the expected structure that the LLM (e.g., DeepSeek via DeepSeekAdapter)
 * should adhere to when performing concept extraction tasks.
 * 
 * Adherence to this contract is crucial for minimizing downstream sanitization needs
 * and ensuring data integrity throughout the extraction pipeline.
 */
export interface ExtractionContract {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
    // Add other fields here as the extraction schema evolves, e.g., notes, if it becomes a consistent part of the contract.
} 