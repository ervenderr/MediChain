"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AppLayout from "../../components/layout/AppLayout";
import { formatDateTime } from "../../components/utils";
import { getApiUrl, API_CONFIG } from "../../lib/constants";

interface DashboardStats {
  healthRecords: number;
  activeQRCodes: number;
  recentViews: number;
  emergencyProfile: string;
}

interface HealthRecord {
  recordID: string;
  recordType: string;
  description: string;
  dateRecorded: string;
  files?: { fileName: string }[];
}

export default function Dashboard() {
  const router = useRouter();
  const [patientName, setPatientName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    healthRecords: 0,
    activeQRCodes: 0,
    recentViews: 0,
    emergencyProfile: "Not Set",
  });
  const [recentRecords, setRecentRecords] = useState<HealthRecord[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    const name = localStorage.getItem("patientName");
    if (name) {
      setPatientName(name);
    }

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const [qrResponse, recordsResponse, emergencyResponse] =
        await Promise.all([
          fetch(getApiUrl(API_CONFIG.ENDPOINTS.QR_ACCESS_ACTIVE), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH_RECORDS), {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(getApiUrl(API_CONFIG.ENDPOINTS.EMERGENCY_INFO), {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      const activeQRs = qrResponse.ok ? await qrResponse.json() : [];
      const healthRecords = recordsResponse.ok
        ? await recordsResponse.json()
        : [];
      const emergencyInfo = emergencyResponse.ok
        ? await emergencyResponse.json()
        : null;

      setStats({
        healthRecords: healthRecords.length || 0,
        activeQRCodes: activeQRs.length || 0,
        recentViews: activeQRs.filter((qr: { isViewed: boolean }) => qr.isViewed).length || 0,
        emergencyProfile: emergencyInfo ? "Set" : "Not Set",
      });

      // Get recent records (last 3)
      const recent = healthRecords.slice(0, 3) || [];
      setRecentRecords(recent);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("patientId");
    localStorage.removeItem("patientName");
    router.push("/");
  };

  const getRecordIcon = (recordType: string) => {
    const icons: Record<string, string> = {
      Medication: "💊",
      Allergy: "⚠️",
      Condition: "🩺",
      "Lab Result": "🔬",
      Vaccination: "💉",
      Surgery: "🏥",
      Prescription: "📝",
      default: "📋",
    };
    return icons[recordType] || icons.default;
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-mobile">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 mb-3 skeleton"></div>
            <div className="h-5 bg-gray-200 rounded w-96 skeleton"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-surface-elevated rounded-lg p-6 border border-gray-200"
              >
                <div className="h-8 bg-gray-200 rounded w-12 mb-2 skeleton"></div>
                <div className="h-4 bg-gray-200 rounded w-20 skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Mobile Header - only visible on small/medium screens */}
      <header className="bg-white border-b border-gray-200 lg:hidden block md:block">
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-cyan-600 flex items-center gap-2">
                <Image 
                  src="/medichain.svg" 
                  alt="MediChain" 
                  width={24}
                  height={24}
                />
                MediChain
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back, {patientName}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="bg-white border-b border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto p-4 lg:p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-cyan-600 flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
                MediChain
              </h1>
              <p className="text-gray-600">
                Welcome back, {patientName}! Here&apos;s your health summary.
              </p>
            </div>
            {/* <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-4 h-4 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Sign out
            </button> */}
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Health Overview Stats */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Health Overview
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Health Records */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-cyan-600 mb-1">
                    {stats.healthRecords}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Records
                  </div>
                </div>
                <div className="text-2xl opacity-60">📋</div>
              </div>
            </div>

            {/* Active QR Codes */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {stats.activeQRCodes}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Active QRs
                  </div>
                </div>
                <div className="text-2xl opacity-60">📱</div>
              </div>
            </div>

            {/* Recent Views */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-amber-600 mb-1">
                    {stats.recentViews}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Recent Views
                  </div>
                </div>
                <div className="text-2xl opacity-60">👁️</div>
              </div>
            </div>

            {/* Emergency Profile */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className={`text-lg font-bold mb-1 ${
                      stats.emergencyProfile === "Set"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {stats.emergencyProfile}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    Emergency
                  </div>
                </div>
                <div className="text-2xl opacity-60">🆘</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Add Health Record */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-cyan-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Add Record</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Add medications, allergies, conditions, or lab results with
                  file attachments
                </p>
                <Link
                  href="/dashboard/records/new"
                  className="w-full bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors inline-block text-center"
                >
                  Add New Record
                </Link>
              </div>
            </div>

            {/* Emergency Profile */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div
                  className={`w-12 h-12 ${
                    stats.emergencyProfile === "Set"
                      ? "bg-green-50"
                      : "bg-red-50"
                  } rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      stats.emergencyProfile === "Set"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Emergency Info</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  {stats.emergencyProfile === "Set"
                    ? "Update your critical emergency information"
                    : "Set up critical info for emergency situations"}
                </p>
                <Link
                  href="/dashboard/emergency"
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors inline-block text-center ${
                    stats.emergencyProfile === "Set"
                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {stats.emergencyProfile === "Set"
                    ? "Update Info"
                    : "Setup Emergency"}
                </Link>
              </div>
            </div>

            {/* Generate QR Code */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Share Records</h3>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                  Generate secure QR codes to share specific health information
                </p>
                <Link
                  href="/dashboard/qr"
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors inline-block text-center"
                >
                  Generate QR Code
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Health Records */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Records
            </h2>
            <Link
              href="/dashboard/records"
              className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {recentRecords.length > 0 ? (
            <div className="space-y-3">
              {recentRecords.map((record) => (
                <div
                  key={record.recordID}
                  className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">
                      {getRecordIcon(record.recordType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {record.recordType}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {formatDateTime(record.dateRecorded)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">
                        {record.description}
                      </p>
                      {record.files && record.files.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          {record.files.length} file
                          {record.files.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm text-center">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-lg font-medium mb-2">
                Start Your Health Journey
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Welcome to MediChain! Add your first health record or set up
                your emergency profile to get started.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard/records/new"
                  className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-cyan-700 transition-colors"
                >
                  Add First Record
                </Link>
                <Link
                  href="/dashboard/emergency"
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Setup Emergency
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
