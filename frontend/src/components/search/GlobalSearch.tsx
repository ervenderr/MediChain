'use client';

import { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils';
import { getApiUrl, API_CONFIG } from '../../lib/constants';

interface SearchFilters {
  query: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  hasFiles: boolean | null;
  sortBy: 'newest' | 'oldest' | 'relevance' | 'title';
}

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
  createdAt: string;
  files: HealthRecordFile[];
}

interface SearchResult extends HealthRecord {
  matchedFields: string[];
  relevanceScore: number;
}

interface GlobalSearchProps {
  onResults: (results: SearchResult[], filters: SearchFilters) => void;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
  showAdvancedFilters?: boolean;
}

export default function GlobalSearch({ 
  onResults, 
  onFiltersChange,
  placeholder = "Search health records...",
  className = "",
  showAdvancedFilters = false 
}: GlobalSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    dateFrom: '',
    dateTo: '',
    hasFiles: null,
    sortBy: 'relevance'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(showAdvancedFilters);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Records' },
    { value: 'medication', label: 'Medications' },
    { value: 'allergy', label: 'Allergies' },
    { value: 'condition', label: 'Conditions' },
    { value: 'lab_result', label: 'Lab Results' },
    { value: 'vaccination', label: 'Vaccinations' },
    { value: 'procedure', label: 'Procedures' },
    { value: 'appointment', label: 'Appointments' },
  ];

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('medichain_search_history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useRef(
    debounce(async (searchFilters: unknown) => {
      const filters = searchFilters as SearchFilters;
      if (!filters.query.trim() && filters.category === 'all') {
        onResults([], filters);
        return;
      }

      setIsLoading(true);
      try {
        const results = await performSearch(filters);
        onResults(results, filters);
        
        // Add to search history if it's a new query
        if (filters.query.trim() && !searchHistory.includes(filters.query.trim())) {
          const newHistory = [filters.query.trim(), ...searchHistory.slice(0, 4)];
          setSearchHistory(newHistory);
          localStorage.setItem('medichain_search_history', JSON.stringify(newHistory));
        }
      } catch (error) {
        console.error('Search error:', error);
        onResults([], filters);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;

  // Perform the actual search
  const performSearch = async (searchFilters: SearchFilters): Promise<SearchResult[]> => {
    const token = localStorage.getItem('token');
    if (!token) return [];

    try {
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) return [];
      
      const records = await response.json();
      
      // Client-side filtering and searching
      let filteredRecords = records.filter((record: HealthRecord) => {
        // Category filter
        if (searchFilters.category !== 'all' && record.category !== searchFilters.category) {
          return false;
        }
        
        // Date range filter
        if (searchFilters.dateFrom && record.dateRecorded && new Date(record.dateRecorded) < new Date(searchFilters.dateFrom)) {
          return false;
        }
        if (searchFilters.dateTo && record.dateRecorded && new Date(record.dateRecorded) > new Date(searchFilters.dateTo)) {
          return false;
        }
        
        // Files filter
        if (searchFilters.hasFiles === true && (!record.files || record.files.length === 0)) {
          return false;
        }
        if (searchFilters.hasFiles === false && record.files && record.files.length > 0) {
          return false;
        }
        
        return true;
      });

      // Text search and relevance scoring
      if (searchFilters.query.trim()) {
        const query = searchFilters.query.toLowerCase();
        filteredRecords = filteredRecords.map((record: HealthRecord): SearchResult => {
          const matchedFields: string[] = [];
          let relevanceScore = 0;

          // Search in title (highest weight)
          if (record.title?.toLowerCase().includes(query)) {
            matchedFields.push('title');
            relevanceScore += 10;
          }

          // Search in content (medium weight)
          if (record.content?.toLowerCase().includes(query)) {
            matchedFields.push('content');
            relevanceScore += 5;
          }

          // Search in category (low weight)
          if (record.category?.toLowerCase().includes(query)) {
            matchedFields.push('category');
            relevanceScore += 2;
          }

          // Search in file names (medium weight)
          if (record.files) {
            record.files.forEach((file: HealthRecordFile) => {
              if (file.originalFileName?.toLowerCase().includes(query)) {
                matchedFields.push('files');
                relevanceScore += 3;
              }
            });
          }

          return {
            ...record,
            matchedFields,
            relevanceScore
          };
        }).filter((record: SearchResult) => record.matchedFields.length > 0);
      } else {
        // No text query, just add empty relevance data
        filteredRecords = filteredRecords.map((record: HealthRecord): SearchResult => ({
          ...record,
          matchedFields: [],
          relevanceScore: 0
        }));
      }

      // Sort results
      filteredRecords.sort((a: SearchResult, b: SearchResult) => {
        switch (searchFilters.sortBy) {
          case 'newest':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'relevance':
          default:
            return b.relevanceScore - a.relevanceScore;
        }
      });

      return filteredRecords;
    } catch (error) {
      console.error('Search API error:', error);
      return [];
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
    debouncedSearch(updatedFilters);
  };

  // Handle search input
  const handleSearchChange = (value: string) => {
    handleFilterChange({ query: value });
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    handleFilterChange({ query: suggestion });
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  };

  // Clear search
  const clearSearch = () => {
    handleFilterChange({ 
      query: '', 
      category: 'all', 
      dateFrom: '', 
      dateTo: '', 
      hasFiles: null 
    });
    searchInputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          value={filters.query}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setShowSuggestions(searchHistory.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          )}
          
          {filters.query && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 transition-colors ${showFilters ? 'text-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-500 font-medium mb-2">Recent Searches</div>
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(item)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as 'newest' | 'oldest' | 'relevance' | 'title' })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="relevance">Relevance</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* File Filter */}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Has Files:</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasFiles"
                  checked={filters.hasFiles === null}
                  onChange={() => handleFilterChange({ hasFiles: null })}
                  className="mr-2 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-600">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasFiles"
                  checked={filters.hasFiles === true}
                  onChange={() => handleFilterChange({ hasFiles: true })}
                  className="mr-2 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-600">With Files</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="hasFiles"
                  checked={filters.hasFiles === false}
                  onChange={() => handleFilterChange({ hasFiles: false })}
                  className="mr-2 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-gray-600">No Files</span>
              </label>
            </div>
          </div>

          {/* Clear Filters */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearSearch}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}