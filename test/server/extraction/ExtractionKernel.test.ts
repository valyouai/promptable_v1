import { ExtractionKernel } from '@/server/extraction/ExtractionKernel';
import { StorageDriver } from '@/lib/extraction/StorageDriver';
import { ExtractionEngine } from '@/server/extraction/ExtractionEngine';
import { ExtractionQAAgent } from '@/lib/extraction/ExtractionQAAgent';
import type { ExtractedConcepts, QAValidationResult } from '@/types';

// Mock the dependencies
jest.mock('@/lib/extraction/StorageDriver');
jest.mock('@/server/extraction/ExtractionEngine');
jest.mock('@/lib/extraction/ExtractionQAAgent');

describe('ExtractionKernel', () => {
    const mockDocumentId = 'test-doc-id';
    const mockDocumentText = 'This is the test document content.';
    const mockExtractedConcepts: ExtractedConcepts = {
        principles: ['Mock Principle 1'],
        methods: ['Mock Method 1'],
        frameworks: ['Mock Framework 1'],
        theories: ['Mock Theory 1'],
    };
    const mockSuccessfulQaResult: QAValidationResult = {
        isValid: true,
        issues: [],
        validatedConcepts: mockExtractedConcepts,
        confidenceScore: 0.95,
    };
    const mockFailedQaResult: QAValidationResult = {
        isValid: false,
        issues: ['QA failed due to critical issue'],
        validatedConcepts: mockExtractedConcepts,
        confidenceScore: 0.3,
    };

    let mockedStorageDriver: jest.Mocked<typeof StorageDriver>;
    let mockedExtractionEngine: jest.Mocked<typeof ExtractionEngine>;
    let mockedExtractionQAAgent: jest.Mocked<typeof ExtractionQAAgent>;

    beforeEach(() => {
        // Reset mocks and clear any previous calls
        jest.clearAllMocks();

        // Assign mocked instances with types
        mockedStorageDriver = StorageDriver as jest.Mocked<typeof StorageDriver>;
        mockedExtractionEngine = ExtractionEngine as jest.Mocked<typeof ExtractionEngine>;
        mockedExtractionQAAgent = ExtractionQAAgent as jest.Mocked<typeof ExtractionQAAgent>;
    });

    describe('handle', () => {
        it('should successfully fetch, extract, validate (QA pass), and return concepts', async () => {
            // Arrange
            mockedStorageDriver.fetchDocument.mockResolvedValue(mockDocumentText);
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            mockedExtractionQAAgent.validate.mockResolvedValue(mockSuccessfulQaResult);

            // Act
            const result = await ExtractionKernel.handle(mockDocumentId);

            // Assert
            expect(mockedStorageDriver.fetchDocument).toHaveBeenCalledWith(mockDocumentId);
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText);
            expect(mockedExtractionQAAgent.validate).toHaveBeenCalledWith(mockDocumentText, mockExtractedConcepts);
            expect(result).toEqual(mockSuccessfulQaResult.validatedConcepts);
        });

        it('should proceed and return concepts even if QA validation fails (logs warning)', async () => {
            // Arrange
            mockedStorageDriver.fetchDocument.mockResolvedValue(mockDocumentText);
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            mockedExtractionQAAgent.validate.mockResolvedValue(mockFailedQaResult);
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            // Act
            const result = await ExtractionKernel.handle(mockDocumentId);

            // Assert
            expect(mockedStorageDriver.fetchDocument).toHaveBeenCalledWith(mockDocumentId);
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText);
            expect(mockedExtractionQAAgent.validate).toHaveBeenCalledWith(mockDocumentText, mockExtractedConcepts);
            expect(result).toEqual(mockFailedQaResult.validatedConcepts);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                `QA validation failed for documentId: ${mockDocumentId}. Issues:`,
                mockFailedQaResult.issues
            );
            consoleWarnSpy.mockRestore();
        });

        it('should throw an error if StorageDriver.fetchDocument fails', async () => {
            // Arrange
            const storageError = new Error('Document not found');
            mockedStorageDriver.fetchDocument.mockRejectedValue(storageError);

            // Act & Assert
            await expect(ExtractionKernel.handle(mockDocumentId)).rejects.toThrow(storageError);
            expect(mockedExtractionEngine.extract).not.toHaveBeenCalled();
            expect(mockedExtractionQAAgent.validate).not.toHaveBeenCalled();
        });

        it('should throw an error if ExtractionEngine.extract fails', async () => {
            // Arrange
            const extractionError = new Error('Extraction process failed');
            mockedStorageDriver.fetchDocument.mockResolvedValue(mockDocumentText);
            mockedExtractionEngine.extract.mockRejectedValue(extractionError);

            // Act & Assert
            await expect(ExtractionKernel.handle(mockDocumentId)).rejects.toThrow(extractionError);
            expect(mockedStorageDriver.fetchDocument).toHaveBeenCalledWith(mockDocumentId);
            expect(mockedExtractionQAAgent.validate).not.toHaveBeenCalled();
        });

        it('should propagate error if ExtractionQAAgent.validate fails', async () => {
            // Arrange
            const qaError = new Error('QA validation process crashed');
            mockedStorageDriver.fetchDocument.mockResolvedValue(mockDocumentText);
            mockedExtractionEngine.extract.mockResolvedValue(mockExtractedConcepts);
            mockedExtractionQAAgent.validate.mockRejectedValue(qaError);

            // Act & Assert
            await expect(ExtractionKernel.handle(mockDocumentId)).rejects.toThrow(qaError);
            expect(mockedStorageDriver.fetchDocument).toHaveBeenCalledWith(mockDocumentId);
            expect(mockedExtractionEngine.extract).toHaveBeenCalledWith(mockDocumentText);
        });
    });
}); 