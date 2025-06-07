import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExtractionKernel, type Persona } from '@/server/extraction/ExtractionKernel';
// import { StorageDriver } from '@/lib/extraction/StorageDriver'; // Unused
import { ExtractionEngine } from '@/server/extraction/ExtractionEngine';
// import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent'; // Unused
import type { ExtractedConcepts /*, QAValidationResult*/ } from '@/types'; // QAValidationResult is unused

// Mock the dependencies
// jest.mock('@/lib/extraction/StorageDriver'); // Mock for unused import
jest.mock('@/server/extraction/ExtractionEngine');
// jest.mock('@/lib/extraction/ExtractionQAAgent'); // QAAgent is not directly called by ExtractionKernel anymore

describe('ExtractionKernel', () => {
    // const mockDocumentId = 'test-doc-id'; // Not used directly by .extract
    const mockDocumentText = 'This is the test document content.';
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Mock Principle 1'],
        methods: ['Mock Method 1'],
        frameworks: ['Mock Framework 1'],
        theories: ['Mock Theory 1'],
    };
    // const mockSuccessfulQaResult: QAValidationResult = { // Not used directly
    //     isValid: true,
    //     issues: [],
    //     validatedConcepts: mockExtractedConcepts,
    //     confidenceScore: 0.95,
    // };
    // const mockFailedQaResult: QAValidationResult = { // Not used directly
    //     isValid: false,
    //     issues: ['QA failed due to critical issue'],
    //     validatedConcepts: mockExtractedConcepts,
    //     confidenceScore: 0.3,
    // };

    // let mockedStorageDriver: jest.Mocked<typeof StorageDriver>; // Not used directly
    let mockedExtractionEngine: jest.Mocked<typeof ExtractionEngine>;
    // let mockedExtractionQAAgent: jest.Mocked<typeof ExtractionQAAgent>; // Not used directly

    beforeEach(() => {
        // Reset mocks and clear any previous calls
        jest.clearAllMocks();

        // Assign mocked instances with types
        // mockedStorageDriver = StorageDriver as jest.Mocked<typeof StorageDriver>; // Not used directly
        mockedExtractionEngine = ExtractionEngine as jest.Mocked<typeof ExtractionEngine>;
        // mockedExtractionQAAgent = ExtractionQAAgent as jest.Mocked<typeof ExtractionQAAgent>; // Not used directly
    });

    describe('extract', () => { // Changed from 'handle'
        it('should successfully call ExtractionEngine.extract and return concepts for "creator" persona', async () => {
            // Arrange
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            const input = { persona: 'creator' as const, documentText: mockDocumentText };

            // Act
            const result = await ExtractionKernel.extract(input);

            // Assert
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText, undefined, 'creator');
            expect(result).toEqual(mockExtractedConcepts);
        });

        it('should successfully call ExtractionEngine.extract and return concepts for "researcher" persona', async () => {
            // Arrange
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            const input = { persona: 'researcher' as const, documentText: mockDocumentText };

            // Act
            const result = await ExtractionKernel.extract(input);

            // Assert
            // Note: current ExtractionKernel researcherKernel reuses creatorKernel logic
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText, undefined, 'creator');
            expect(result).toEqual(mockExtractedConcepts);
        });

        it('should successfully call ExtractionEngine.extract and return concepts for "educator" persona', async () => {
            // Arrange
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            const input = { persona: 'educator' as const, documentText: mockDocumentText };

            // Act
            const result = await ExtractionKernel.extract(input);

            // Assert
            // Note: current ExtractionKernel educatorKernel reuses creatorKernel logic
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText, undefined, 'creator');
            expect(result).toEqual(mockExtractedConcepts);
        });

        it('should throw an error if ExtractionEngine.extract fails', async () => {
            // Arrange
            const extractionError = new Error('Extraction process failed');
            mockedExtractionEngine.extract.mockRejectedValue(extractionError);
            const input = { persona: 'creator' as const, documentText: mockDocumentText };

            // Act & Assert
            await expect(ExtractionKernel.extract(input)).rejects.toThrow(extractionError);
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText, undefined, 'creator');
        });

        it('should throw an error for an unsupported persona', async () => {
            // Arrange
            const input = { persona: 'unsupported-persona' as Persona, documentText: mockDocumentText };

            // Act & Assert
            await expect(ExtractionKernel.extract(input)).rejects.toThrow('Unsupported persona: unsupported-persona');
            expect(mockedExtractionEngine.extract).not.toHaveBeenCalled();
        });
    });
}); 