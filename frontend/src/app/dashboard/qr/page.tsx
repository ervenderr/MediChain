'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import AppLayout from '../../../components/layout/AppLayout';
import { getApiUrl, API_CONFIG } from '../../../lib/constants';

interface QRTokenResponse {
  accessID: string;
  qrToken: string;
  qrUrl: string;
  accessLevel: string;
  expiresAt: string;
  createdAt: string;
}

interface ActiveToken {
  accessID: string;
  accessLevel: string;
  qrToken: string;
  qrUrl: string;
  createdAt: string;
  expiresAt: string;
  viewedAt?: string;
  isViewed: boolean;
}

export default function QRGeneration() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTokens, setActiveTokens] = useState<ActiveToken[]>([]);
  const [currentQR, setCurrentQR] = useState<QRTokenResponse | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [expandedQR, setExpandedQR] = useState<string | null>(null);
  const [expandedQRImage, setExpandedQRImage] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');

  // Form state
  const [accessLevel, setAccessLevel] = useState('emergency');
  const [expirationHours, setExpirationHours] = useState(2);

  const accessLevels = [
    {
      value: 'emergency',
      label: '🆘 Emergency Access',
      description: 'Critical info: blood type, allergies, emergency contact, current medications',
      color: 'border-red-500 bg-red-50 text-red-700',
      buttonColor: 'bg-red-600 hover:bg-red-700'
    },
    {
      value: 'basic',
      label: '📋 Basic Access',  
      description: 'Emergency info + recent health records (last 30 days)',
      color: 'border-blue-500 bg-blue-50 text-blue-700',
      buttonColor: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      value: 'full',
      label: '📖 Full Access',
      description: 'All health information including complete medical history',
      color: 'border-purple-500 bg-purple-50 text-purple-700',
      buttonColor: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const expirationOptions = [
    { value: 0.083, label: '5 minutes' },
    { value: 0.25, label: '15 minutes' },
    { value: 0.5, label: '30 minutes' },
    { value: 1, label: '1 hour' },
    { value: 2, label: '2 hours' },
    { value: 4, label: '4 hours' },
    { value: 8, label: '8 hours' },
    { value: 24, label: '24 hours' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('patientName');
    if (!token) {
      router.push('/login');
      return;
    }

    setPatientName(name || 'Patient');
    fetchActiveTokens();
  }, [router]);

  const fetchActiveTokens = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.QR_ACCESS_ACTIVE), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActiveTokens(data);
      }
    } catch (error) {
      console.error('Error fetching active tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    setGenerating(true);
    setError('');
    setCurrentQR(null);
    setQrDataUrl('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.QR_ACCESS_GENERATE), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessLevel: accessLevel,
          expirationHours: expirationHours
        }),
      });

      if (response.ok) {
        const qrData = await response.json();
        setCurrentQR(qrData);
        
        // Generate QR code image
        const qrImageUrl = await QRCode.toDataURL(qrData.qrUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrDataUrl(qrImageUrl);
        
        // Refresh active tokens
        await fetchActiveTokens();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to generate QR code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const revokeToken = async (accessId: string) => {
    if (!confirm('Are you sure you want to revoke this QR code? It will no longer be accessible.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${getApiUrl(API_CONFIG.ENDPOINTS.QR_ACCESS_REVOKE)}/${accessId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchActiveTokens();
        if (currentQR?.accessID === accessId) {
          setCurrentQR(null);
          setQrDataUrl('');
        }
      }
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  };

  const downloadQRCode = () => {
    if (!qrDataUrl || !currentQR) return;

    const link = document.createElement('a');
    link.download = `MediChain-QR-${currentQR.accessLevel}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyQRUrl = () => {
    if (!currentQR) return;
    
    navigator.clipboard.writeText(currentQR.qrUrl);
    // Could add a toast notification here
  };

  const getAccessLevelInfo = (level: string) => {
    return accessLevels.find(al => al.value === level) || accessLevels[0];
  };

  const toggleQRView = async (token: ActiveToken) => {
    if (expandedQR === token.accessID) {
      // Hide QR if it's currently shown
      setExpandedQR(null);
      setExpandedQRImage('');
    } else {
      // Show QR for this token
      try {
        // Generate QR code image using the token's QR URL
        const qrImageUrl = await QRCode.toDataURL(token.qrUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        setExpandedQR(token.accessID);
        setExpandedQRImage(qrImageUrl);
      } catch (err) {
        console.error('Error generating QR for active token:', err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('patientId');
    localStorage.removeItem('patientName');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR generation...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📱</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Generate QR Code</h2>
              <p className="text-gray-600">Create secure QR codes to share your health information</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Generation Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New QR Code</h3>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              {/* Access Level Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Access Level
                </label>
                <div className="space-y-3">
                  {accessLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setAccessLevel(level.value)}
                      className={`w-full p-4 rounded-lg border text-left transition-colors ${
                        accessLevel === level.value
                          ? level.color
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-sm">{level.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiration Time
                </label>
                <select
                  value={expirationHours}
                  onChange={(e) => setExpirationHours(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {expirationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  QR code will automatically expire after this time for security
                </p>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateQRCode}
                disabled={generating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  getAccessLevelInfo(accessLevel).buttonColor
                } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {generating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {generating ? 'Generating...' : `📱 Generate ${getAccessLevelInfo(accessLevel).label}`}
              </button>
            </div>

            {/* Security Info */}
            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">🔒</span>
                <div>
                  <h3 className="font-medium text-green-900 mb-2">Security Features</h3>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• QR codes use cryptographically secure tokens</li>
                    <li>• Automatic expiration prevents unauthorized access</li>
                    <li>• All access attempts are logged with IP and timestamp</li>
                    <li>• You can revoke QR codes anytime</li>
                    <li>• Different access levels control information visibility</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Display & Active Tokens */}
          <div className="space-y-6">
            {/* Current QR Code */}
            {currentQR && qrDataUrl && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your QR Code</h3>
                
                <div className="text-center mb-4">
                  <img 
                    src={qrDataUrl} 
                    alt="Generated QR Code" 
                    className="mx-auto border rounded-lg"
                  />
                </div>

                <div className="space-y-3">
                  <div className="text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      getAccessLevelInfo(currentQR.accessLevel).color
                    }`}>
                      {getAccessLevelInfo(currentQR.accessLevel).label}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 text-center">
                    <p>Expires: {new Date(currentQR.expiresAt).toLocaleString()}</p>
                    <p className="mt-1">Created: {new Date(currentQR.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={downloadQRCode}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                    >
                      📥 Download
                    </button>
                    <button
                      onClick={copyQRUrl}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                    >
                      📋 Copy Link
                    </button>
                    <button
                      onClick={() => revokeToken(currentQR.accessID)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
                    >
                      🗑️ Revoke
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Active QR Codes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active QR Codes ({activeTokens.length})
              </h3>

              {activeTokens.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-4">📱</div>
                  <p className="text-sm">No active QR codes</p>
                  <p className="text-xs text-gray-400 mt-1">Generate your first QR code to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeTokens.map((token) => (
                    <div key={token.accessID} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 cursor-pointer" onClick={() => toggleQRView(token)}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              getAccessLevelInfo(token.accessLevel).color
                            }`}>
                              {getAccessLevelInfo(token.accessLevel).label}
                            </span>
                            {token.isViewed && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                ✓ Viewed
                              </span>
                            )}
                            <span className="text-blue-500 text-xs">
                              {expandedQR === token.accessID ? '🔽 Hide QR' : '📱 Show QR'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <p>Created: {new Date(token.createdAt).toLocaleString()}</p>
                            <p>Expires: {new Date(token.expiresAt).toLocaleString()}</p>
                            {token.viewedAt && (
                              <p>Last viewed: {new Date(token.viewedAt).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => revokeToken(token.accessID)}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                        >
                          Revoke
                        </button>
                      </div>

                      {/* Expandable QR Code */}
                      {expandedQR === token.accessID && expandedQRImage && (
                        <div className="border-t border-gray-200 pt-4 text-center">
                          <img 
                            src={expandedQRImage} 
                            alt="QR Code" 
                            className="mx-auto border rounded-lg mb-3"
                          />
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(token.qrUrl);
                              }}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
                            >
                              📋 Copy Link
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const link = document.createElement('a');
                                link.download = `MediChain-QR-${token.accessLevel}-${new Date().toISOString().split('T')[0]}.png`;
                                link.href = expandedQRImage;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              📥 Download
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-xl">💡</span>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">How to Use QR Codes</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>For Healthcare Providers:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Scan QR code with any smartphone camera</li>
                  <li>Or visit our website scanner at medichain.com/scan</li>
                  <li>Access health information instantly</li>
                  <li>Perfect for emergency rooms, clinics, pharmacies</li>
                </ul>
                <p className="mt-3"><strong>For Patients:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Print QR codes and keep in wallet/purse</li>
                  <li>Save QR image to phone for quick access</li>
                  <li>Share different access levels based on situation</li>
                  <li>Emergency QR for ambulance/ER, Full QR for doctor visits</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}