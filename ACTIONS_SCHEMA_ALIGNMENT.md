# Actions Service Schema Alignment

After examining the ms3 actions microservice and composite service, here are the key findings:

## Key Findings

### 1. Tasks
- **user_id**: `int` (not UUID) - required for all task operations
- **task_id**: `int` (not UUID)
- **Status**: Enum - `"open"` or `"done"`
- **Priority**: `int` (1-5, where 1 is highest priority)
- **Response Format**: `List[TaskResponse]` directly (array)

#### TaskCreate Schema:
```python
{
    "user_id": int,
    "source_msg_id": int,
    "title": str,
    "status": "open" | "done" (default: "open"),
    "due_at": datetime | None,
    "priority": int (1-5),
    "message_type": "email" | "slack",
    "sender": str,
    "subject": str | None
}
```

#### TaskResponse Schema:
```python
{
    "task_id": int,
    "user_id": int,
    "source_msg_id": int,
    "title": str,
    "status": "open" | "done",
    "due_at": datetime | None,
    "priority": int,
    "message_type": "email" | "slack",
    "sender": str,
    "subject": str | None,
    "created_at": datetime,
    "updated_at": datetime
}
```

#### TaskUpdate Schema:
```python
{
    "title": str | None,
    "status": "open" | "done" | None,
    "due_at": datetime | None,
    "priority": int (1-5) | None
}
```

### 2. Batch Task Creation
- **Endpoint**: `POST /api/actions/tasks/batch?user_id={int}`
- **Body**: `List[dict]` - array of message objects
- **Response**: `List[TaskResponse]` (201 status)

### 3. Todo Endpoints
- **Status**: All return 501 (Not Implemented)
- **Note**: Should not be used in UI until implemented

### 4. Followup Endpoints
- **Status**: All return 501 (Not Implemented)
- **Note**: Should not be used in UI until implemented

## Required UI Updates

1. ✅ **User ID Type**: Change from UUID to int (need to map test user UUID to int or use a test int)
2. ✅ **Task ID Type**: Use int (not UUID)
3. ✅ **DailyBrief**: Fetch and display tasks in appropriate sections
4. ✅ **Task Status Mapping**: Map tasks to sections:
   - Overdue: status="open" AND due_at < now
   - Todo: status="open" AND (due_at is None OR due_at >= now)
   - Follow-up: Not available (endpoint not implemented)
5. ✅ **Response Format**: Expect arrays directly (not wrapped)

## Task Section Logic

- **Overdue**: Tasks with `status="open"` and `due_at < current_date`
- **Todo**: Tasks with `status="open"` and (`due_at` is None or `due_at >= current_date`)
- **Follow-up**: Cannot be implemented (endpoint returns 501)

## Notes

- The test user UUID from integrations service is: `0283b6a0-f665-4041-bb21-75e5556835fc`
- Need to determine if there's a corresponding int user_id or use a different test user_id
- Tasks are linked to messages via `source_msg_id` (int, not UUID)

