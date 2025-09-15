'use client';

import { useState, useEffect } from 'react';
import { usePWA } from './PWAProvider';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function InstallPrompt() {
  const { 
    showInstallPrompt, 
    installApp, 
    dismissInstallPrompt,
    isInstalled 
  } = usePWA();
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showInstallPrompt && !isInstalled) {
      // Add a small delay for smoother animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showInstallPrompt, isInstalled]);

  const handleInstall = async () => {
    await installApp();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4 z-50 backdrop-blur-sm">
      {/* Mobile: Bottom sheet style, Desktop: Center modal */}
      <Card 
        className={`w-full max-w-md transform transition-all duration-300 ease-out ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-full sm:translate-y-0 opacity-0 scale-95'
        }`}
        padding="lg"
      >
        {/* App Icon and Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Install MediChain</h2>
          <p className="text-gray-600 text-sm">
            Get quick access to your health records anytime, anywhere
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
            <span>Works offline - access records without internet</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <span>Faster loading and better performance</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
            <span>Push notifications for important updates</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
            <span>Quick actions from your home screen</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={handleDismiss}
          >
            Not Now
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            onClick={handleInstall}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Install App
          </Button>
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Installing the app will save it to your device. You can uninstall it anytime from your device settings.
        </p>
      </Card>
    </div>
  );
}