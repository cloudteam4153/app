/**
 * API Service
 * 
 * This service provides functions to interact with the composite microservice.
 * All API calls are made to the composite microservice which then delegates
 * to the appropriate atomic microservices.
 */

import { API_BASE_URL, API_PATHS } from '../config/api.js';

/**
 * Helper function to make API requests
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} Response data
 */
// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let refreshPromise = null;

async function apiRequest(endpoint, options = {}, retryOn401 = true) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Enhanced debugging
  console.log('[API Debug] ==========================================');
  console.log('[API Debug] API_BASE_URL:', API_BASE_URL);
  console.log('[API Debug] endpoint:', endpoint);
  console.log('[API Debug] Full URL:', url);
  console.log('[API Debug] Is relative URL?', url.startsWith('http') ? 'NO (absolute)' : 'YES (relative - will use proxy)');
  console.log('[API Debug] ==========================================');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies in requests (important for authentication)
  };
  
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
    // Ensure credentials are included even if options override
    credentials: options.credentials !== undefined ? options.credentials : 'include',
  };
  
  try {
    console.log(`[API] Making ${config.method || 'GET'} request to: ${url}`, config.body ? { body: JSON.parse(config.body) } : '');
    
    // fetch() automatically follows redirects (307, 308) by default
    // We don't need to handle them manually
    const response = await fetch(url, config);
    
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryOn401 && endpoint !== API_PATHS.AUTH.REFRESH) {
        console.log('[API] Received 401, attempting to refresh token...');
        
        // If we're already refreshing, wait for that to complete
        if (isRefreshing && refreshPromise) {
          console.log('[API] Already refreshing, waiting for refresh to complete...');
          await refreshPromise;
          // Retry the original request after refresh
          return apiRequest(endpoint, options, false); // Don't retry again if this fails
        }
        
        // Start refresh process
        isRefreshing = true;
        refreshPromise = (async () => {
          try {
            await authAPI.refreshToken();
            console.log('[API] Token refresh successful');
          } catch (refreshError) {
            console.error('[API] Token refresh failed:', refreshError);
            throw refreshError;
          } finally {
            isRefreshing = false;
            refreshPromise = null;
          }
        })();
        
        try {
          await refreshPromise;
          // Retry the original request after successful refresh
          console.log('[API] Retrying original request after token refresh...');
          return apiRequest(endpoint, options, false); // Don't retry again if this fails
        } catch (refreshError) {
          // Refresh failed, throw the original 401 error
          console.error('[API] Token refresh failed, cannot retry request');
        }
      }
      
      // Try to get error details from response
      // Read as text first, then try to parse as JSON to avoid "body stream already read" error
      let errorMessage = response.statusText;
      let errorData = null;
      try {
        const text = await response.text();
        console.error(`[API] Error response text:`, text);
        // Try to parse as JSON
        try {
          errorData = JSON.parse(text);
          console.error(`[API] Error response data:`, errorData);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch (parseError) {
          // Not JSON, use text as error message
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        // If reading text fails, just use status text
        console.error(`[API] Could not read error response:`, e);
      }
      
      // Provide more helpful error messages for authentication errors
      if (response.status === 401) {
        if (errorMessage.includes('refresh token') || errorMessage.includes('Missing refresh token')) {
          errorMessage = 'Authentication required. Please log in to continue.';
        }
      }
      
      throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
    }
    
    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {};
    }
    
    const data = await response.json();
    console.log(`[API] Success response:`, data);
    return data;
  } catch (error) {
    console.error(`[API] Request failed for ${endpoint}:`, error);
    console.error(`[API] Error details:`, {
      message: error.message,
      stack: error.stack,
      url: url
    });
    throw error;
  }
}

/**
 * Authentication API
 */
export const authAPI = {
  /**
   * Refresh access and refresh tokens
   * @returns {Promise<Object>} Refresh result with status
   */
  refreshToken: () => apiRequest(API_PATHS.AUTH.REFRESH, {
    method: 'POST',
  }, false), // Don't retry refresh on 401 to avoid infinite loop
  
  /**
   * Get current user information
   * @returns {Promise<Object>} User data with user_id
   */
  getCurrentUser: () => apiRequest(API_PATHS.AUTH.ME),
  
  /**
   * Initiate Google OAuth login
   * @param {string} redirectUrl - Optional frontend URL to redirect to after OAuth
   * @returns {Promise<Object>} OAuth redirect URL with auth_url
   */
  loginWithGoogle: (redirectUrl) => {
    const url = redirectUrl 
      ? `${API_PATHS.AUTH.LOGIN_GOOGLE}?redirect=${encodeURIComponent(redirectUrl)}`
      : API_PATHS.AUTH.LOGIN_GOOGLE
    return apiRequest(url, {
      method: 'POST',
    })
  },
  
  /**
   * Connect Gmail account (requires authentication)
   * @returns {Promise<Object>} OAuth redirect URL with auth_url
   */
  connectGmail: () => apiRequest(API_PATHS.EXTERNAL.GMAIL, {
    method: 'POST',
  }),
};

/**
 * Health Check API
 */
export const healthAPI = {
  /**
   * Check health of composite service and all atomic services
   * @returns {Promise<Object>} Health status
   */
  check: () => apiRequest(API_PATHS.HEALTH),
};

/**
 * Integrations API
 */
export const integrationsAPI = {
  /**
   * List connections
   * @param {Object} params - Query parameters (skip, limit, provider, status, is_active)
   * @returns {Promise<Object>} List of connections
   */
  listConnections: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get connection by ID
   * @param {string} connectionId - Connection UUID
   * @returns {Promise<Object>} Connection data
   */
  getConnection: (connectionId) => apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}/${connectionId}`),
  
  /**
   * Create new connection
   * @param {Object} connectionData - Connection data
   * @returns {Promise<Object>} Created connection
   */
  createConnection: (connectionData) => 
    apiRequest(API_PATHS.INTEGRATIONS.CONNECTIONS, {
      method: 'POST',
      body: JSON.stringify(connectionData),
    }),
  
  /**
   * Update connection
   * @param {string} connectionId - Connection UUID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated connection
   */
  updateConnection: (connectionId, updateData) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete connection
   * @param {string} connectionId - Connection UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteConnection: (connectionId) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}/${connectionId}`, {
      method: 'DELETE',
    }),
  
  /**
   * Test connection
   * @param {string} connectionId - Connection UUID
   * @returns {Promise<Object>} Test result
   */
  testConnection: (connectionId) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}/${connectionId}/test`, {
      method: 'POST',
    }),
  
  /**
   * Refresh connection
   * @param {string} connectionId - Connection UUID
   * @returns {Promise<Object>} Refresh result
   */
  refreshConnection: (connectionId) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.CONNECTIONS}/${connectionId}/refresh`, {
      method: 'POST',
    }),
  
  /**
   * List messages
   * @param {Object} params - Query parameters (skip, limit, search, thread_id, etc.)
   * @returns {Promise<Object>} List of messages
   */
  listMessages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.INTEGRATIONS.MESSAGES}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get message by ID
   * @param {string} messageId - Message UUID
   * @returns {Promise<Object>} Message data
   */
  getMessage: (messageId) => apiRequest(`${API_PATHS.INTEGRATIONS.MESSAGES}/${messageId}`),
  
  /**
   * Create new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  createMessage: (messageData) =>
    apiRequest(API_PATHS.INTEGRATIONS.MESSAGES, {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
  
  /**
   * Update message
   * @param {string} messageId - Message UUID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated message
   */
  updateMessage: (messageId, updateData) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.MESSAGES}/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete message
   * @param {string} messageId - Message UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteMessage: (messageId) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.MESSAGES}/${messageId}`, {
      method: 'DELETE',
    }),
  
  /**
   * Bulk delete messages
   * @param {Array<string>} messageIds - Array of message UUIDs
   * @returns {Promise<Object>} Deletion result
   */
  bulkDeleteMessages: (messageIds) => {
    // Composite service expects message_ids as repeated query parameters
    // FastAPI List[UUID] = Query(...) expects ?message_ids=uuid1&message_ids=uuid2
    const params = new URLSearchParams();
    messageIds.forEach(id => params.append('message_ids', id));
    return apiRequest(`${API_PATHS.INTEGRATIONS.MESSAGES}?${params.toString()}`, {
      method: 'DELETE',
    });
  },
  
  /**
   * List syncs
   * @param {Object} params - Query parameters (skip, limit, status, sync_type, etc.)
   * @returns {Promise<Object>} List of syncs
   */
  listSyncs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.INTEGRATIONS.SYNCS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get sync by ID
   * @param {string} syncId - Sync UUID
   * @returns {Promise<Object>} Sync data
   */
  getSync: (syncId) => apiRequest(`${API_PATHS.INTEGRATIONS.SYNCS}/${syncId}`),
  
  /**
   * Get sync status
   * @param {string} syncId - Sync UUID
   * @returns {Promise<Object>} Sync status
   */
  getSyncStatus: (syncId) => apiRequest(`${API_PATHS.INTEGRATIONS.SYNCS}/${syncId}/status`),
  
  /**
   * Create new sync
   * @param {Object} syncData - Sync data
   * @returns {Promise<Object>} Created sync
   */
  createSync: (syncData) =>
    apiRequest(API_PATHS.INTEGRATIONS.SYNCS, {
      method: 'POST',
      body: JSON.stringify(syncData),
    }),
  
  /**
   * Update sync
   * @param {string} syncId - Sync UUID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated sync
   */
  updateSync: (syncId, updateData) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.SYNCS}/${syncId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete sync
   * @param {string} syncId - Sync UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteSync: (syncId) =>
    apiRequest(`${API_PATHS.INTEGRATIONS.SYNCS}/${syncId}`, {
      method: 'DELETE',
    }),
};

/**
 * Actions API
 */
export const actionsAPI = {
  /**
   * List tasks
   * @param {Object} params - Query parameters (user_id, status, priority)
   * @returns {Promise<Object>} List of tasks
   */
  listTasks: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.ACTIONS.TASKS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get task by ID
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Task data
   */
  getTask: (taskId) => apiRequest(`${API_PATHS.ACTIONS.TASKS}/${taskId}`),
  
  /**
   * Create new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  createTask: (taskData) =>
    apiRequest(API_PATHS.ACTIONS.TASKS, {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  /**
   * Update task
   * @param {number} taskId - Task ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  updateTask: (taskId, updateData) =>
    apiRequest(`${API_PATHS.ACTIONS.TASKS}/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete task
   * @param {number} taskId - Task ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteTask: (taskId) =>
    apiRequest(`${API_PATHS.ACTIONS.TASKS}/${taskId}`, {
      method: 'DELETE',
    }),
  
  /**
   * Create tasks from messages (batch)
   * @param {Array} messages - Array of message objects
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Created tasks
   */
  createTasksFromMessages: (messages, userId) =>
    apiRequest(`${API_PATHS.ACTIONS.TASKS}/batch?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(messages),
    }),
  
  /**
   * List todos
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @returns {Promise<Object>} List of todos
   */
  listTodos: () => apiRequest(API_PATHS.ACTIONS.TODO),
  
  /**
   * Get todo by ID
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} todoId - Todo ID
   * @returns {Promise<Object>} Todo data
   */
  getTodo: (todoId) => apiRequest(`${API_PATHS.ACTIONS.TODO}/${todoId}`),
  
  /**
   * Create new todo
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {Object} todoData - Todo data
   * @returns {Promise<Object>} Created todo
   */
  createTodo: (todoData) =>
    apiRequest(API_PATHS.ACTIONS.TODO, {
      method: 'POST',
      body: JSON.stringify(todoData),
    }),
  
  /**
   * Update todo
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} todoId - Todo ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated todo
   */
  updateTodo: (todoId, updateData) =>
    apiRequest(`${API_PATHS.ACTIONS.TODO}/${todoId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete todo
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} todoId - Todo ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteTodo: (todoId) =>
    apiRequest(`${API_PATHS.ACTIONS.TODO}/${todoId}`, {
      method: 'DELETE',
    }),
  
  /**
   * List followups
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @returns {Promise<Object>} List of followups
   */
  listFollowups: () => apiRequest(API_PATHS.ACTIONS.FOLLOWUP),
  
  /**
   * Get followup by ID
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} followupId - Followup ID
   * @returns {Promise<Object>} Followup data
   */
  getFollowup: (followupId) => apiRequest(`${API_PATHS.ACTIONS.FOLLOWUP}/${followupId}`),
  
  /**
   * Create new followup
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {Object} followupData - Followup data
   * @returns {Promise<Object>} Created followup
   */
  createFollowup: (followupData) =>
    apiRequest(API_PATHS.ACTIONS.FOLLOWUP, {
      method: 'POST',
      body: JSON.stringify(followupData),
    }),
  
  /**
   * Update followup
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} followupId - Followup ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated followup
   */
  updateFollowup: (followupId, updateData) =>
    apiRequest(`${API_PATHS.ACTIONS.FOLLOWUP}/${followupId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete followup
   * @deprecated NOT IMPLEMENTED - Returns 501
   * @param {number} followupId - Followup ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteFollowup: (followupId) =>
    apiRequest(`${API_PATHS.ACTIONS.FOLLOWUP}/${followupId}`, {
      method: 'DELETE',
    }),
};

/**
 * Classification API
 */
export const classificationAPI = {
  /**
   * List messages
   * @param {Object} params - Query parameters (channel, sender, limit)
   * @returns {Promise<Object>} List of messages
   */
  listMessages: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.CLASSIFICATION.MESSAGES}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get message by ID
   * @param {string} messageId - Message UUID
   * @returns {Promise<Object>} Message data
   */
  getMessage: (messageId) => apiRequest(`${API_PATHS.CLASSIFICATION.MESSAGES}/${messageId}`),
  
  /**
   * Create new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} Created message
   */
  createMessage: (messageData) =>
    apiRequest(API_PATHS.CLASSIFICATION.MESSAGES, {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
  
  /**
   * List classifications
   * @param {Object} params - Query parameters (label, min_priority, max_priority)
   * @returns {Promise<Array>} List of classifications (array directly)
   */
  listClassifications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.CLASSIFICATION.CLASSIFICATIONS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get classification by ID
   * @param {string} classificationId - Classification UUID
   * @returns {Promise<Object>} Classification data
   */
  getClassification: (classificationId) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.CLASSIFICATIONS}/${classificationId}`),
  
  /**
   * Classify messages
   * @param {Object} classificationRequest - Classification request data with message_ids array
   * @returns {Promise<Object>} ClassificationResponse with classifications array, total_processed, success_count, error_count
   */
  classifyMessages: (classificationRequest) =>
    apiRequest(API_PATHS.CLASSIFICATION.CLASSIFICATIONS, {
      method: 'POST',
      body: JSON.stringify(classificationRequest),
    }),
  
  /**
   * Update classification
   * @param {string} classificationId - Classification UUID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated classification
   */
  updateClassification: (classificationId, updateData) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.CLASSIFICATIONS}/${classificationId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete classification
   * @param {string} classificationId - Classification UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteClassification: (classificationId) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.CLASSIFICATIONS}/${classificationId}`, {
      method: 'DELETE',
    }),
  
  /**
   * List briefs
   * @param {Object} params - Query parameters (user_id, brief_date)
   * @returns {Promise<Array>} List of briefs (array directly)
   */
  listBriefs: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.CLASSIFICATION.BRIEFS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get brief by ID
   * @param {string} briefId - Brief UUID
   * @returns {Promise<Object>} Brief data
   */
  getBrief: (briefId) => apiRequest(`${API_PATHS.CLASSIFICATION.BRIEFS}/${briefId}`),
  
  /**
   * Create brief
   * @param {Object} briefRequest - Brief request data { user_id: UUID, date?: string (YYYY-MM-DD), max_items?: int }
   * @returns {Promise<Object>} Created brief (BriefRead with items array)
   */
  createBrief: (briefRequest) =>
    apiRequest(API_PATHS.CLASSIFICATION.BRIEFS, {
      method: 'POST',
      body: JSON.stringify(briefRequest),
    }),
  
  /**
   * Delete brief
   * @param {string} briefId - Brief UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteBrief: (briefId) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.BRIEFS}/${briefId}`, {
      method: 'DELETE',
    }),
  
  /**
   * List tasks (from classification service - uses UUID, due_date, priority 1-10)
   * @param {Object} params - Query parameters (user_id: UUID, status, priority, limit)
   * @returns {Promise<Array>} List of tasks (array directly)
   */
  listTasks: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`${API_PATHS.CLASSIFICATION.TASKS}${queryString ? `?${queryString}` : ''}`);
  },
  
  /**
   * Get task by ID
   * @param {string} taskId - Task UUID
   * @returns {Promise<Object>} Task data
   */
  getTask: (taskId) => apiRequest(`${API_PATHS.CLASSIFICATION.TASKS}/${taskId}`),
  
  /**
   * Create new task
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Created task
   */
  createTask: (taskData) =>
    apiRequest(API_PATHS.CLASSIFICATION.TASKS, {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),
  
  /**
   * Update task
   * @param {string} taskId - Task UUID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated task
   */
  updateTask: (taskId, updateData) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.TASKS}/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),
  
  /**
   * Delete task
   * @param {string} taskId - Task UUID
   * @returns {Promise<Object>} Deletion result
   */
  deleteTask: (taskId) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.TASKS}/${taskId}`, {
      method: 'DELETE',
    }),
  
  /**
   * Generate tasks from classifications
   * @param {Object} taskGenerationRequest - Task generation request data { classification_ids: UUID[], user_id: UUID }
   * @returns {Promise<Object>} TaskGenerationResponse with tasks array, total_generated, success_count, error_count
   */
  generateTasks: (taskGenerationRequest) =>
    apiRequest(`${API_PATHS.CLASSIFICATION.TASKS}/generate`, {
      method: 'POST',
      body: JSON.stringify(taskGenerationRequest),
    }),
};

/**
 * Composite Dashboard API
 */
export const dashboardAPI = {
  /**
   * Get dashboard data (parallel execution of health checks)
   * @returns {Promise<Object>} Dashboard data with all service health statuses
   */
  getDashboard: () => apiRequest(API_PATHS.DASHBOARD),
};

// Export all APIs as a single object for convenience
export default {
  health: healthAPI,
  integrations: integrationsAPI,
  actions: actionsAPI,
  classification: classificationAPI,
  dashboard: dashboardAPI,
};

