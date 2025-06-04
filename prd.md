### Environment Variables

````
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=10485760  # 10MB in bytes
NEXT_PUBLIC_SUPPORTED_# Promptable PRD - Single Source of Truth
*Product Requirements Document & Development Blueprint*

## 🎯 VISION STATEMENT
Build an intelligent research-to-prompt transformation platform that converts academic papers and research documents into powerful AI system prompts tailored for different professional personas (Creator, Educator, Researcher).

## 🚀 CORE PROBLEM
- Researchers and professionals have valuable knowledge trapped in papers but can't easily turn it into actionable AI prompts
- Extracting principles, methods, and frameworks from research requires deep analysis that most users can't do effectively
- Current AI prompting tools are generic and don't leverage domain-specific research insights
- No platform exists that bridges academic research with practical AI system prompt creation

## ✅ SUCCESS CRITERIA
- User can upload a research paper and get a high-quality AI system prompt in under 5 minutes
- Generated prompts effectively capture the core principles, methods, and frameworks from the research
- System prompts are immediately usable with external AI tools (ChatGPT, Claude, etc.)
- Different personas (Creator/Educator/Researcher) get contextually relevant prompt transformations
- Interface guides users seamlessly from upload → analysis → prompt generation → export

---

## 📋 FEATURE SPECIFICATION

### Phase 1: MVP (Minimum Viable Product)
*Build this first. Nothing else until this works perfectly.*

#### Core User Flow
1. **Landing Page** → User sees value proposition for research-to-prompt transformation
2. **Dashboard** → User selects persona (Creator/Educator/Researcher)
3. **Content Type Selection** → User picks specific prompt application type
4. **Research Upload** → User uploads research paper/document (PDF, TXT, DOCX)
5. **Document Analysis** → System extracts key principles, methods, frameworks
6. **Prompt Generation** → AI creates tailored system prompt based on persona + content type + research
7. **Review & Refine** → User can review and request modifications
8. **Export/Save** → User gets their AI system prompt ready for use

#### Required Pages & Components

**1. Landing Page (`/`)**
- Hero section explaining what Promptable does
- "Get Started" button → routes to `/dashboard`
- Simple, clean design

**2. Dashboard (`/dashboard`)**
- Quick Start section with 3 persona cards:
  - **Creator** (95% match) - "For creative professionals and content creators"
  - **Educator** (88% match) - "For teachers and instructional designers"
  - **Researcher** (92% match) - "For academics and analytical professionals"
- Each card clicks to persona-specific page
- Show basic stats (can be placeholder for now)

**3. Persona Pages (`/creator`, `/educator`, `/researcher`)**
- Title: "Choose Your Content Type"
- Grid of content type cards specific to each persona
- Each card shows: Name, Description, Example use case
- Click routes to generation page

**4. Generation Pages (`/[persona]/[contentType]`)**
- Research document upload area (drag & drop + file picker)
- Upload status and processing indicator
- Document analysis preview (extracted key concepts)
- "Generate System Prompt" button
- Results area showing generated AI system prompt
- Refinement options (modify focus, adjust complexity)
- Export options (Copy, Download as TXT, Share link)

**5. Analysis & Processing**
- Document parsing and text extraction
- Key concept identification using AI
- Principle and method extraction
- Framework and theory isolation
- Persona-specific relevance scoring

#### Content Types by Persona

**Creator Content Types:**
- Visual Content Analysis System (extract visual principles for AI image/video tools)
- Content Strategy Framework (turn research into content creation methodology)
- Narrative Structure Extractor (extract storytelling patterns and techniques)
- Creative Process Optimizer (transform research into creative workflow prompts)
- Brand Voice Synthesizer (extract communication patterns and tone frameworks)
- Innovation Methodology Builder (convert innovation research into actionable AI prompts)

**Educator Content Types:**
- Learning Theory Implementer (extract pedagogical principles into teaching AI)
- Assessment Strategy Generator (turn research into evaluation framework prompts)
- Curriculum Design Assistant (extract educational structures and sequences)
- Student Engagement Optimizer (convert engagement research into practical AI tools)
- Knowledge Transfer Framework (transform learning research into AI tutoring prompts)
- Educational Technology Integrator (extract EdTech principles for AI implementation)

**Researcher Content Types:**
- Methodology Replicator (extract research methods into systematic AI prompts)
- Literature Analysis Framework (turn papers into comprehensive review AI systems)
- Hypothesis Generation Engine (extract reasoning patterns for AI research assistance)
- Data Analysis Systematizer (convert analytical approaches into AI data processing prompts)
- Research Question Formulator (extract inquiry patterns into question-generating AI)
- Academic Writing Optimizer (transform writing research into AI writing assistant prompts)

#### API Requirements

**Document Upload & Processing**
- `POST /api/upload-document` - Handle file upload and initial processing
- `GET /api/document/[id]/status` - Check processing status
- `GET /api/document/[id]/analysis` - Get extracted concepts and analysis

**Prompt Generation**
- `POST /api/generate-system-prompt` - Generate AI system prompt from research
- Request format:
```json
{
  "documentId": "uuid",
  "persona": "creator|educator|researcher",
  "contentType": "visual-content-analysis|methodology-replicator|etc",
  "focusAreas": ["principle1", "method2", "framework3"],
  "complexityLevel": "basic|intermediate|advanced",
  "outputStyle": "directive|conversational|technical"
}
````

- Response format:

```json
{
  "success": true,
  "systemPrompt": "You are an AI assistant that applies [extracted principle] to [specific application]...",
  "extractedConcepts": {
    "principles": ["concept1", "concept2"],
    "methods": ["method1", "method2"],
    "frameworks": ["framework1", "framework2"],
    "theories": ["theory1", "theory2"]
  },
  "metadata": {
    "documentTitle": "Research Paper Title",
    "persona": "creator",
    "contentType": "visual-content-analysis",
    "confidenceScore": 0.85,
    "timestamp": "2025-06-04T10:30:00Z"
  }
}
```

**Document Analysis Pipeline**

1. File upload and format detection
2. Text extraction (PDF, DOCX, TXT)
3. Content chunking and preprocessing
4. AI-powered concept extraction
5. Principle and method identification
6. Framework and theory isolation
7. Relevance scoring for selected persona
8. System prompt template population

---

## 🛠 TECHNICAL ARCHITECTURE

### Technology Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API routes
- **AI**: OpenAI GPT-4 API for analysis and prompt generation
- **Document Processing**: PDF.js for PDF parsing, mammoth for DOCX
- **File Upload**: Native HTML5 file upload with drag & drop
- **Database**: None required for MVP (can add later for document storage)
- **Deployment**: Vercel

### Project Structure

```
promptable/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard
│   ├── creator/
│   │   ├── page.tsx            # Creator content types
│   │   └── [contentType]/
│   │       └── page.tsx        # Creator upload & generation
│   ├── educator/
│   │   ├── page.tsx            # Educator content types
│   │   └── [contentType]/
│   │       └── page.tsx        # Educator upload & generation
│   ├── researcher/
│   │   ├── page.tsx            # Researcher content types
│   │   └── [contentType]/
│   │       └── page.tsx        # Researcher upload & generation
│   └── api/
│       ├── upload-document/
│       │   └── route.ts        # Document upload endpoint
│       ├── document/
│       │   └── [id]/
│       │       ├── status/
│       │       │   └── route.ts # Processing status
│       │       └── analysis/
│       │           └── route.ts # Analysis results
│       └── generate-system-prompt/
│           └── route.ts        # System prompt generation
├── components/
│   ├── PersonaCard.tsx
│   ├── ContentTypeCard.tsx
│   ├── DocumentUploader.tsx
│   ├── AnalysisPreview.tsx
│   ├── SystemPromptGenerator.tsx
│   └── ExportOptions.tsx
├── lib/
│   ├── document-processor.ts   # Document parsing utilities
│   ├── concept-extractor.ts    # AI-powered concept extraction
│   ├── prompt-templates.ts     # System prompt templates
│   └── openai.ts              # OpenAI client
└── types/
    └── index.ts               # TypeScript types
```

### Key Components

**PersonaCard Component**

```tsx
interface PersonaCardProps {
  title: string;
  match: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}
```

**ContentTypeCard Component**

```tsx
interface ContentTypeCardProps {
  title: string;
  description: string;
  example: string;
  onClick: () => void;
}
```

**DocumentUploader Component**

```tsx
interface DocumentUploaderProps {
  onUpload: (file: File) => void;
  acceptedTypes: string[];
  isProcessing: boolean;
  processingStatus?: string;
}
```

**AnalysisPreview Component**

```tsx
interface AnalysisPreviewProps {
  documentId: string;
  extractedConcepts: {
    principles: string[];
    methods: string[];
    frameworks: string[];
    theories: string[];
  };
  onConceptSelect: (concepts: string[]) => void;
}
```

**SystemPromptGenerator Component**

```tsx
interface SystemPromptGeneratorProps {
  documentId: string;
  persona: string;
  contentType: string;
  selectedConcepts: string[];
  onGenerate: (config: GenerationConfig) => void;
  isLoading: boolean;
  result?: SystemPromptResult;
}
```

---

## 📝 SYSTEM PROMPT TEMPLATES

### Template Structure

Each system prompt should transform research insights into actionable AI directives:

```
You are an AI assistant that applies [EXTRACTED_PRINCIPLE] to [SPECIFIC_APPLICATION] based on [RESEARCH_SOURCE].

CORE METHODOLOGY:
[Extracted methods and approaches from research]

KEY PRINCIPLES:
- [Principle 1 from research]
- [Principle 2 from research]
- [Principle 3 from research]

IMPLEMENTATION FRAMEWORK:
[Step-by-step approach derived from research]

PRACTICAL APPLICATION:
[How to apply these concepts in real-world scenarios]

OUTPUT REQUIREMENTS:
[Specific formatting and delivery expectations]

CONSTRAINTS:
[Limitations and considerations from original research]
```

### Example Generated System Prompts

**Creator - Visual Content Analysis (from Computer Vision Research)**

```
You are an AI assistant that applies zero-shot vision encoder grafting techniques to optimize visual content analysis without additional training, based on recent computer vision research on transfer learning.

CORE METHODOLOGY:
Implement feature grafting by selecting and integrating visual elements that align with current content strategy using minimal computational resources, following the principle of direct feature transferability.

KEY PRINCIPLES:
- Zero-shot learning enables immediate application without retraining
- Visual encoders can be grafted onto existing language model architectures
- Surrogate model training reduces computational overhead by 60-80%
- Feature alignment occurs in shared embedding spaces

IMPLEMENTATION FRAMEWORK:
1. Identify visual elements that require analysis or optimization
2. Apply pre-trained visual encoder features directly to content
3. Integrate results with existing content workflow without disruption
4. Validate output quality using confidence scoring mechanisms

PRACTICAL APPLICATION:
Use this approach for rapid visual content optimization, automated image tagging, visual similarity matching, and content recommendation systems where training new models is not feasible.

OUTPUT REQUIREMENTS:
Provide specific visual analysis insights with confidence scores, actionable recommendations, and integration steps for existing content workflows.

CONSTRAINTS:
Limited to pre-trained model capabilities, requires quality validation steps, and may have reduced accuracy compared to fully trained specialized models.
```

**Educator - Learning Theory Implementation (from Educational Psychology Research)**

```
You are an AI tutoring assistant that implements cognitive load theory and spaced repetition principles to optimize learning outcomes, based on educational psychology research on memory consolidation and knowledge retention.

CORE METHODOLOGY:
Apply evidence-based learning techniques by structuring information presentation to match human cognitive processing patterns, implementing distributed practice schedules, and providing adaptive feedback mechanisms.

KEY PRINCIPLES:
- Cognitive load should be managed through progressive complexity introduction
- Spaced repetition intervals follow forgetting curve optimization (1 day, 3 days, 1 week, 2 weeks, 1 month)
- Active recall significantly outperforms passive review by 3x retention rates
- Interleaving different concepts improves discrimination and transfer

IMPLEMENTATION FRAMEWORK:
1. Assess learner's current knowledge state and cognitive capacity
2. Break complex topics into digestible chunks with clear learning objectives
3. Schedule review sessions based on forgetting curve predictions
4. Implement active recall through questioning and problem-solving
5. Provide immediate corrective feedback with explanation rationales

PRACTICAL APPLICATION:
Create personalized learning paths, generate spaced repetition schedules, design assessment questions that promote deep learning, and adapt content difficulty based on performance patterns.

OUTPUT REQUIREMENTS:
Deliver structured learning content with timing recommendations, interactive elements for active engagement, and progress tracking mechanisms with clear success metrics.

CONSTRAINTS:
Requires baseline assessment data, effectiveness depends on consistent learner engagement, and may need adjustment for individual learning differences and preferences.
```

---

## 🎨 UI/UX REQUIREMENTS

### Design Principles

- **Simplicity First**: Every screen should have one clear primary action
- **Progressive Disclosure**: Show only what's needed at each step
- **Visual Hierarchy**: Important elements should be obviously important
- **Consistent Patterns**: Same interactions work the same way everywhere

### Color Scheme

- Primary: Blue (#3B82F6)
- Secondary: Green (#10B981)
- Success: Green (#22C55E)
- Warning: Yellow (#F59E0B)
- Error: Red (#EF4444)
- Text: Gray (#374151)
- Background: White/Light Gray (#F9FAFB)

### Typography

- Headings: Inter, bold
- Body: Inter, regular
- Code: Mono space font

### Component States

- Default state
- Hover state
- Loading state
- Success state
- Error state

---

## 🔄 DEVELOPMENT PHASES

### Phase 1: MVP Foundation (Week 1-2)

**Goal**: Basic document upload and analysis pipeline

1. Set up Next.js project with TypeScript and Tailwind
2. Create landing page emphasizing research-to-prompt transformation
3. Build dashboard with 3 persona cards (updated descriptions)
4. Implement basic routing structure
5. Create document upload functionality with file type detection
6. Build simple document text extraction (PDF, TXT, DOCX)
7. Create placeholder API endpoints for document processing

### Phase 2: AI Analysis Pipeline (Week 3-4)

**Goal**: Research analysis and concept extraction working

1. Implement OpenAI integration for document analysis
2. Build concept extraction system (principles, methods, frameworks, theories)
3. Create analysis preview interface showing extracted concepts
4. Implement concept selection and refinement
5. Build basic system prompt generation from templates
6. Add processing status indicators and loading states

### Phase 3: System Prompt Generation (Week 5-6)

**Goal**: Full research-to-prompt transformation pipeline

1. Create comprehensive system prompt templates for each persona/content type
2. Implement dynamic prompt generation based on extracted concepts
3. Add prompt customization options (complexity, style, focus areas)
4. Create review and refinement interface
5. Implement export functionality (copy, download, share)
6. Add error handling for document processing failures

### Phase 4: Polish & Production (Week 7-8)

**Goal**: Production-ready quality and user experience

1. Optimize document processing performance and reliability
2. Improve UI/UX with proper file upload states and progress indicators
3. Add comprehensive error handling and user feedback
4. Implement prompt quality validation and confidence scoring
5. Add usage analytics and system monitoring
6. Deploy to production with proper monitoring

### Phase 4: Advanced Features (Future)

**Goal**: Extended functionality

1. User accounts and saved prompts
2. Prompt rating and improvement system
3. Advanced export options (PDF, various formats)
4. Community features (sharing prompts)
5. API for developers

---

## 🧪 TESTING STRATEGY

### Manual Testing Checklist

**For each persona and content type:**

- [ ] User can upload research document (PDF, DOCX, TXT)
- [ ] Document processing completes successfully with status updates
- [ ] System extracts relevant concepts, principles, methods from research
- [ ] User can review and select specific concepts to emphasize
- [ ] Generated system prompt accurately reflects research insights
- [ ] System prompt is practical and immediately usable with external AI
- [ ] User can customize prompt complexity and focus areas
- [ ] Export functionality works (copy, download, share)
- [ ] Error states provide helpful guidance for document issues
- [ ] Processing performance is acceptable (under 2 minutes for typical papers)

### Test Scenarios

1. **Happy Path**: Upload research paper → successful analysis → concept extraction → system prompt generation → export
2. **Document Issues**: Corrupted files, unsupported formats, text extraction failures, very large files
3. **AI Processing**: API failures, incomplete extractions, low-confidence results, timeout scenarios
4. **User Journey**: Navigation flow, back/forward functionality, state persistence, mobile experience
5. **Content Quality**: Generated prompts are coherent, actionable, and faithful to source research

### Test Documents

**Prepare sample research papers for each persona:**

- **Creator**: Visual design research, content strategy papers, creative process studies
- **Educator**: Learning theory research, educational technology papers, pedagogical studies
- **Researcher**: Methodology papers, analytical frameworks, systematic review articles

---

## 📊 SUCCESS METRICS

### Key Performance Indicators (KPIs)

1. **Research Processing Quality**

   - Document processing success rate (target: >95%)
   - Concept extraction accuracy (validated through user feedback)
   - System prompt usability score (user ratings)
   - Time from upload to usable prompt (target: <3 minutes)

2. **User Engagement**

   - Upload to completion rate (target: >80%)
   - Return user rate for additional research processing
   - System prompt export/usage rate
   - User satisfaction with generated prompts

3. **Technical Performance**
   - Document upload and processing reliability
   - AI API response times and success rates
   - Error rate for different document types and sizes
   - System availability and uptime

### Analytics to Track

- Document upload patterns (file types, sizes, success rates)
- Most popular persona/content type combinations
- Processing time distributions by document characteristics
- User feedback on prompt quality and usefulness
- Export format preferences and usage patterns
- Drop-off points in the research processing pipeline

---

## 🚫 EXPLICITLY OUT OF SCOPE (For MVP)

### Do NOT Build These (Yet)

- User authentication/accounts
- Document storage/library (beyond temporary processing)
- Advanced document formats (beyond PDF, DOCX, TXT)
- Real-time collaboration on prompts
- Payment/subscription system
- Advanced analytics dashboard
- Mobile app
- API for third-party integrations
- Multi-language document support
- Advanced AI model fine-tuning
- Batch document processing
- Document comparison features

### Complexity to Avoid

- Complex document storage systems
- Advanced caching strategies (beyond basic file processing)
- Real-time features or WebSocket connections
- Microservices architecture
- Advanced security beyond basic API protection
- Complex state management (Redux, Zustand) - use React state
- Advanced document parsing beyond basic text extraction
- Complex AI workflows or multi-step reasoning chains

---

## 🎯 ACCEPTANCE CRITERIA

### MVP is Complete When:

1. **Document Processing Pipeline Works**: Users can upload research documents and get successful text extraction and analysis
2. **Research Analysis Functional**: System accurately extracts principles, methods, frameworks, and theories from research documents
3. **System Prompt Generation**: AI generates practical, usable system prompts that effectively capture research insights
4. **Full User Journey**: Complete flow from upload → analysis → concept selection → prompt generation → export
5. **Quality Validation**: Generated system prompts are immediately usable with external AI tools and produce valuable results
6. **Error Handling**: Graceful handling of document processing failures, unsupported formats, and API issues
7. **Performance Standards**: Document processing completes within acceptable timeframes (under 3 minutes for typical papers)
8. **Production Deployed**: Live URL accessible to users with reliable uptime

### Definition of Done for Each Feature:

- [ ] Functionality works as specified with research documents
- [ ] Document upload and processing pipeline is robust
- [ ] AI analysis produces accurate and useful concept extraction
- [ ] Generated system prompts are coherent and actionable
- [ ] Error states handled for document and processing issues
- [ ] Loading states and progress indicators implemented
- [ ] Manual testing completed with sample research documents
- [ ] No console errors or processing failures
- [ ] Responsive design works across devices
- [ ] Export functionality tested with external AI tools

---

## 🔧 DEVELOPMENT GUIDELINES

### Code Quality Standards

- Use TypeScript strictly (no `any` types)
- Follow Next.js 14+ conventions
- Use Tailwind utility classes, minimal custom CSS
- Component names in PascalCase
- File names in kebab-case
- Functions and variables in camelCase

### Git Workflow

- Main branch always deployable
- Feature branches for new functionality
- Descriptive commit messages
- Small, focused commits

### Environment Variables

```
OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📞 DECISION MAKING FRAMEWORK

### When Building, Ask:

1. **Does this help users create better prompts faster?**
2. **Is this the simplest solution that works?**
3. **Can this be implemented without external dependencies?**
4. **Will users immediately understand how to use this?**

### Default Choices:

- **Choose simple over clever**
- **Choose working over perfect**
- **Choose user-focused over developer-focused**
- **Choose shipping over planning**

---

## 🎯 FINAL NOTES FOR AI ASSISTANTS

### When Working on This Project:

1. **Reference this document first** - Don't ask "what should we do next?"
2. **Follow the phases** - Build Phase 1 completely before moving to Phase 2
3. **Implement features as specified** - Don't add extra complexity
4. **Focus on the user flow** - Every decision should make the user journey smoother
5. **Test as you build** - Verify each feature works before moving on

### Red Flags (Stop and Reconsider):

- Adding features not in this PRD
- Using complex libraries or frameworks
- Building authentication before core functionality works
- Adding database before MVP is complete
- Over-engineering any component

### Success Pattern:

1. Read this PRD thoroughly
2. Implement exactly what's specified
3. Test that it works
4. Move to next item
5. Don't deviate without updating this PRD first

---

**This document is the single source of truth. When in doubt, refer back here. Focus on building what users need, not what's technically interesting.**
