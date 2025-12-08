# Schema Alignment with Integrations Service

After examining the integrations-svc-ms2 source code, here are the key findings and required UI updates:

## Key Findings

### 1. Connection Creation
- **Required Fields**: `user_id` (UUID), `provider` (string)
- **Response**: `ConnectionInitiateResponse` with `auth_url` field (not `oauth_url`)
- **Status Code**: 201
- **Note**: The UI currently doesn't send `user_id` - this needs to be fixed

### 2. Sync Creation  
- **Required Fields**: `connection_id` (UUID), `user_id` (UUID), `sync_type` (enum: "full", "incremental", "manual")
- **Response**: `SyncRead` with status PENDING initially
- **Status Code**: 202 (Accepted - async operation)
- **Note**: The UI currently doesn't send `user_id` - this needs to be fixed

### 3. Messages
- **Response Format**: `List[MessageRead]` directly (not wrapped in object)
- **Key Fields**: 
  - `snippet` (not `preview`)
  - `external_id` (Gmail message ID)
  - `raw` (base64-encoded full message)
  - `user_id` (not `connection_id` - messages are user-scoped)
- **No `from`, `subject`, `body` fields** - these are in the `raw` field which needs parsing
- **Filtering**: No `connection_id` filter - messages are filtered by `user_id` only

### 4. Connections
- **Response Format**: `List[ConnectionRead]` directly
- **Key Fields**:
  - `id`, `user_id`, `provider`, `status`, `is_active`
  - `created_at`, `updated_at`, `access_token_expiry`
  - `last_error`
  - No `email` field - use `provider_account_id` if available

### 5. Bulk Delete Messages
- **Status Code**: 204 (No Content)
- **Query Parameters**: `message_ids` as repeated query params (correctly implemented)

## Required UI Updates

1. ✅ **Connection Creation**: Add `user_id` to request (need user context)
2. ✅ **Sync Creation**: Add `user_id` to request (need user context)  
3. ✅ **Message Display**: Parse `raw` field for `from`, `subject`, `body` OR use `snippet` for preview
4. ✅ **Response Handling**: Update to expect arrays directly, not wrapped objects
5. ✅ **Connection Display**: Use `provider_account_id` instead of `email` if needed

## Authentication Context

**Critical Issue**: The integrations service uses `validate_session` dependency which requires:
- Session token/authentication
- `current_user: UserRead` object

The UI currently doesn't send any authentication. This needs to be addressed:
- Either add session management
- Or the composite service needs to handle authentication differently
- Or use a default/test user_id for now

