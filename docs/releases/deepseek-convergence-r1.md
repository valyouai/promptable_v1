# DeepSeek Convergence R1 — SAFE MERGE POINT 1.0

## Summary

This release fully migrates the Promptable multi-agent extraction kernel to the DeepSeek R1 model stack.

✅ Full backend extraction pipeline operational
✅ PDF and DOCX file parsing stabilized via microservice
✅ ExtractionOrchestrator fully DeepSeek-powered
✅ Persona transformer (transformInsights) migrated to DeepSeekAdapter
✅ JSON schema compliance enforced via response_format
✅ Upstream agents (ExtractorAgent) refactored for strict param objects
✅ UI fully synchronized to orchestrator pipeline
✅ Multi-agent kernel: ambiguity scoring, reinforcement, QA validation live

## Technical Notes

- DeepSeek R1 adapter implemented in `/src/server/adapters/DeepSeekAdapter.ts`
- All model calls routed through unified DeepSeek API endpoints
- No more OpenAI quota dependencies
- Fully modular for future agent expansion

## Tag

- `v1.0-deepseek-convergence`
