'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Automatically redirect when back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setRetryCount(0);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    
    try {
      // Test network connectivity
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.log('Still offline');
    }
  };

  const goToOfflineRecords = () => {
    router.push('/dashboard/records?offline=true');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center" padding="lg">
        {/* Connection Status */}
        <div className="mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isOnline ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}>
            {isOnline ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728m0 0L5.636 18.364m12.728 0L5.636 5.636m12.728 12.728L18.364 5.636" />
              </svg>
            )}
          </div>
          
          <h1 className={`text-2xl font-bold mb-2 ${
            isOnline ? 'text-green-600' : 'text-gray-900'
          }`}>
            {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
          </h1>
          
          <p className="text-gray-600 mb-6">
            {isOnline ? (
              'Redirecting you back to MediChain...'
            ) : (
              'No internet connection detected. Some features may be limited.'
            )}
          </p>
        </div>

        {/* Offline Features */}
        {!isOnline && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Offline</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>View previously loaded health records</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Access emergency health information</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>View saved QR codes</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Create records (saved when online)</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {isOnline ? (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Reconnecting...</span>
            </div>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleRetry}
              >
                {retryCount > 0 ? `Retry (${retryCount})` : 'Check Connection'}
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={goToOfflineRecords}
              >
                View Offline Records
              </Button>
            </>
          )}
        </div>

        {/* Network Tips */}
        {!isOnline && (
          <div className="mt-8 p-4 bg-primary-50 rounded-lg">
            <h3 className="text-sm font-semibold text-primary-900 mb-2">Connection Tips</h3>
            <ul className="text-xs text-primary-800 space-y-1">
              <li>• Check your WiFi or mobile data connection</li>
              <li>• Move to an area with better signal strength</li>
              <li>• Try turning airplane mode on and off</li>
              <li>• Restart your router if using WiFi</li>
            </ul>
          </div>
        )}

        {/* App Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="text-sm">MediChain - Secure Health Records</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Your health data remains secure and accessible offline
          </p>
        </div>
      </Card>
    </div>
  );
}