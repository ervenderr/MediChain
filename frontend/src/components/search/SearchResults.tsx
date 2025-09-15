'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '../utils';

interface SearchResult {
  id: string;
  title: string;
  category: string;
  content: string;
  dateRecorded: string;
  createdAt: string;
  files: any[];
  matchedFields: string[];
  relevanceScore: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export default function SearchResults({ 
  results, 
  query, 
  isLoading = false, 
  onLoadMore, 
  hasMore = false,
  className = "" 
}: SearchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  // Pagination
  const totalPages = Math.ceil(results.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const paginatedResults = results.slice(startIndex, startIndex + resultsPerPage);

  // Highlight matching text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded text-yellow-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Get category icon and color
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { icon: string; color: string; bgColor: string }> = {
      'medication': { icon: '💊', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
      'allergy': { icon: '⚠️', color: 'text-red-700', bgColor: 'bg-red-50 border-red-200' },
      'condition': { icon: '🩺', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-200' },
      'lab_result': { icon: '🔬', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
      'vaccination': { icon: '💉', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200' },
      'procedure': { icon: '🏥', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
      'appointment': { icon: '📅', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' },
    };
    
    return categoryMap[category] || { icon: '📋', color: 'text-gray-700', bgColor: 'bg-gray-50 border-gray-200' };
  };

  // Get relevance indicator
  const getRelevanceIndicator = (score: number) => {
    if (score >= 10) return { text: 'Exact Match', color: 'text-green-600', dots: 3 };
    if (score >= 5) return { text: 'Good Match', color: 'text-blue-600', dots: 2 };
    if (score >= 2) return { text: 'Partial Match', color: 'text-yellow-600', dots: 1 };
    return { text: 'Related', color: 'text-gray-600', dots: 1 };
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    document.getElementById('search-results-top')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Searching your health records...</span>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={`${className}`}>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 mb-6">
            {query ? (
              <>
                No health records match your search for <strong>"{query}"</strong>
              </>
            ) : (
              "Try adjusting your filters or search terms"
            )}
          </p>
          <div className="text-sm text-gray-500">
            <p>Search tips:</p>
            <ul className="mt-2 space-y-1">
              <li>• Try different keywords</li>
              <li>• Check for typos</li>
              <li>• Use broader search terms</li>
              <li>• Try searching by category or date range</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div id="search-results-top" />
      
      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <strong>{startIndex + 1}-{Math.min(startIndex + resultsPerPage, results.length)}</strong> of <strong>{results.length}</strong> results
          {query && <span> for <strong>"{query}"</strong></span>}
        </div>
        
        {results.length > resultsPerPage && (
          <div className="text-sm text-gray-500">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {paginatedResults.map((result) => {
          const categoryInfo = getCategoryInfo(result.category);
          const relevance = getRelevanceIndicator(result.relevanceScore);
          
          return (
            <div
              key={result.id}
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{categoryInfo.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {highlightText(result.title, query)}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${categoryInfo.bgColor} ${categoryInfo.color}`}>
                      {result.category}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {highlightText(result.content.substring(0, 200), query)}
                    {result.content.length > 200 && '...'}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Recorded: {formatDate(result.dateRecorded)}
                    </span>
                    
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Added: {formatDate(result.createdAt)}
                    </span>

                    {result.files && result.files.length > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        {result.files.length} file{result.files.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Matched Fields & Relevance */}
                  {query && result.matchedFields.length > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Matched in:</span>
                        <div className="flex gap-1">
                          {result.matchedFields.map((field, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs"
                            >
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <span className={`text-xs ${relevance.color}`}>{relevance.text}</span>
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < relevance.dots ? relevance.color.replace('text-', 'bg-') : 'bg-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  <Link
                    href={`/dashboard/records/${result.id}/edit`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    View
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center">
          <nav className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              const isCurrentPage = page === currentPage;
              const isNearCurrent = Math.abs(page - currentPage) <= 2;
              const isFirst = page === 1;
              const isLast = page === totalPages;
              
              if (!isNearCurrent && !isFirst && !isLast) {
                return page === 2 || page === totalPages - 1 ? (
                  <span key={page} className="px-2 text-gray-400">...</span>
                ) : null;
              }
              
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isCurrentPage
                      ? 'bg-cyan-600 text-white'
                      : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Load More (if using infinite scroll) */}
      {hasMore && onLoadMore && (
        <div className="mt-8 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Loading...' : 'Load More Results'}
          </button>
        </div>
      )}
    </div>
  );
}