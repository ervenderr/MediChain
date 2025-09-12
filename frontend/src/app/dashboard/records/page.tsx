'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/layout/AppLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FileList from '../../../components/ui/FileList';
import { formatDate, formatDateTime, formatFileSize, getFileTypeCategory, cln, truncateText, debounce } from '../../../components/utils';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchRecords();
    fetchStats();
  }, [router]);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/healthrecords', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/healthrecords/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this health record?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/healthrecords/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setRecords(records.filter(r => r.recordID !== recordId));
        fetchStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting record:', error);
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

  const clearAllRecords = async () => {
    if (!confirm('Are you sure you want to delete ALL your health records? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/healthrecords/clear-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setRecords([]);
        fetchStats(); // Refresh stats
        alert('All health records have been cleared');
      } else {
        alert('Error clearing records');
      }
    } catch (error) {
      console.error('Error clearing records:', error);
      alert('Network error');
    }
  };

  const enableFileUploads = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/migration/create-files-table', {
        method: 'POST',
      });

      if (response.ok) {
        alert('File upload feature enabled successfully! You can now upload files with your health records.');
      } else {
        alert('Error enabling file uploads');
      }
    } catch (error) {
      console.error('Error enabling file uploads:', error);
      alert('Network error');
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      allergy: '⚠️',
      medication: '💊',
      condition: '🩺',
      lab_result: '🔬',
      vaccination: '💉',
      procedure: '🏥',
      appointment: '📅',
    };
    return icons[category] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      allergy: 'bg-red-50 text-red-700 border-red-200',
      medication: 'bg-blue-50 text-blue-700 border-blue-200',
      condition: 'bg-orange-50 text-orange-700 border-orange-200',
      lab_result: 'bg-green-50 text-green-700 border-green-200',
      vaccination: 'bg-purple-50 text-purple-700 border-purple-200',
      procedure: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      appointment: 'bg-gray-50 text-gray-700 border-gray-200',
    };
    return colors[category] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Enhanced filtering and sorting
  const filteredAndSortedRecords = records
    .filter(record => {
      const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('patientId');
    localStorage.removeItem('patientName');
    router.push('/');
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
              <div key={i} className="bg-surface-elevated rounded-lg p-6 border border-gray-200">
                <div className="h-8 bg-gray-200 rounded w-12 mb-2 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-20 skeleton"></div>
              </div>
            ))}
          </div>
          
          {/* Records Skeleton */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-surface-elevated rounded-lg p-6 border border-gray-200">
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
      <header className="bg-surface-elevated border-b border-gray-200">
        <div className="space-mobile">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </Button>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground">Health Records</h1>
              </div>
              <p className="text-sm text-muted">Manage your medical information securely</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button as={Link} href="/dashboard/records/new" variant="primary" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="space-mobile">
        {/* Stats Cards */}
        {stats && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary mb-1">{stats.totalRecords}</div>
                    <div className="text-sm text-muted font-medium">Total Records</div>
                  </div>
                  <div className="text-2xl opacity-60">📋</div>
                </div>
              </Card>
              
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-secondary mb-1">{stats.recentRecords}</div>
                    <div className="text-sm text-muted font-medium">Recent (30d)</div>
                  </div>
                  <div className="text-2xl opacity-60">📅</div>
                </div>
              </Card>
              
              <Card padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-accent mb-1">{stats.categoryCounts.length}</div>
                    <div className="text-sm text-muted font-medium">Categories</div>
                  </div>
                  <div className="text-2xl opacity-60">🏷️</div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <Card padding="md" className="mb-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search records by title, content, or category..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cln(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  selectedCategory === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                )}
              >
                All ({records.length})
              </button>
              {stats?.categoryCounts.map((cat) => (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={cln(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors border flex items-center gap-1',
                    selectedCategory === cat.category
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-300'
                  )}
                >
                  <span>{getCategoryIcon(cat.category)}</span>
                  {cat.category} ({cat.count})
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-gray-50 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              <div className="text-sm text-muted">
                {filteredAndSortedRecords.length} {filteredAndSortedRecords.length === 1 ? 'record' : 'records'}
              </div>
            </div>
          </div>
        </Card>

        {/* Records List */}
        {filteredAndSortedRecords.length === 0 ? (
          <Card padding="lg">
            <div className="text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || selectedCategory !== 'all' ? 'No matching records' : 'No health records yet'}
              </h3>
              <p className="text-muted mb-6 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Start by adding your first health record - medications, allergies, conditions, or lab results.'
                }
              </p>
              <div className="flex gap-3 justify-center">
                {searchQuery || selectedCategory !== 'all' ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                ) : (
                  <Button as={Link} href="/dashboard/records/new" variant="primary">
                    Add First Record
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedRecords.map((record) => (
              <Card key={record.recordID} padding="md" hover>
                <div className="flex items-start gap-4">
                  <div className="text-2xl flex-shrink-0">{getCategoryIcon(record.category)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate pr-2">{record.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(record.category)}`}>
                            {record.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          as={Link}
                          href={`/dashboard/records/${record.recordID}/edit`}
                          variant="ghost"
                          size="sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="sr-only sm:not-sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(record.recordID)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-muted text-sm mb-3 line-clamp-2">{record.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
                      {record.dateRecorded && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Recorded: {formatDate(record.dateRecorded)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Added: {formatDate(record.createdAt)}
                      </span>
                    </div>
                    
                    {/* File Attachments */}
                    {record.files && record.files.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <span className="text-sm font-medium text-muted">{record.files.length} attachment{record.files.length > 1 ? 's' : ''}</span>
                        </div>
                        <FileList
                          files={record.files.map(file => ({
                            fileID: file.fileID,
                            originalFileName: file.originalFileName,
                            contentType: file.contentType,
                            fileSize: file.fileSize,
                            uploadedAt: file.uploadedAt
                          }))}
                          onDownload={downloadFile}
                          compact={true}
                          showPreview={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card padding="lg" className="max-w-md w-full">
              <div className="text-center">
                <div className="text-4xl mb-4">🗑️</div>
                <h3 className="text-lg font-semibold mb-2">Delete Health Record?</h3>
                <p className="text-muted mb-6">
                  This action cannot be undone. The record and all its attachments will be permanently deleted.
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