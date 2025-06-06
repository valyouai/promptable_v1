from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import pdfplumber
import tempfile
import os

app = FastAPI()

# Allow CORS (optional)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/extract-pdf-text")
async def extract_pdf_text(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.filename.lower().endswith(".pdf"):
            return JSONResponse(status_code=400, content={"error": "Uploaded file is not a PDF."})

        # Save uploaded file to a temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        # Extract text using pdfplumber
        full_text = ""
        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text(x_tolerance=1.5, y_tolerance=1.5)
                if page_text:
                    full_text += page_text + "\n"

        os.unlink(tmp_path)

        if not full_text.strip():
            return JSONResponse(status_code=422, content={"error": "No extractable text found in PDF."})

        return {"text": full_text.strip()}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=7000, reload=True) 