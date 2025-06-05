"use client";
import React, { useState } from 'react';
import { useParams } from 'next/navigation';
export default function GenerationPage() {
    const params = useParams();
    const persona = params.persona;
    const contentType = params.contentType;
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState('');
    const [extractedText, setExtractedText] = useState('');
    const [analysisResult, setAnalysisResult] = useState(null);
    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (allowedTypes.includes(file.type)) {
                setSelectedFile(file);
                setUploadStatus('');
                setExtractedText('');
                setAnalysisResult(null);
            }
            else {
                setSelectedFile(null);
                setUploadStatus('Unsupported file type. Please upload PDF, TXT, or DOCX.');
                setExtractedText('');
                setAnalysisResult(null);
            }
        }
    };
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setUploadStatus('Please select a file first.');
            return;
        }
        setUploadStatus('Uploading and analyzing...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            const response = await fetch('/api/upload-document', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                setUploadStatus('Analysis successful!');
                setExtractedText(data.extractedText);
                setAnalysisResult(data.analysisResult);
            }
            else {
                setUploadStatus(`Analysis failed: ${data.error}`);
                setExtractedText('');
                setAnalysisResult(null);
            }
        }
        catch (error) {
            console.error('Error uploading file:', error);
            setUploadStatus('An error occurred during analysis.');
            setExtractedText('');
            setAnalysisResult(null);
        }
    };
    return (<div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
        Generate Prompt for {persona.charAt(0).toUpperCase() + persona.slice(1)} - {contentType.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      </h1>

      <section className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold text-gray-800 text-center mb-8">Upload Your Document</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Drag and drop your files here, or click to select</p>
          <input type="file" className="hidden" id="file-upload" onChange={handleFileChange}/>
          <label htmlFor="file-upload" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
            Browse Files
          </label>
          {selectedFile && (<p className="mt-4 text-md text-gray-700">Selected file: <span className="font-semibold">{selectedFile.name}</span></p>)}
          <p className="mt-4 text-sm text-gray-500">Supported formats: PDF, TXT, DOCX</p>
          <button onClick={handleFileUpload} disabled={!selectedFile} className="mt-6 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Upload and Analyze
          </button>
          {uploadStatus && (<p className="mt-4 text-md font-medium text-gray-800">{uploadStatus}</p>)}
          {extractedText && (<div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Extracted Text (Preview):</h3>
              <p className="text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto">{extractedText.substring(0, 1000)}...</p>
            </div>)}
          {analysisResult && (<div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-left">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Extracted Concepts:</h3>
              {analysisResult.principles.length > 0 && (<div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Principles:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.principles.map((p, i) => <li key={i}>{p}</li>)}
                  </ul>
                </div>)}
              {analysisResult.methods.length > 0 && (<div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Methods:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.methods.map((m, i) => <li key={i}>{m}</li>)}
                  </ul>
                </div>)}
              {analysisResult.frameworks.length > 0 && (<div className="mb-2">
                  <h4 className="font-semibold text-gray-700">Frameworks:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.frameworks.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>)}
              {analysisResult.theories.length > 0 && (<div>
                  <h4 className="font-semibold text-gray-700">Theories:</h4>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysisResult.theories.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>)}
              {(analysisResult.principles.length === 0 &&
                analysisResult.methods.length === 0 &&
                analysisResult.frameworks.length === 0 &&
                analysisResult.theories.length === 0) && (<p className="text-gray-600">No specific concepts, methods, frameworks, or theories were extracted.</p>)}
            </div>)}
        </div>
      </section>
    </div>);
}
