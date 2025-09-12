'use client';

import { useState, useEffect } from 'react';
import { cln, formatFileSize, getFileTypeCategory } from '../utils';
import Button from './Button';

interface FilePreviewProps {
  fileId: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

export default function FilePreview({
  fileId,
  fileName,
  fileSize,
  contentType,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileCategory = getFileTypeCategory(fileName);
  const isImage = fileCategory === 'image';
  const isPDF = fileName.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (!isOpen || !isImage) return;

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5001/api/file/download/${fileId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
        } else {
          setError('Failed to load image');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, isImage, fileId]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getFileIcon = () => {
    if (isImage) return '🖼️';
    if (isPDF) return '📄';
    return '📄';
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="relative max-w-6xl max-h-[90vh] w-full bg-surface-elevated rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{getFileIcon()}</span>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground truncate">{fileName}</h3>
              <p className="text-sm text-muted">{formatFileSize(fileSize)} • {contentType}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onDownload}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {isImage ? (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
              {isLoading ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted">Loading image...</p>
                </div>
              ) : error ? (
                <div className="text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <h3 className="text-lg font-medium mb-2">Failed to load image</h3>
                  <p className="text-muted mb-4">{error}</p>
                  <Button variant="primary" onClick={onDownload}>
                    Download file instead
                  </Button>
                </div>
              ) : imageUrl ? (
                <div className="max-w-full max-h-[70vh] overflow-auto">
                  <img
                    src={imageUrl}
                    alt={fileName}
                    className="max-w-full h-auto rounded-lg shadow-lg cursor-zoom-in"
                    style={{ objectFit: 'contain' }}
                    onClick={() => {
                      // Simple zoom toggle - in production you'd want proper zoom/pan functionality
                      const img = document.querySelector('.zoom-image') as HTMLImageElement;
                      if (img) {
                        img.classList.toggle('scale-150');
                      }
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : isPDF ? (
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">PDF Document</h3>
              <p className="text-muted mb-6">
                PDF files cannot be previewed in the browser. Click download to view the document.
              </p>
              <Button variant="primary" onClick={onDownload}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Download PDF
              </Button>
            </div>
          ) : (
            <div className="p-6 text-center">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium mb-2">Document File</h3>
              <p className="text-muted mb-6">
                This file type cannot be previewed. Click download to view the document.
              </p>
              <Button variant="primary" onClick={onDownload}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Download File
              </Button>
            </div>
          )}
        </div>

        {/* Footer with file info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-muted">
          <div className="flex items-center justify-between">
            <span>File ID: {fileId}</span>
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}