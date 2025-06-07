import React, { useState } from 'react';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Uploader() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const pathname = usePathname();

    // Determine persona from route
    const extractPersonaFromPath = (): 'creator' | 'researcher' | 'educator' => {
        if (pathname.startsWith('/creator')) return 'creator';
        if (pathname.startsWith('/researcher')) return 'researcher';
        if (pathname.startsWith('/educator')) return 'educator';
        return 'creator'; // fallback safety
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const persona = extractPersonaFromPath(); // determine persona dynamically
        await axios.post(`/api/upload-document?persona=${persona}`, formData);

        setUploading(false);
        alert('Upload complete!');
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} aria-label="File Uploader" />
            <button onClick={handleUpload} disabled={uploading || !file}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
        </div>
    );
} 