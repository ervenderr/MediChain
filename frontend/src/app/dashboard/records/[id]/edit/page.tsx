"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface HealthRecordFile {
  fileID: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
}

interface HealthRecord {
  recordID: string;
  title: string;
  category: string;
  content: string;
  dateRecorded?: string;
  attachments?: string;
  createdAt: string;
  files: HealthRecordFile[];
}

interface UploadedFile {
  file: File;
  id: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export default function EditHealthRecord() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;
  
  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const categories = [
    {
      value: "allergy",
      label: "⚠️ Allergy",
      description: "Food, drug, or environmental allergies",
    },
    {
      value: "medication",
      label: "💊 Medication",
      description: "Current or past medications",
    },
    {
      value: "condition",
      label: "🏥 Medical Condition",
      description: "Chronic conditions, diagnoses",
    },
    {
      value: "lab_result",
      label: "🧪 Lab Result",
      description: "Blood tests, imaging, etc.",
    },
    {
      value: "vaccination",
      label: "💉 Vaccination",
      description: "Immunizations and shots",
    },
    {
      value: "procedure",
      label: "🔬 Procedure",
      description: "Surgeries, treatments",
    },
    {
      value: "appointment",
      label: "📅 Appointment",
      description: "Doctor visits, checkups",
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchRecord();
  }, [recordId, router]);

  const fetchRecord = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/healthrecords/${recordId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecord(data);
      } else {
        setError("Record not found");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (record) {
      setRecord({
        ...record,
        [e.target.name]: e.target.value,
      });
    }
  };

  const handleCategoryChange = (category: string) => {
    if (record) {
      setRecord({
        ...record,
        category,
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files).map((file) => ({
        file,
        id: Math.random().toString(36).substr(2, 9),
        uploading: false,
        uploaded: false,
      }));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const deleteExistingFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/file/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok && record) {
        setRecord({
          ...record,
          files: record.files.filter(f => f.fileID !== fileId)
        });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const uploadFile = async (uploadFile: UploadedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, uploading: true } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/file/upload/${recordId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, uploading: false, uploaded: true } : f
        ));
        // Refresh record to show new file
        fetchRecord();
      } else {
        const errorData = await response.json();
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            uploading: false, 
            error: errorData.message || 'Upload failed' 
          } : f
        ));
      }
    } catch (err) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          uploading: false, 
          error: 'Network error' 
        } : f
      ));
    }
  };

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter(f => !f.uploaded && !f.uploading);
    for (const file of filesToUpload) {
      await uploadFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setSaving(true);
    setError("");

    if (!record.title || !record.category || !record.content) {
      setError("Please fill in all required fields");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/healthrecords/${recordId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: record.title,
          category: record.category,
          content: record.content,
          dateRecorded: record.dateRecorded || null,
        }),
      });

      if (response.ok) {
        // Upload new files if any
        if (files.length > 0) {
          try {
            await uploadAllFiles();
          } catch (error) {
            console.log('File upload not available yet, but record updated successfully');
          }
        }
        
        router.push("/dashboard/records");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to update health record");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/file/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading health record...</p>
        </div>
      </div>
    );
  }

  if (error && !record) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/records"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Health Records
          </Link>
        </div>
      </div>
    );
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/records"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
          >
            ← Back to Health Records
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Health Record</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={record.title}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief title for this health record"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Category *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      record.category === cat.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{cat.label}</div>
                    <div className="text-xs text-gray-600 mt-1">{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Recorded */}
            <div>
              <label htmlFor="dateRecorded" className="block text-sm font-medium text-gray-700 mb-2">
                Date Recorded
              </label>
              <input
                type="date"
                id="dateRecorded"
                name="dateRecorded"
                value={record.dateRecorded ? record.dateRecorded.split('T')[0] : ''}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Details *
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                value={record.content}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed information about this health record..."
              />
            </div>

            {/* Existing Files */}
            {record.files && record.files.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Attachments
                </label>
                <div className="space-y-2">
                  {record.files.map((file) => (
                    <div key={file.fileID} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.contentType.startsWith('image/') ? (
                            <span className="text-green-500">🖼️</span>
                          ) : file.contentType === 'application/pdf' ? (
                            <span className="text-red-500">📄</span>
                          ) : (
                            <span className="text-blue-500">📄</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalFileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.fileSize / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => downloadFile(file.fileID, file.originalFileName)}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExistingFile(file.fileID)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Attachments
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-blue-600 hover:text-blue-500 font-medium">
                        Click to upload files
                      </span>
                      <span className="text-gray-600"> or drag and drop</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.txt"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF, PDF, TXT up to 10MB each
                  </p>
                </div>
              </div>

              {/* New File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {file.file.type.startsWith('image/') ? (
                            <span className="text-green-500">🖼️</span>
                          ) : file.file.type === 'application/pdf' ? (
                            <span className="text-red-500">📄</span>
                          ) : (
                            <span className="text-blue-500">📄</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.uploading && (
                          <div className="text-blue-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          </div>
                        )}
                        {file.uploaded && (
                          <span className="text-green-500 text-sm">✓ Uploaded</span>
                        )}
                        {file.error && (
                          <span className="text-red-500 text-xs">{file.error}</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/records"
                className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving..." : "Update Health Record"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}