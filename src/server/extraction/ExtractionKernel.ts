import { ExtractedConcepts } from '@/types';
import { DocumentContext } from './PromptCompiler';
import { ExtractionEngine } from './ExtractionEngine';

export type Persona = 'creator' | 'researcher' | 'educator';

interface ExtractionKernelInput {
    persona: Persona;
    documentText: string;
    context?: unknown;
}

export class ExtractionKernel {
    public static async extract(input: ExtractionKernelInput): Promise<ExtractedConcepts> {
        switch (input.persona) {
            case 'creator':
                return await this.creatorKernel(input.documentText, input.context);
            case 'researcher':
                return await this.researcherKernel(input.documentText, input.context);
            case 'educator':
                return await this.educatorKernel(input.documentText, input.context);
            default:
                throw new Error(`Unsupported persona: ${input.persona}`);
        }
    }

    private static async creatorKernel(documentText: string, context?: unknown): Promise<ExtractedConcepts> {
        return ExtractionEngine.extract(documentText, context as DocumentContext | undefined, 'creator');
    }

    private static async researcherKernel(documentText: string, context?: unknown): Promise<ExtractedConcepts> {
        // ⚠ TEMPORARY: While researcher schema not yet implemented, we reuse creator logic for now
        return await this.creatorKernel(documentText, context);
    }

    private static async educatorKernel(documentText: string, context?: unknown): Promise<ExtractedConcepts> {
        // ⚠ TEMPORARY: While educator schema not yet implemented, we reuse creator logic for now
        return await this.creatorKernel(documentText, context);
    }
} 