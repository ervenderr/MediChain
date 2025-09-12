'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface QRPatientInfo {
  name: string;
  dateOfBirth: string;
  bloodType: string;
}

interface QREmergencyContact {
  name: string;
  phone: string;
}

interface QRHealthRecord {
  title: string;
  category: string;
  content: string;
  dateRecorded?: string;
  createdAt: string;
}

interface QRHealthData {
  patientInfo: QRPatientInfo;
  emergencyContact?: QREmergencyContact;
  criticalAllergies: string[];
  currentMedications: string[];
  chronicConditions: string[];
  recentHealthRecords: QRHealthRecord[];
  allHealthRecords: QRHealthRecord[];
}

interface QRVerification {
  isValid: boolean;
  patientID: string;
  accessLevel: string;
  expiresAt: string;
  patientName: string;
  viewCount: number;
}

export default function QRViewer() {
  const params = useParams();
  const { accessLevel, token } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<QRVerification | null>(null);
  const [healthData, setHealthData] = useState<QRHealthData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [reloadCountdown, setReloadCountdown] = useState<number>(0);

  useEffect(() => {
    if (!token || !accessLevel) {
      setError('Invalid QR code link');
      setLoading(false);
      return;
    }

    verifyAndLoadData();
  }, [token, accessLevel]);

  useEffect(() => {
    if (verification) {
      const updateTimeRemaining = () => {
        const now = new Date();
        const expiry = new Date(verification.expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining('EXPIRED');
          // Start countdown for auto-reload
          if (reloadCountdown === 0) {
            setReloadCountdown(3);
            const countdownInterval = setInterval(() => {
              setReloadCountdown((prev) => {
                if (prev <= 1) {
                  clearInterval(countdownInterval);
                  window.location.reload();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          } else if (minutes > 0) {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        }
      };

      // Update immediately
      updateTimeRemaining();

      // Then update every second
      const interval = setInterval(updateTimeRemaining, 1000);

      return () => clearInterval(interval);
    }
  }, [verification]);

  const verifyAndLoadData = async () => {
    try {
      // First verify the token
      const verifyResponse = await fetch(`http://localhost:5001/api/qraccess/verify/${token}`);
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        setError(errorData.message || 'Invalid or expired QR code');
        setLoading(false);
        return;
      }

      const verificationData = await verifyResponse.json();
      
      if (!verificationData.isValid) {
        setError('QR code is not valid or has expired');
        setLoading(false);
        return;
      }

      // Check if access level matches
      if (verificationData.accessLevel !== accessLevel) {
        setError('Access level mismatch');
        setLoading(false);
        return;
      }

      setVerification(verificationData);

      // Load health data
      const dataResponse = await fetch(`http://localhost:5001/api/qraccess/data/${token}/${accessLevel}`);
      
      if (dataResponse.ok) {
        const healthData = await dataResponse.json();
        setHealthData(healthData);
      } else {
        const errorData = await dataResponse.json();
        setError(errorData.message || 'Failed to load health data');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      allergy: '⚠️',
      medication: '💊',
      condition: '🏥',
      lab_result: '🧪',
      vaccination: '💉',
      procedure: '🔬',
      appointment: '📅',
    };
    return icons[category] || '📋';
  };

  const getAccessLevelInfo = () => {
    switch (accessLevel) {
      case 'emergency':
        return {
          title: '🆘 Emergency Access',
          description: 'Critical health information for emergency situations',
          color: 'border-red-500 bg-red-50 text-red-700'
        };
      case 'basic':
        return {
          title: '📋 Basic Access',
          description: 'Essential health information and recent records',
          color: 'border-blue-500 bg-blue-50 text-blue-700'
        };
      case 'full':
        return {
          title: '📖 Full Access',
          description: 'Complete medical history and all health records',
          color: 'border-purple-500 bg-purple-50 text-purple-700'
        };
      default:
        return {
          title: 'Health Access',
          description: 'Health information access',
          color: 'border-gray-500 bg-gray-50 text-gray-700'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading health information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Access Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="bg-yellow-50 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-900 mb-2">Common Issues:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• QR code has expired</li>
              <li>• QR code has been revoked by patient</li>
              <li>• Invalid or corrupted QR code</li>
              <li>• Network connectivity issues</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!verification || !healthData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-600">Unable to load health data</p>
        </div>
      </div>
    );
  }

  const accessInfo = getAccessLevelInfo();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">🏥 MediChain</h1>
            <div className={`inline-block px-4 py-2 rounded-lg border ${accessInfo.color}`}>
              <div className="font-medium">{accessInfo.title}</div>
              <div className="text-xs mt-1">{accessInfo.description}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Patient Info & Status */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{healthData.patientInfo.name}</h2>
                <div className="text-sm text-gray-600 mt-1">
                  <p>Date of Birth: {new Date(healthData.patientInfo.dateOfBirth).toLocaleDateString()}</p>
                  <p>Blood Type: <span className="font-medium text-red-600">{healthData.patientInfo.bloodType}</span></p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <p>Expires in: <span className={`font-medium ${timeRemaining === 'EXPIRED' ? 'text-red-600' : 'text-green-600'}`}>
                    {timeRemaining}
                  </span></p>
                  <p>View #{verification.viewCount}</p>
                </div>
              </div>
            </div>
          </div>

          {timeRemaining === 'EXPIRED' && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="text-red-800">
                <p className="font-medium">This QR code has expired</p>
                <p className="text-sm">Please request a new QR code from the patient</p>
                {reloadCountdown > 0 && (
                  <p className="text-sm mt-2 font-medium">
                    🔄 Refreshing in {reloadCountdown} seconds...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        {healthData.emergencyContact && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📞 Emergency Contact
            </h3>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="font-medium text-red-900">{healthData.emergencyContact.name}</p>
              <p className="text-red-700">{healthData.emergencyContact.phone}</p>
            </div>
          </div>
        )}

        {/* Critical Allergies */}
        {healthData.criticalAllergies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              ⚠️ Critical Allergies
            </h3>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="space-y-2">
                {healthData.criticalAllergies.map((allergy, index) => (
                  <div key={index} className="bg-white rounded p-3 border-l-4 border-red-500">
                    <p className="font-medium text-red-900">{allergy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Current Medications */}
        {healthData.currentMedications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              💊 Current Medications
            </h3>
            <div className="space-y-3">
              {healthData.currentMedications.map((medication, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-4">
                  <p className="text-blue-900">{medication}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chronic Conditions - Only for Full Access */}
        {accessLevel === 'full' && healthData.chronicConditions && healthData.chronicConditions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🏥 Chronic Conditions
            </h3>
            <div className="space-y-3">
              {healthData.chronicConditions.map((condition, index) => (
                <div key={index} className="bg-orange-50 rounded-lg p-4">
                  <p className="text-orange-900">{condition}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Health Records */}
        {healthData.recentHealthRecords && healthData.recentHealthRecords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📋 Recent Health Records
            </h3>
            <div className="space-y-4">
              {healthData.recentHealthRecords.map((record, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(record.category)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{record.title}</h4>
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {record.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{record.content}</p>
                  <div className="text-xs text-gray-500">
                    {record.dateRecorded && (
                      <span>Date: {new Date(record.dateRecorded).toLocaleDateString()} • </span>
                    )}
                    <span>Added: {new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Health Records (Full Access Only) */}
        {healthData.allHealthRecords && healthData.allHealthRecords.length > 0 && accessLevel === 'full' && (
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              📖 Complete Medical History
            </h3>
            <div className="space-y-4">
              {healthData.allHealthRecords.map((record, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{getCategoryIcon(record.category)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{record.title}</h4>
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        {record.category}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2">{record.content}</p>
                  <div className="text-xs text-gray-500">
                    {record.dateRecorded && (
                      <span>Date: {new Date(record.dateRecorded).toLocaleDateString()} • </span>
                    )}
                    <span>Added: {new Date(record.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-gray-500">
            <div className="mb-4">
              <p className="text-sm">This health information is provided by MediChain</p>
              <p className="text-xs">Secure • Time-limited • Patient-controlled</p>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs">
                🔒 This access has been logged for security purposes
              </p>
              <p className="text-xs text-gray-400 mt-1">
                MediChain - Empowering patients to own and control their health data
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}