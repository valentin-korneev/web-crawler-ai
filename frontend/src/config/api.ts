// Конфигурация API
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://localhost/api',
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;

// URL эндпоинтов
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/v1/auth/login',
    REGISTER: '/v1/auth/register',
    ME: '/v1/auth/me',
  },
  DASHBOARD: {
    STATS: '/v1/dashboard/stats',
  },
  FORBIDDEN_WORDS: {
    LIST: '/v1/forbidden-words/',
    CREATE: '/v1/forbidden-words/',
    UPDATE: (id: number) => `/v1/forbidden-words/${id}`,
    DELETE: (id: number) => `/v1/forbidden-words/${id}`,
  },
  MCC_CODES: {
    LIST: '/v1/mcc-codes/',
    CREATE: '/v1/mcc-codes/',
    UPDATE: (id: number) => `/v1/mcc-codes/${id}`,
    DELETE: (id: number) => `/v1/mcc-codes/${id}`,
  },
  CONTRACTORS: {
    LIST: '/v1/contractors/',
    CREATE: '/v1/contractors/',
    GET: (id: number) => `/v1/contractors/${id}`,
    UPDATE: (id: number) => `/v1/contractors/${id}`,
    DELETE: (id: number) => `/v1/contractors/${id}`,
    SCAN: (id: number) => `/v1/contractors/${id}/scan`,
    RESCAN: (id: number) => `/v1/contractors/${id}/rescan`,
    PAGES: (id: number) => `/v1/contractors/${id}/pages`,
    PAGE_DETAILS: (contractorId: number, pageId: number) => `/v1/contractors/${contractorId}/pages/${pageId}`,
  },
  SCAN_RESULTS: {
    LIST: '/v1/scan-results/',
  },
  SCAN_SESSIONS: {
    LIST: '/v1/scan-sessions/',
    GET: (id: number) => `/v1/scan-sessions/${id}`,
    DELETE: (id: number) => `/v1/scan-sessions/${id}`,
    START: (contractorId: number) => `/v1/scan-sessions/${contractorId}/start`,
  },
} as const; 