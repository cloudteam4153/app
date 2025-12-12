/**
 * API Configuration
 * 
 * This file contains the base URL for the composite microservice.
 * The composite service coordinates multiple atomic microservices (integrations, actions, classification).
 */

// API Configuration
// In development, Vite proxy handles CORS by forwarding requests to the backend
// In production, use full URLs to the deployed services
// In Vite, environment variables are accessed via import.meta.env
// and must be prefixed with VITE_ to be exposed to the client

// Check if we're in development mode
// import.meta.env.DEV is true in development, false in production
// import.meta.env.MODE is 'development' or 'production'
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// In development, use absolute URLs to ensure cookies are sent to the correct domain
// Cookies set on momoinbox.mooo.com during OAuth won't be accessible to localhost:5173
// In production, use full URLs to the deployed services
const COMPOSITE_MS_URL = import.meta.env.VITE_API_URL || 'https://momoinbox.mooo.com';

export const API_BASE_URL = COMPOSITE_MS_URL;

// Debug logging (only in development)
if (isDevelopment) {
  console.log('[API Config] Development mode detected');
  console.log('[API Config] API_BASE_URL:', API_BASE_URL);
  console.log('[API Config] Using absolute URLs (cookies must be sent to backend domain)');
}

// Temporary test user ID (from integrations-svc-ms2/utils/auth.py)
// NOTE: The service uses hardcoded test user: 3aab3fba-9f4d-48ee-bee5-c1df257c33cc
// This ID is used for creating connections, but the service will use the hardcoded user for all requests
export const TEST_USER_ID = '3aab3fba-9f4d-48ee-bee5-c1df257c33cc';

// Temporary test user ID for actions service (uses int, not UUID)
// TODO: Replace with proper authentication/session management
// Note: This should map to the same user as TEST_USER_ID above
export const TEST_USER_ID_INT = 1;

// API endpoint paths
// Composite service endpoints - paths match actual backend structure from OpenAPI spec
// Note: Most endpoints do NOT use /api prefix, except /api/dashboard
export const API_PATHS = {
  // Health check (composite service root health endpoint)
  HEALTH: '/health',
  
  // Integrations endpoints (no /api prefix, no service name prefix)
  INTEGRATIONS: {
    BASE: '/connections',
    CONNECTIONS: '/connections',
    MESSAGES: '/messages',
    SYNCS: '/syncs',
  },
  
  // Actions endpoints (no /api prefix)
  ACTIONS: {
    BASE: '/actions',
    TASKS: '/actions/tasks',
    TODO: '/actions/todo', // May not exist, keeping for backward compatibility
    FOLLOWUP: '/actions/followup', // May not exist, keeping for backward compatibility
  },
  
  // Classification endpoints (no /api prefix, no service name prefix)
  CLASSIFICATION: {
    BASE: '/classification',
    MESSAGES: '/messages', // Shared with integrations
    // Composite Swagger exposes classification at /classification/
    CLASSIFICATIONS: '/classification',
    BRIEFS: '/briefs',
    TASKS: '/classification/tasks', // May not exist, keeping for backward compatibility
  },
  
  // Composite dashboard (this one DOES use /api prefix)
  DASHBOARD: '/api/dashboard',
  
  // Authentication endpoints
  AUTH: {
    LOGIN_GOOGLE: '/auth/login/google',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  
  // External account connection endpoints
  EXTERNAL: {
    GMAIL: '/external/gmail',
  },
};


