'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';

export default function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);
  const [showOnlineNotice, setShowOnlineNotice] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineNotice(true);
      setShowOnlineNotice(false);
    } else {
      // If we were offline and now we're online, show reconnection notice
      if (showOfflineNotice) {
        setShowOnlineNotice(true);
        setShowOfflineNotice(false);
        
        // Hide the online notice after 3 seconds
        setTimeout(() => {
          setShowOnlineNotice(false);
        }, 3000);
      }
    }
  }, [isOnline, showOfflineNotice]);

  // Offline indicator
  if (showOfflineNotice) {
    return (
      <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-lg z-30 transition-all duration-300">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-yellow-800">
              You're offline
            </div>
            <div className="text-xs text-yellow-700 mt-1">
              Some features are limited. Your data will sync when you reconnect.
            </div>
          </div>
          <div className="ml-auto flex-shrink-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Online/reconnected indicator
  if (showOnlineNotice) {
    return (
      <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-lg z-30 transition-all duration-300">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-green-800">
              Back online
            </div>
            <div className="text-xs text-green-700 mt-1">
              Connection restored. Syncing your latest changes...
            </div>
          </div>
          <div className="ml-auto flex-shrink-0">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}