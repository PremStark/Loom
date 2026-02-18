import {useEffect, useRef, useState} from 'react'
import type {ChangeEvent, DragEvent} from "react";
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS} from "../lib/constants";

type UploadProps = {
    onComplete?: (base64Data: string) => void;
}

const Upload = ({ onComplete = () => undefined }: UploadProps) => {

    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { isSignedIn } = useOutletContext<AuthContext>();

    const processFile = (selectedFile: File) => {
        if (!isSignedIn) return;

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        if (completeTimeoutRef.current) {
            clearTimeout(completeTimeoutRef.current);
            completeTimeoutRef.current = null;
        }

        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();

        reader.onerror = () => {
            console.error('Failed to read file:', reader.error);
            setFile(null);
            setProgress(0);
            // Consider: setError('Failed to read file. Please try again.');
        }

        reader.onload = () => {
            const base64Data = typeof reader.result === "string" ? reader.result : "";
            if (!base64Data) return;

            progressIntervalRef.current = setInterval(() => {
                setProgress((current) => {
                    const next = Math.min(current + PROGRESS_STEP, 100);

                    if (next === 100 && progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = null;
                        if (completeTimeoutRef.current) {
                            clearTimeout(completeTimeoutRef.current);
                            completeTimeoutRef.current = null;
                        }

                        completeTimeoutRef.current = setTimeout(() => {
                            onComplete(base64Data);
                            completeTimeoutRef.current = null;
                        }, REDIRECT_DELAY_MS);
                    }

                    return next;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(selectedFile);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;
        event.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;
        event.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        if (!isSignedIn) return;
        event.preventDefault();
        setIsDragging(false);

        const droppedFile = event.dataTransfer.files[0];
        const allowedTypes = ["image/png", "image/jpeg"];
        if(droppedFile && allowedTypes.includes(droppedFile.type)) {
            processFile(droppedFile);
        } else if (droppedFile) {
            // Consider: show error toast or set error state
            console.warn('Unsupported file type:', droppedFile.type);
        }
    };

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFiles = event.target.files;
        if (!selectedFiles?.length) return;

        const selectedFile = selectedFiles[0];
        const allowedTypes = ["image/png", "image/jpeg"];
        if (allowedTypes.includes(selectedFile.type)) {
                    processFile(selectedFile);
        }
    };

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
            if (completeTimeoutRef.current) {
                clearTimeout(completeTimeoutRef.current);
                completeTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!isSignedIn) {
            setIsDragging(false);
        }
    }, [isSignedIn]);

    return (
        <div className="upload">
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.png,.jpeg"
                        disabled={!isSignedIn}
                        onChange={handleFileChange}
                    />

                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={25} />
                        </div>
                        <p>
                            {isSignedIn ? (
                                "Click to upload or just drag and drop"
                            ) : ("Sign in or Sign up with Puter to upload")}
                        </p>
                        <p className="help">Maximum file size 50 MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress === 100 ? (
                                <CheckCircle2 className="check" />
                            ) : (
                                <ImageIcon className="image" />
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className='progress'>
                            <div className="bar" style={{width:`${progress}%`}} />

                            <p className="status-text">
                                {progress < 100 ? 'Analyzing Floor Plan...' : 'Redirecting...'}
                            </p>

                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Upload
