"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppLayout from "../../../components/layout/AppLayout";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import FileList from "../../../components/ui/FileList";
import GlobalSearch from "../../../components/search/GlobalSearch";
import SearchResults from "../../../components/search/SearchResults";
import {
  formatDate,
  debounce,
} from "../../../components/utils";
import { getApiUrl, API_CONFIG } from "../../../lib/constants";

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

interface CategoryCount {
  category: string;
  count: number;
}

interface Stats {
  totalRecords: number;
  categoryCounts: CategoryCount[];
  recentRecords: number;
}

export default function HealthRecords() {
  const router = useRouter();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [searchResults, setSearchResults] = useState<Array<HealthRecord & { id: string; matchedFields: string[]; relevanceScore: number }>>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchFilters, setSearchFilters] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchRecords();
    fetchStats();
  }, [router]);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS_STATS),
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this health record?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS)}/${recordId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setRecords(records.filter((r) => r.recordID !== recordId));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const downloadFile = async (fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${getApiUrl(API_CONFIG.ENDPOINTS.FILE_DOWNLOAD)}/${fileId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };


  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      allergy: "⚠️",
      medication: "💊",
      condition: "🩺",
      lab_result: "🔬",
      vaccination: "💉",
      procedure: "🏥",
      appointment: "📅",
    };
    return icons[category] || "📋";
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      allergy: "bg-red-50 text-red-700 border-red-200",
      medication: "bg-blue-50 text-blue-700 border-blue-200",
      condition: "bg-orange-50 text-orange-700 border-orange-200",
      lab_result: "bg-green-50 text-green-700 border-green-200",
      vaccination: "bg-purple-50 text-purple-700 border-purple-200",
      procedure: "bg-indigo-50 text-indigo-700 border-indigo-200",
      appointment: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[category] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  // Enhanced filtering and sorting
  const filteredAndSortedRecords = records
    .filter((record) => {
      const matchesCategory =
        selectedCategory === "all" || record.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });


  // Handle search results
  const handleSearchResults = (results: unknown[], filters: unknown) => {
    const typedResults = results as Array<HealthRecord & { matchedFields: string[]; relevanceScore: number }>;
    const mappedResults = typedResults.map(result => ({
      ...result,
      id: result.recordID
    }));
    setSearchResults(mappedResults);
    setSearchFilters(filters as Record<string, unknown>);
    const f = filters as Record<string, unknown>;
    setIsSearchActive(
      Boolean(
        (f.query as string)?.trim() !== "" ||
        f.category !== "all" ||
        f.dateFrom ||
        f.dateTo ||
        f.hasFiles !== null
      )
    );
  };

  // Handle filters change
  const handleFiltersChange = (filters: unknown) => {
    setSearchFilters(filters as Record<string, unknown>);
  };


  if (loading) {
    return (
      <AppLayout>
        <div className="space-mobile">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-3 skeleton"></div>
            <div className="h-5 bg-gray-200 rounded w-96 skeleton"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-6 border border-gray-200"
              >
                <div className="h-8 bg-gray-200 rounded w-12 mb-2 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-20 skeleton"></div>
              </div>
            ))}
          </div>

          {/* Records Skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-6 border border-gray-200"
              >
                <div className="h-6 bg-gray-200 rounded w-48 mb-3 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="bg-surface-elevated border-b border-gray-200 ">
        <div className="space-mobile max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  as={Link}
                  href="/dashboard"
                  variant="ghost"
                  size="sm"
                  className="lg:hidden -ml-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </Button>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">
                  Health Records
                </h1>
              </div>
              <p className="text-sm text-muted">
                Manage your medical information securely
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                as={Link}
                href="/dashboard/records/new"
                variant="primary"
                size="sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="space-mobile max-w-7xl mx-auto p-4 lg:p-6">
        {/* Stats Cards */}
        {stats && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">
                      {stats.totalRecords}
                    </div>
                    <div className="text-sm text-muted font-medium">
                      Total Records
                    </div>
                  </div>
                  <div className="text-2xl opacity-60">📋</div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-secondary mb-1">
                      {stats.recentRecords}
                    </div>
                    <div className="text-sm text-muted font-medium">
                      Recent (30d)
                    </div>
                  </div>
                  <div className="text-2xl opacity-60">📅</div>
                </div>
              </Card>

              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-accent mb-1">
                      {stats.categoryCounts.length}
                    </div>
                    <div className="text-sm text-muted font-medium">
                      Categories
                    </div>
                  </div>
                  <div className="text-2xl opacity-60">🏷️</div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Enhanced Search */}
        <div className="mb-6">
          <GlobalSearch
            onResults={handleSearchResults}
            onFiltersChange={handleFiltersChange}
            placeholder="Search health records by title, content, category, or file names..."
            showAdvancedFilters={false}
          />
        </div>

        {/* Conditional Content: Search Results or Regular Records */}
        {isSearchActive ? (
          <SearchResults
            results={searchResults}
            query={(searchFilters.query as string) || ""}
            isLoading={loading}
          />
        ) : /* Regular Records View */
        filteredAndSortedRecords.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium mb-2">No health records yet</h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first health record - medications, allergies,
              conditions, or lab results.
            </p>
            <Link
              href="/dashboard/records/new"
              className="bg-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
            >
              Add First Record
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedRecords.map((record) => (
              <div
                key={record.recordID}
                className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">
                    {getCategoryIcon(record.category)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate pr-2">
                          {record.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                              record.category
                            )}`}
                          >
                            {record.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/dashboard/records/${record.recordID}/edit`}
                          className="p-2 text-gray-600 hover:text-cyan-600 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setShowDeleteConfirm(record.recordID)}
                          className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {record.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      {record.dateRecorded && (
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Recorded: {formatDate(record.dateRecorded)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Added: {formatDate(record.createdAt)}
                      </span>
                    </div>

                    {/* File Attachments */}
                    {record.files && record.files.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <svg
                            className="w-4 h-4 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          <span className="text-sm font-medium text-gray-500">
                            {record.files.length} attachment
                            {record.files.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <FileList
                          files={record.files.map((file) => ({
                            fileID: file.fileID,
                            originalFileName: file.originalFileName,
                            contentType: file.contentType,
                            fileSize: file.fileSize,
                            uploadedAt: file.uploadedAt,
                          }))}
                          onDownload={downloadFile}
                          compact={true}
                          showPreview={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card padding="lg" className="max-w-md w-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🗑️</div>
                <h3 className="text-lg font-semibold mb-2">
                  Delete Health Record?
                </h3>
                <p className="text-muted mb-6">
                  This action cannot be undone. The record and all its
                  attachments will be permanently deleted.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    variant="secondary"
                    onClick={() => setShowDeleteConfirm(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      handleDelete(showDeleteConfirm);
                      setShowDeleteConfirm(null);
                    }}
                  >
                    Delete Record
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
