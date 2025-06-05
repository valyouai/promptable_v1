# PDF Processing Documentation

## Overview

This application uses `pdf2json` for PDF text extraction. This library was chosen because:

- It's a pure Node.js implementation (no browser dependencies)
- Works seamlessly in Next.js server-side rendering (SSR)
- Doesn't require web workers or external files
- Has a simple, event-based API

## Current Implementation

### Library: pdf2json v3.1.6

- Location: `lib/document-processor.ts`
- Function: `extractTextFromPdf()`

### How It Works

1. Receives a File object from the upload
2. Converts to Buffer (required by pdf2json)
3. Uses event-based parsing with callbacks
4. Extracts text from all pages
5. Returns concatenated text

## Common Issues & Solutions

### Issue: "Cannot find module" errors

**Cause**: Using browser-specific PDF libraries in SSR
**Solution**: Use pdf2json which is Node.js compatible

### Issue: Worker-related errors

**Cause**: Libraries like pdfjs-dist require web workers
**Solution**: pdf2json doesn't use workers

### Issue: ENOENT errors with test files

**Cause**: Some npm packages contain test code
**Solution**: Use production-ready packages like pdf2json

## Testing PDF Upload

1. Start the dev server: `npm run dev`
2. Navigate to `/creator` or any content type page
3. Upload a PDF file
4. Check console for processing logs
5. Verify extracted text appears

## Debugging Tips

Enable verbose logging by checking console output for:

- `[processDocument]` - File type detection
- `[extractTextFromPdf]` - PDF processing steps
- `[UPLOAD_API]` - Upload handling

## Alternative Libraries (Not Recommended)

We previously tried these libraries but encountered issues:

- **pdf-parse**: Contains hardcoded test file paths
- **pdfjs-dist**: Requires web workers, complex SSR setup
- **@react-pdf/renderer**: For generating PDFs, not parsing

## Maintenance Notes

- Always test PDF uploads after dependency updates
- Run `npm run build` to catch SSR compatibility issues early
- Keep pdf2json updated for security patches
