// Application constants and configuration
// Get the base API URL dynamically
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `http://${window.location.hostname}:5001`;
  }
  
  return 'https://medichain-production-a6f7.up.railway.app';
};

export const API_CONFIG = {
  get BASE_URL() {
    return getBaseUrl();
  },
  ENDPOINTS: {
    // Authentication
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    
    // Health Records
    HEALTH_RECORDS: '/api/healthrecords',
    HEALTH_RECORDS_STATS: '/api/healthrecords/stats',
    HEALTH_RECORDS_CLEAR: '/api/healthrecords/clear-all',
    
    // QR Access
    QR_ACCESS_ACTIVE: '/api/qraccess/active',
    QR_ACCESS_GENERATE: '/api/qraccess/generate',
    QR_ACCESS_REVOKE: '/api/qraccess/revoke',
    QR_ACCESS_VERIFY: '/api/qraccess/verify',
    QR_ACCESS_DATA: '/api/qraccess/data',
    
    // Emergency Info
    EMERGENCY_INFO: '/api/emergencyinfo',
    
    // Patient Profile
    PATIENT_PROFILE: '/api/patient/profile',
    
    // File Management
    FILE_UPLOAD: '/api/file/upload',
    FILE_DOWNLOAD: '/api/file/download',
    
    // Migration
    CREATE_FILES_TABLE: '/api/migration/create-files-table',
  }
} as const;

export const APP_CONFIG = {
  NAME: process.env.NEXT_PUBLIC_APP_NAME || 'MediChain',
  VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  DEFAULT_TIMEZONE: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Manila',
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'),
  ALLOWED_FILE_TYPES: process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain'
  ],
  DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true',
} as const;

// API helper functions
export const getApiUrl = (endpoint: string): string => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  if (APP_CONFIG.DEBUG) {
    console.log(`API URL: ${url}`);
  }
  return url;
};

export const createAuthHeaders = (token?: string | null): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};