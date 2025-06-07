// harness/ExtractionHarness.test.ts

import { describe, it, expect } from '@jest/globals';
import { ExtractionEngine } from '../src/server/extraction/ExtractionEngine';

describe('ExtractionEngine Phase 4 Integration', () => {
    it('should extract and normalize structured concepts end-to-end', async () => {
        const mockDocumentText = `
      Title: AI for Medical Diagnosis
      Abstract: This study applies deep learning to cancer detection.
      Methods: CNN architecture with supervised learning.
      Dataset Used: LIDC-IDRI dataset.
      Key Findings: Model achieved 92% accuracy.
      Limitations: Small dataset size.
      Future Work: Validate on larger datasets.
      Applications: Clinical diagnostics.
    `;

        const mockContext = {
            title: "AI for Medical Diagnosis",
            abstract: "This study applies deep learning to cancer detection.",
            keywords: ["deep learning", "cancer", "diagnosis"]
        };

        const result = await ExtractionEngine.extract(mockDocumentText, mockContext, 'researcher');

        expect(result['Research Objective']).toBeDefined();
        expect(result['Methods']).toContain('CNN');
        expect(result['Dataset(s)']).toContain('LIDC-IDRI');
        expect(result['Key Findings']).toContain('92%');
        expect(result['Limitations']).toContain('dataset');
        expect(result['Future Work']).toContain('Validate');
        expect(result['Applications']).toContain('diagnostics');
    });
}); 