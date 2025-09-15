'use client';

import { useState } from 'react';
import { usePWA } from './PWAProvider';
import Button from '../ui/Button';

export default function UpdateBanner() {
  const { updateAvailable, updateApp } = usePWA();
  const [isVisible, setIsVisible] = useState(true);

  if (!updateAvailable || !isVisible) return null;

  const handleUpdate = () => {
    updateApp();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-4 shadow-lg z-40 transform transition-transform duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm">Update Available</div>
            <div className="text-xs opacity-90 truncate">
              A new version of MediChain is ready to install
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-white border-white/30 hover:bg-white/10"
            onClick={handleDismiss}
          >
            Later
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-cyan-600 hover:bg-gray-100"
            onClick={handleUpdate}
          >
            Update Now
          </Button>
        </div>
      </div>
    </div>
  );
}