'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../components/layout/AppLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { getApiUrl, API_CONFIG } from '../../../lib/constants';

interface PatientProfile {
  patientID: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  bloodType: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    bloodType: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/patient/profile'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split('T')[0] : '',
          bloodType: data.bloodType || ''
        });
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/patient/profile'), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setSuccess(true);
        setIsEditing(false);
        
        // Update localStorage with new name
        localStorage.setItem('patientName', `${updatedProfile.firstName} ${updatedProfile.lastName}`);
        
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
    setFormData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      bloodType: profile?.bloodType || ''
    });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <Card padding="lg">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">👤</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
              <p className="text-gray-600">Manage your personal information and account settings</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-lg text-sm">
            Profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card padding="lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="bloodType" className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Type
                    </label>
                    <select
                      id="bloodType"
                      name="bloodType"
                      value={formData.bloodType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelEditing}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">First Name</label>
                      <p className="text-gray-900 font-medium">{profile?.firstName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Last Name</label>
                      <p className="text-gray-900 font-medium">{profile?.lastName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email Address</label>
                    <p className="text-gray-900 font-medium">{profile?.email}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <p className="text-gray-900 font-medium">
                        {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Type</label>
                      <p className="text-gray-900 font-medium">{profile?.bloodType || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Account Information */}
          <div>
            <Card padding="lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Patient ID</label>
                  <p className="text-gray-900 font-mono text-sm">{profile?.patientID}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Created</label>
                  <p className="text-gray-900 font-medium">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900 font-medium">
                    {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Security Section */}
            <Card padding="lg" className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="space-y-3">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                  onClick={() => alert('Password change feature coming soon!')}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Change Password
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}