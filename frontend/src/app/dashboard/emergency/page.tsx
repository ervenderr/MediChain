'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '../../../components/layout/AppLayout';
import { getApiUrl, API_CONFIG } from '../../../lib/constants';

interface EmergencyInfo {
  patientID: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  criticalAllergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  bloodType: string;
  updatedAt?: string;
  isConfigured: boolean;
}

export default function EmergencyProfile() {
  const router = useRouter();
  const [emergencyInfo, setEmergencyInfo] = useState<EmergencyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [patientName, setPatientName] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    criticalAllergies: [''],
    chronicConditions: [''],
    currentMedications: [''],
    bloodType: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('patientName');
    if (!token) {
      router.push('/login');
      return;
    }

    setPatientName(name || 'Patient');
    fetchEmergencyInfo();
  }, [router]);

  const fetchEmergencyInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.EMERGENCY_INFO), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencyInfo(data);
        setFormData({
          emergencyContactName: data.emergencyContactName || '',
          emergencyContactPhone: data.emergencyContactPhone || '',
          criticalAllergies: data.criticalAllergies.length > 0 ? data.criticalAllergies : [''],
          chronicConditions: data.chronicConditions.length > 0 ? data.chronicConditions : [''],
          currentMedications: data.currentMedications.length > 0 ? data.currentMedications : [''],
          bloodType: data.bloodType || ''
        });
      }
    } catch (error) {
      console.error('Error fetching emergency info:', error);
      setError('Failed to load emergency information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    // Filter out empty strings from arrays
    const cleanedData = {
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      criticalAllergies: formData.criticalAllergies.filter(item => item.trim() !== ''),
      chronicConditions: formData.chronicConditions.filter(item => item.trim() !== ''),
      currentMedications: formData.currentMedications.filter(item => item.trim() !== ''),
      bloodType: formData.bloodType
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.EMERGENCY_INFO), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanedData),
      });

      if (response.ok) {
        const data = await response.json();
        setEmergencyInfo(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to save emergency information');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addListItem = (field: 'criticalAllergies' | 'chronicConditions' | 'currentMedications') => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeListItem = (field: 'criticalAllergies' | 'chronicConditions' | 'currentMedications', index: number) => {
    setFormData({
      ...formData,
      [field]: formData[field].filter((_, i) => i !== index)
    });
  };

  const updateListItem = (field: 'criticalAllergies' | 'chronicConditions' | 'currentMedications', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading emergency information...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🆘</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Emergency Profile</h2>
              <p className="text-gray-600">Critical health information for emergency situations</p>
            </div>
          </div>
          
          {emergencyInfo?.isConfigured && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span className="text-green-800 font-medium">Emergency profile is set up</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Last updated: {emergencyInfo.updatedAt ? new Date(emergencyInfo.updatedAt).toLocaleDateString() : 'Never'}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-8">
              {/* Status Messages */}
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm">
                  Emergency profile saved successfully!
                </div>
              )}

              {/* Emergency Contact */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  📞 Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({...formData, emergencyContactName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Full name of emergency contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({...formData, emergencyContactPhone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Blood Type */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🩸 Blood Type
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, bloodType: type})}
                      className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        formData.bloodType === type
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Critical Allergies */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  ⚠️ Critical Allergies
                </h3>
                <div className="space-y-3">
                  {formData.criticalAllergies.map((allergy, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={allergy}
                        onChange={(e) => updateListItem('criticalAllergies', index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Penicillin, Peanuts, Shellfish"
                      />
                      {formData.criticalAllergies.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem('criticalAllergies', index)}
                          className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('criticalAllergies')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2"
                  >
                    + Add another allergy
                  </button>
                </div>
              </div>

              {/* Current Medications */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  💊 Current Medications
                </h3>
                <div className="space-y-3">
                  {formData.currentMedications.map((medication, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={medication}
                        onChange={(e) => updateListItem('currentMedications', index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Metformin 500mg twice daily"
                      />
                      {formData.currentMedications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem('currentMedications', index)}
                          className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('currentMedications')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2"
                  >
                    + Add another medication
                  </button>
                </div>
              </div>

              {/* Chronic Conditions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  🏥 Chronic Conditions
                </h3>
                <div className="space-y-3">
                  {formData.chronicConditions.map((condition, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        value={condition}
                        onChange={(e) => updateListItem('chronicConditions', index, e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="e.g., Type 2 Diabetes, Hypertension"
                      />
                      {formData.chronicConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeListItem('chronicConditions', index)}
                          className="px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addListItem('chronicConditions')}
                    className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-2"
                  >
                    + Add another condition
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex items-center justify-between">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                ← Back to Dashboard
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {saving ? 'Saving...' : '🆘 Save Emergency Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-red-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <h3 className="font-medium text-red-900 mb-2">Important: Emergency Information</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• This information will be accessible via QR codes during medical emergencies</li>
                <li>• Keep your medication list current - include dosages when possible</li>
                <li>• Critical allergies should include all known severe reactions</li>
                <li>• Make sure your emergency contact is always reachable</li>
                <li>• Update this information whenever your health status changes</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}