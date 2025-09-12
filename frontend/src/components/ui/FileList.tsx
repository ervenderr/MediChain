'use client';

import { useState } from 'react';
import { formatFileSize, getFileTypeCategory, cln } from '../utils';
import Button from './Button';
import FilePreview from './FilePreview';

interface FileAttachment {
  fileID: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

interface FileListProps {
  files: FileAttachment[];
  onDownload: (fileId: string, fileName: string) => void;
  className?: string;
  showPreview?: boolean;
  compact?: boolean;
}

export default function FileList({ 
  files, 
  onDownload, 
  className, 
  showPreview = true,
  compact = false 
}: FileListProps) {
  const [previewFile, setPreviewFile] = useState<FileAttachment | null>(null);

  if (!files || files.length === 0) return null;

  const getFileIcon = (fileName: string) => {
    const category = getFileTypeCategory(fileName);
    if (category === 'image') return '🖼️';
    if (fileName.toLowerCase().endsWith('.pdf')) return '📄';
    return '📄';
  };

  const getFileTypeColor = (fileName: string) => {
    const category = getFileTypeCategory(fileName);
    switch (category) {
      case 'image':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'document':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const canPreview = (fileName: string) => {
    const category = getFileTypeCategory(fileName);
    return category === 'image'; // Only images can be previewed for now
  };

  const handleFileClick = (file: FileAttachment) => {
    if (showPreview && canPreview(file.originalFileName)) {
      setPreviewFile(file);
    } else {
      onDownload(file.fileID, file.originalFileName);
    }
  };

  const handleDownload = (file: FileAttachment) => {
    onDownload(file.fileID, file.originalFileName);
  };

  if (compact) {
    return (
      <>
        <div className={cln('flex flex-wrap gap-2', className)}>
          {files.map((file) => (
            <button
              key={file.fileID}
              onClick={() => handleFileClick(file)}
              className={cln(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200 border',
                'hover:shadow-sm active:scale-95',
                getFileTypeColor(file.originalFileName)
              )}
            >
              <span>{getFileIcon(file.originalFileName)}</span>
              <span className="truncate max-w-[120px]">{file.originalFileName}</span>
              <span className="text-muted">({formatFileSize(file.fileSize)})</span>
              {showPreview && canPreview(file.originalFileName) && (
                <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          ))}
        </div>
        
        {previewFile && (
          <FilePreview
            fileId={previewFile.fileID}
            fileName={previewFile.originalFileName}
            fileSize={previewFile.fileSize}
            contentType={previewFile.contentType}
            isOpen={true}
            onClose={() => setPreviewFile(null)}
            onDownload={() => handleDownload(previewFile)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={cln('space-y-3', className)}>
        {files.map((file) => (
          <div
            key={file.fileID}
            className="bg-surface-elevated border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="text-2xl">{getFileIcon(file.originalFileName)}</div>
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground truncate">{file.originalFileName}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted mt-1">
                    <span>{formatFileSize(file.fileSize)}</span>
                    <span>•</span>
                    <span>{file.contentType}</span>
                    {file.uploadedAt && (
                      <>
                        <span>•</span>
                        <span>Uploaded {new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {showPreview && canPreview(file.originalFileName) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewFile(file)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Preview
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(file)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Download
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {previewFile && (
        <FilePreview
          fileId={previewFile.fileID}
          fileName={previewFile.originalFileName}
          fileSize={previewFile.fileSize}
          contentType={previewFile.contentType}
          isOpen={true}
          onClose={() => setPreviewFile(null)}
          onDownload={() => handleDownload(previewFile)}
        />
      )}
    </>
  );
}