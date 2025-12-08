# Classification Service Schema Alignment

After examining the ms4-classification service and composite service, here are the key findings:

## Key Findings

### 1. Classifications
- **Response Format**: `List[ClassificationRead]` directly (array)
- **Fields**: `cls_id` (UUID), `msg_id` (UUID), `label` (enum: "todo", "followup", "noise"), `priority` (1-10), `created_at`
- **Classification Request**: `{ message_ids: List[UUID] }`
- **Classification Response**: `{ classifications: List[ClassificationRead], total_processed, success_count, error_count }`

### 2. Briefs
- **Response Format**: `List[BriefRead]` directly (array)
- **Brief Request**: `{ user_id: UUID, date?: string (YYYY-MM-DD), max_items?: int }`
- **Brief Fields**: 
  - `brief_id`, `user_id`, `brief_date`, `total_items`, `high_priority_count`, `todo_count`, `followup_count`
  - `items: List[BriefItem]` with: `classification_id`, `message_id`, `title`, `description`, `priority_score`, `channel`, `sender`, `received_at`, `extracted_tasks`
- **Use Case**: Daily briefs that aggregate classified messages

### 3. Tasks (Classification Service)
- **user_id**: `UUID` (not int like actions service)
- **task_id**: `UUID` (not int)
- **Status**: Enum - `"open"` or `"done"`
- **Priority**: `int` (1-10, not 1-5 like actions service)
- **due_date**: `date` (not `due_at` datetime)
- **Response Format**: `List[TaskRead]` directly (array)

#### TaskCreate Schema:
```python
{
    "user_id": UUID,
    "source_message_id": UUID | None,
    "title": str,
    "status": "open" | "done" (default: "open"),
    "due_date": date | None,
    "priority": int (1-10),
    "description": str | None
}
```

#### TaskRead Schema:
```python
{
    "task_id": UUID,
    "user_id": UUID,
    "source_message_id": UUID | None,
    "title": str,
    "status": "open" | "done",
    "due_date": date | None,
    "priority": int (1-10),
    "description": str | None,
    "created_at": datetime
}
```

### 4. Task Generation
- **Endpoint**: `POST /api/classification/tasks/generate`
- **Request**: `{ classification_ids: List[UUID], user_id: UUID }`
- **Response**: `{ tasks: List[TaskRead], total_generated, success_count, error_count }`

### 5. Messages (Classification Service)
- **Response Format**: `List[MessageRead]` directly (array)
- **Fields**: `msg_id` (UUID), `account_id` (UUID), `external_id`, `channel` ("gmail" | "slack"), `sender`, `subject`, `snippet`, `received_at`, `raw_ref`, `priority`, `created_at`
- **Note**: These are different from integrations service messages - used for classification

## Required UI Updates

1. ✅ **Briefs Integration**: Add ability to create and display daily briefs
2. ✅ **Classifications**: Add ability to classify messages
3. ✅ **Task Generation**: Add ability to generate tasks from classifications
4. ✅ **Task Schema Differences**: Note that classification tasks use UUID and different field names
5. ✅ **Response Format**: Expect arrays directly (not wrapped)

## Important Notes

- **Two Task Services**: 
  - Actions service (`/api/actions/tasks`) uses `int` IDs and `due_at` datetime
  - Classification service (`/api/classification/tasks`) uses `UUID` IDs and `due_date` date
- **Briefs**: New concept - daily briefs that can be generated from classifications
- **Priority Scale**: Classification service uses 1-10, actions service uses 1-5

