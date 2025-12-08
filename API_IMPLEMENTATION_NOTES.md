# API Implementation Notes

This document compares the UI implementation with the composite microservice endpoints to ensure alignment.

## Current Status

The UI implementation **partially** uses the composite microservice as the source of truth, but there are some discrepancies and assumptions that need to be addressed.

## Endpoint-by-Endpoint Comparison

### Connections

#### ✅ `GET /api/integrations/connections`
- **Composite Service**: Accepts `skip`, `limit`, `provider`, `status`, `is_active` as query params
- **UI Implementation**: ✅ Correctly uses all these parameters
- **Response Format**: Assumed to be array or object with `items` property (defensive coding)

#### ✅ `POST /api/integrations/connections`
- **Composite Service**: Accepts `connection_data: dict` (no specific schema defined)
- **UI Implementation**: Sends `{ provider: 'gmail' }`
- **Issue**: ⚠️ Unknown if additional fields are required (e.g., `user_id`, `email`, etc.)
- **Note**: The composite service delegates to atomic service, so exact schema is unknown

#### ✅ `DELETE /api/integrations/connections/{connection_id}`
- **Composite Service**: Accepts UUID path parameter
- **UI Implementation**: ✅ Correctly uses UUID

#### ✅ `POST /api/integrations/connections/{connection_id}/test`
- **Composite Service**: Accepts UUID path parameter, no body
- **UI Implementation**: ✅ Correctly implemented

#### ✅ `POST /api/integrations/connections/{connection_id}/refresh`
- **Composite Service**: Accepts UUID path parameter, no body
- **UI Implementation**: ✅ Correctly implemented

### Messages

#### ⚠️ `GET /api/integrations/messages`
- **Composite Service**: Accepts:
  - `skip`, `limit`, `sort_by`, `sort_order` (required/defaults)
  - `search`, `thread_id`, `label_ids`, `external_id`, `created_after`, `created_before`, `has_raw` (optional)
- **UI Implementation**: 
  - ✅ Uses `limit`, `sort_by`, `sort_order`
  - ❌ **Does NOT use `connection_id` filter** (not supported by composite service)
  - **Workaround**: Fetches all messages and filters client-side in `AccountInbox.jsx`
- **Issue**: No way to filter messages by connection through the API

#### ✅ `GET /api/integrations/messages/{message_id}`
- **Composite Service**: Accepts UUID path parameter
- **UI Implementation**: ✅ Correctly uses UUID

#### ✅ `DELETE /api/integrations/messages/{message_id}`
- **Composite Service**: Accepts UUID path parameter
- **UI Implementation**: ✅ Correctly uses UUID

#### ✅ `DELETE /api/integrations/messages` (Bulk Delete)
- **Composite Service**: Accepts `message_ids: List[UUID] = Query(...)` as repeated query parameters
- **UI Implementation**: ✅ Now correctly implemented using `URLSearchParams.append()` for repeated params
- **Format**: `?message_ids=uuid1&message_ids=uuid2&message_ids=uuid3`

### Syncs

#### ⚠️ `POST /api/integrations/syncs`
- **Composite Service**: Accepts `sync_data: dict` with:
  - `connection_id` (required, based on validation)
  - `user_id` (optional, validated if provided)
  - `sync_type` (assumed, not explicitly documented)
- **UI Implementation**: Sends `{ connection_id, sync_type: 'incremental' }`
- **Issue**: ⚠️ `user_id` is not being sent. The validation only runs if both are present, so this should work, but may be required by the atomic service.

#### ✅ `GET /api/integrations/syncs`
- **Composite Service**: Accepts `skip`, `limit`, `status`, `sync_type`, `connection_id`, `created_after`, `created_before`, `sort_by`, `sort_order`
- **UI Implementation**: Not currently used, but API service supports all parameters

## Response Format Assumptions

The UI makes defensive assumptions about response formats:

1. **List endpoints**: Handles both:
   - Direct array: `[{...}, {...}]`
   - Paginated object: `{ items: [...], total: 123 }`

2. **Connection fields**: Assumes fields like:
   - `id`, `provider`, `email`, `external_id`, `is_active`, `status`, `last_synced_at`
   - These are not documented in the composite service (delegates to atomic service)

3. **Message fields**: Assumes fields like:
   - `id`, `from`, `sender`, `subject`, `body`, `raw`, `preview`, `created_at`, `is_read`, `thread_id`, `connection_id`
   - These are not documented in the composite service

## Known Issues & Recommendations

### 1. Connection Creation Schema
**Issue**: Unknown required fields for `POST /api/integrations/connections`
**Recommendation**: 
- Check the atomic integrations service schema
- Or test with minimal payload and handle errors
- May need `user_id` or other fields

### 2. Sync Creation - user_id
**Issue**: `user_id` may be required by atomic service even if composite doesn't validate it
**Recommendation**:
- Check if user context is available in the UI
- If not, the atomic service may use a default or require authentication

### 3. Message Filtering by Connection
**Issue**: No `connection_id` filter in `GET /api/integrations/messages`
**Current Workaround**: Fetch all and filter client-side
**Recommendation**:
- This is inefficient for large datasets
- Consider adding `connection_id` filter to composite service
- Or use a different approach (e.g., fetch per connection)

### 4. Response Format Documentation
**Issue**: Response formats are not documented in composite service
**Recommendation**:
- Add response models/schemas to composite service
- Or document expected formats in README
- Or inspect actual responses and document

## Next Steps

1. ✅ **Fixed**: Bulk delete now uses proper query parameter format
2. ⚠️ **To Do**: Verify connection creation payload requirements
3. ⚠️ **To Do**: Verify if `user_id` is needed for sync creation
4. ⚠️ **To Do**: Document or standardize response formats
5. ⚠️ **To Do**: Consider adding `connection_id` filter to messages endpoint

## Testing Recommendations

When the VM IP is available, test:
1. Connection creation with minimal payload
2. Sync creation without `user_id`
3. Message filtering performance with large datasets
4. Response format consistency across endpoints

