/**
 * API Configuration
 * 
 * This file contains the base URL for the integrations microservice.
 * Currently configured to connect directly to the deployed integrations service (ms2).
 * When other services are ready, switch back to composite service.
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

// In development, use relative URLs (goes through Vite proxy)
// In production, use full URLs to the deployed services
const INTEGRATIONS_MS_IP = import.meta.env.VITE_API_HOST || '35.188.76.100';
const INTEGRATIONS_MS_PORT = import.meta.env.VITE_API_PORT || '8000';

export const API_BASE_URL = isDevelopment 
  ? '' // Empty string = relative URLs, will use Vite proxy
  : `http://${INTEGRATIONS_MS_IP}:${INTEGRATIONS_MS_PORT}`;

// Debug logging (only in development)
if (isDevelopment) {
  console.log('[API Config] Development mode detected');
  console.log('[API Config] API_BASE_URL:', API_BASE_URL);
  console.log('[API Config] Using Vite proxy for API requests');
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
// Note: Direct paths to integrations service (no /api/integrations prefix)
export const API_PATHS = {
  // Health check
  HEALTH: '/health',
  
  // Integrations endpoints (direct paths, no composite prefix)
  INTEGRATIONS: {
    BASE: '',
    CONNECTIONS: '/connections',
    MESSAGES: '/messages',
    SYNCS: '/syncs',
  },
  
  // Actions endpoints
  ACTIONS: {
    BASE: '/api/actions',
    TASKS: '/api/actions/tasks',
    TODO: '/api/actions/todo',
    FOLLOWUP: '/api/actions/followup',
  },
  
  // Classification endpoints
  CLASSIFICATION: {
    BASE: '/api/classification',
    MESSAGES: '/api/classification/messages',
    CLASSIFICATIONS: '/api/classification/classifications',
    BRIEFS: '/api/classification/briefs',
    TASKS: '/api/classification/tasks',
  },
  
  // Composite dashboard
  DASHBOARD: '/api/composite/dashboard',
};


