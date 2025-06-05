# Promptable System Architecture (v1 - Post Kernel Hygiene Pass)

This document outlines the core architectural flow of the Promptable system after the Kernel Hygiene Pass.

## System Components and Flow

```mermaid
graph TD
    subgraph "Document Upload Flow"
        direction LR
        A1["Client Uploads Document"] --> B1["API: /api/upload-document"];
        B1 --> C1["Extracts Text (processDocument)"];
        C1 --> D1["Save Text to File System<br/>(e.g., /uploads/{documentId}.txt)"];
        D1 --> E1["Response: documentId"];
    end

    subgraph "Concept Extraction Flow"
        direction LR
        A2["Client Requests Extraction<br/>(with documentId)"] --> B2["API: /api/extract-concepts/{documentId}"];
        B2 --> C2["ExtractionKernel.handle(documentId)"];
        C2 --> D2_SD["StorageDriver.fetchDocument(documentId)"];
        D2_SD --> E2_Text["Document Text"];
        E2_Text --> F2_EE["ExtractionEngine.extract(documentText)<br/>(uses OpenAI)"];
        F2_EE --> G2_Concepts["Raw ExtractedConcepts"];
        G2_Concepts --> H2_QA["ExtractionQAAgent.validate(text, concepts)"];
        H2_QA --> I2_ValidatedConcepts["Validated ExtractedConcepts"];
        I2_ValidatedConcepts --> J2["Response: ExtractedConcepts"];
    end

    subgraph "System Prompt Generation Flow (Future Scope)"
        direction LR
        A3["Client Requests System Prompt<br/>(with ExtractedConcepts)"] --> B3["API: /api/generate-system-prompt"];
        B3 --> C3["PromptComposer.generate(concepts)"];
        C3 --> D3["Final System Prompt"];
        D3 --> E3["Response: System Prompt"];
    end

    E1 -.-> A2;  // documentId from upload used in extraction request
    J2 -.-> A3; // ExtractedConcepts from extraction used in prompt generation request

    style A1 fill:#D5F5E3,stroke:#2ECC71
    style B1 fill:#D5F5E3,stroke:#2ECC71
    style C1 fill:#D5F5E3,stroke:#2ECC71
    style D1 fill:#D5F5E3,stroke:#2ECC71
    style E1 fill:#D5F5E3,stroke:#2ECC71

    style A2 fill:#EBF5FB,stroke:#3498DB
    style B2 fill:#EBF5FB,stroke:#3498DB
    style C2 fill:#EBF5FB,stroke:#3498DB
    style D2_SD fill:#EBF5FB,stroke:#3498DB
    style E2_Text fill:#EBF5FB,stroke:#3498DB
    style F2_EE fill:#EBF5FB,stroke:#3498DB
    style G2_Concepts fill:#EBF5FB,stroke:#3498DB
    style H2_QA fill:#EBF5FB,stroke:#3498DB
    style I2_ValidatedConcepts fill:#EBF5FB,stroke:#3498DB
    style J2 fill:#EBF5FB,stroke:#3498DB

    style A3 fill:#FDEDEC,stroke:#E74C3C
    style B3 fill:#FDEDEC,stroke:#E74C3C
    style C3 fill:#FDEDEC,stroke:#E74C3C
    style D3 fill:#FDEDEC,stroke:#E74C3C
    style E3 fill:#FDEDEC,stroke:#E74C3C
```

## Key Components

*   **API Routes**:
    *   `/api/upload-document`: Handles document uploads, extracts text, saves it to the filesystem, and returns a `documentId`.
    *   `/api/extract-concepts/{documentId}`: Retrieves a processed document by its ID and uses the `ExtractionKernel` to extract concepts.
    *   `/api/generate-system-prompt` (Future): Will take extracted concepts and generate a final system prompt.
*   **Extraction Kernel (`lib/extraction`)**:
    *   `ExtractionKernel.ts`: Orchestrates the concept extraction process.
    *   `StorageDriver.ts`: Fetches document text from the configured storage (currently local filesystem).
    *   `ExtractionEngine.ts`: Uses an LLM (via `lib/openai.ts`) to extract structured concepts from document text.
    *   `ExtractionQAAgent.ts`: Validates the concepts extracted by the `ExtractionEngine` using rule-based checks (and placeholder for future LLM-based QA).
*   **Document Processing (`lib/document-processor.ts`)**: Handles text extraction from various document formats (PDF, DOCX, TXT).
*   **Configuration (`lib/config.ts`)**: Centralizes application configuration, sourcing values from environment variables with fallbacks.
*   **OpenAI Client (`lib/openai.ts`)**: Provides an abstraction for interacting with the OpenAI API, including a mock client for testing.

## Data Flow Summary

1.  A client uploads a document. The `upload-document` API extracts its text and saves it to a file named with a generated `documentId`.
2.  The client then requests concept extraction using the `documentId`.
3.  The `extract-concepts` API calls the `ExtractionKernel`.
4.  The `ExtractionKernel` uses the `StorageDriver` to fetch the document text.
5.  The text is passed to the `ExtractionEngine`, which calls an LLM to get structured concepts.
6.  These concepts are validated by the `ExtractionQAAgent`.
7.  The (validated) concepts are returned to the client.
8.  (Future) The client can then use these concepts to generate a system prompt via the `generate-system-prompt` API, which would likely involve a `PromptComposer` component.
