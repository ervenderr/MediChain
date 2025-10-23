// Application constants and configuration for mobile app
const getBaseUrl = (): string => {
  // For mobile, use the production URL or configurable
  return "https://medichain-production-a6f7.up.railway.app";
};

export const API_CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  ENDPOINTS: {
    // Authentication
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",

    // Health Records
    HEALTH_RECORDS: "/api/healthrecords",
    HEALTH_RECORDS_STATS: "/api/healthrecords/stats",

    // QR Access
    QR_ACCESS_ACTIVE: "/api/qraccess/active",
    QR_ACCESS_GENERATE: "/api/qraccess/generate",
    QR_ACCESS_REVOKE: "/api/qraccess/revoke",
    QR_ACCESS_VERIFY: "/api/qraccess/verify",
    QR_ACCESS_DATA: "/api/qraccess/data",

    // Emergency Info
    EMERGENCY_INFO: "/api/emergencyinfo",

    // Patient Profile
    PATIENT_PROFILE: "/api/patient/profile",

    // File Management
    FILE_UPLOAD: "/api/file/upload",
    FILE_DOWNLOAD: "/api/file/download",
  },
} as const;

export const APP_CONFIG = {
  NAME: "MediChain Mobile",
  VERSION: "1.0.0",
  MAX_FILE_SIZE: 10485760, // 10MB
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
  ],
} as const;

// API helper functions
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

export const createAuthHeaders = (
  token?: string | null
): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};
