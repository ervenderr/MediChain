"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiUrl, API_CONFIG } from "@/lib/constants";

interface HealthRecordForm {
  title: string;
  category: string;
  content: string;
  dateRecorded: string;
}

interface UploadedFile {
  file: File;
  id: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export default function NewHealthRecord() {
  const router = useRouter();
  const [formData, setFormData] = useState<HealthRecordForm>({
    title: "",
    category: "",
    content: "",
    dateRecorded: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>("");

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
      label: "🔬 Medical Procedure",
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
    const name = localStorage.getItem("patientName");
    if (!token) {
      router.push("/login");
    } else {
      setPatientName(name || "Patient");
    }
  }, [router]);

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

  const uploadFile = async (uploadFile: UploadedFile, recordId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, uploading: true } : f
    ));

    try {
      const formData = new FormData();
      formData.append('file', uploadFile.file);

      const token = localStorage.getItem("token");
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.FILE_UPLOAD)}/${recordId}`, {
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

  const uploadAllFiles = async (recordId: string) => {
    const filesToUpload = files.filter(f => !f.uploaded && !f.uploading);
    for (const file of filesToUpload) {
      await uploadFile(file, recordId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.title || !formData.category || !formData.content) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          content: formData.content,
          dateRecorded: formData.dateRecorded || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCreatedRecordId(result.recordID);
        
        // Upload files if any (skip if upload feature not ready)
        if (files.length > 0) {
          try {
            await uploadAllFiles(result.recordID);
          } catch (error) {
            console.log('File upload not available yet, but record saved successfully');
          }
        }
        
        router.push("/dashboard/records");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create health record");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("patientId");
    localStorage.removeItem("patientName");
    router.push("/");
  };

  const getTemplateContent = (category: string) => {
    const templates: { [key: string]: string } = {
      allergy:
        "Allergic reaction to: [substance]\nSeverity: [mild/moderate/severe]\nSymptoms: [symptoms]\nTreatment: [treatment if any]",
      medication:
        "Medication: [name]\nDosage: [amount and frequency]\nPrescribed by: [doctor name]\nPurpose: [reason for medication]\nStart date: [date]\nNotes: [any side effects or instructions]",
      condition:
        "Condition: [diagnosis name]\nDiagnosed by: [doctor name]\nDate diagnosed: [date]\nSeverity: [mild/moderate/severe]\nSymptoms: [current symptoms]\nTreatment: [current treatment plan]",
      lab_result:
        "Test type: [blood work, X-ray, MRI, etc.]\nOrdered by: [doctor name]\nResults: [key findings]\nNormal ranges: [reference values]\nRecommendations: [follow-up actions]",
      vaccination:
        "Vaccine: [vaccine name]\nDate given: [date]\nLocation: [clinic/hospital]\nLot number: [if available]\nNext dose due: [if applicable]",
      procedure:
        "Procedure: [procedure name]\nDate: [date performed]\nPerformed by: [doctor/hospital]\nReason: [why it was done]\nOutcome: [results]\nRecovery notes: [post-procedure care]",
      appointment:
        "Appointment with: [doctor name]\nSpecialty: [cardiologist, GP, etc.]\nReason: [purpose of visit]\nKey points discussed: [main topics]\nNext steps: [follow-up plans]",
    };
    return templates[category] || "";
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      content: formData.content || getTemplateContent(category),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 text-xl font-bold text-blue-600"
              >
                <img 
                  src="/medichain.svg" 
                  alt="MediChain" 
                  className="w-8 h-8"
                />
                MediChain
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/records"
                className="text-gray-600 hover:text-gray-900"
              >
                Health Records
              </Link>
              <span className="text-blue-600 font-medium">Add New Record</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {patientName}!
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Add Health Record
          </h2>
          <p className="text-gray-600">
            Add a new medical record to your digital health wallet
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
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
                      formData.category === cat.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium text-sm">{cat.label}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {cat.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Recorded */}
            <div>
              <label
                htmlFor="dateRecorded"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date of Record (Optional)
              </label>
              <input
                type="date"
                id="dateRecorded"
                name="dateRecorded"
                value={formData.dateRecorded}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                When did this health event occur? Leave blank if not applicable.
              </p>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Details *
              </label>
              <textarea
                id="content"
                name="content"
                required
                rows={8}
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed information about this health record..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide as much detail as possible. This information may be
                critical in emergency situations.
              </p>
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Attachments
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

              {/* File List */}
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
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Save Health Record"}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">
                Tips for Better Health Records
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  • Include specific dates, dosages, and doctor names when
                  available
                </li>
                <li>
                  • For allergies, note the severity and any treatments used
                </li>
                <li>• Lab results should include normal ranges for context</li>
                <li>
                  • Keep medication records up-to-date with current
                  prescriptions
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
