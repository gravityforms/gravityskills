# Entry Operations Reference

## Input Value Formatting

### For `submissions-submit` (like a browser POST)

Key format: `input_{field_id}` for simple fields, `input_{field_id}.{suffix}` for compound fields.

```json
{
  "form_id": 1,
  "input_values": {
    "input_1": "Hello",
    "input_5.3": "John",
    "input_5.6": "Doe",
    "input_8": "john@example.com"
  }
}
```

### For `entries-create` (raw database insert)

Key format: `"{field_id}"` for simple fields, `"{field_id}.{suffix}"` for compound fields.

```json
{
  "entry": {
    "form_id": 1,
    "1": "Hello",
    "5.3": "John",
    "5.6": "Doe",
    "8": "john@example.com"
  }
}
```

**These are different formats.** `submissions-submit` prefixes with `input_`. `entries-create` uses bare field IDs.

### Checkbox Values

Each checked choice is a separate input keyed by choice index (starting at 1):

```json
{
  "input_4.1": "choice_value_1",
  "input_4.3": "choice_value_3"
}
```

Only include checked values — omit unchecked choices entirely.

## Entry Search

### Filter Operators

`is`, `isnot`, `contains`, `>`, `<`, `>=`, `<=`

The `contains` operator does literal substring matching (SQL LIKE). It is **not** stemmed — "involved" will not match "involve."

### Special Filter Keys (Entry Meta)

`date_created`, `date_updated`, `created_by`, `ip`, `source_url`, `status`, `is_starred`, `is_read`

### All-Field Text Search

Use `key: "0"` to search across ALL field values in a single filter:

```json
{ "key": "0", "value": "involved", "operator": "contains" }
```

This searches every field on every entry — no need to know specific field IDs. Use this when the user asks to "find entries that mention X" without specifying which field.

**Note:** Multiple `field_filters` default to AND logic. Use `field_filters_mode: "any"` in search_criteria for OR logic:

```json
{
  "search_criteria": {
    "field_filters": [
      { "key": "4", "value": "volunteer", "operator": "contains" },
      { "key": "5", "value": "involved", "operator": "contains" }
    ],
    "field_filters_mode": "any"
  }
}
```

`"all"` (default) = every filter must match. `"any"` = at least one filter must match.

### Search Example

```json
{
  "form_ids": 1,
  "search_criteria": {
    "status": "active",
    "field_filters": [
      { "key": "1", "value": "John", "operator": "contains" },
      { "key": "created_by", "value": "1", "operator": "is" }
    ],
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  },
  "sorting": { "key": "date_created", "direction": "DESC" },
  "paging": { "offset": 0, "page_size": 20 }
}
```

### Date Filtering

`start_date` and `end_date` accept two formats:
- Date only: `"2025-01-01"`
- Full datetime: `"2025-01-01 00:00:00"`

Both work identically. Date-only is simpler when you don't need time precision.

### Pagination Pattern

For large result sets:

1. Call `entries-count` to get total
2. Calculate pages: `total / page_size`
3. Iterate with `paging.offset` increments of `page_size`
4. Max `page_size` is 100

## Bulk Entry Deletion

`entries-delete` supports bulk mode — pass `form_id` instead of `entry_id` to delete all entries for a form server-side.

### Delete all entries for one form

```json
{
  "form_id": 5
}
```

Returns: `{ "success": true, "deleted_count": 47, "trashed": true, "remaining": 0, "capped": false, "cap": 100 }`

### Per-call cap (100 entries)

Bulk calls process at most 100 entries per call to avoid server timeouts. When more entries match:

- `capped: true` and `remaining > 0` are returned
- Loop: call `entries-count` for the updated count, then `entries-delete` again, until `remaining` is 0
- **Force mode**: each loop iteration needs a fresh confirmation phrase built from the updated count (`DELETE {count} ENTRIES FROM FORM {form_id}`)
- **Trash mode**: already-trashed entries are excluded automatically, so each call picks up where the last one left off; filtering on `status: "trash"` with trash mode is a no-op (`deleted_count: 0`)

### Delete with filter (e.g., only entries before a date)

```json
{
  "form_id": 5,
  "search_criteria": {
    "end_date": "2026-03-31 23:59:59"
  }
}
```

### Delete all entries across all forms

1. Call `forms-list` → get all form IDs
2. For each form, call `entries-delete` with `form_id`

This is N calls (one per form), not N×M (one per entry).

### ⚠️ Destructive Operations — Confirm First

**Always preview before bulk deleting.** Call `entries-count` with the same `form_id` and `search_criteria` first to show the user how many entries will be deleted. Wait for explicit confirmation before calling `entries-delete`.

```
Agent: "Form 5 has 47 entries matching your criteria. Delete all 47? This cannot be undone."
User: "Yes, go ahead."
Agent: [calls entries-delete]
```

## Notification Resend

### Find Entry → Resend Notification Workflow

When a user asks to resend a notification for a specific entry (e.g., "resend the confirmation email to the parent who submitted last Tuesday"):

1. **Find the form**: `forms-list` with `search` to identify the form by name
2. **Find the entry**: `entries-search` with `start_date`/`end_date` to narrow by date, plus `field_filters` if you have identifying info (name, email)
3. **Discover notifications**: `notifications-list` with `form_id` to see available notifications and their IDs
4. **Resend**: `notifications-send` with `form_id`, `entry_id`, and optionally `notification_ids` to target specific notifications

### Example: Resend confirmation from last Tuesday

```json
// Step 1: Find form
{ "ability": "gravityforms/forms-list", "params": { "search": "uniform order" } }

// Step 2: Search entries by date range (Tuesday to Tuesday)
{ "ability": "gravityforms/entries-search", "params": {
  "form_ids": 307,
  "search_criteria": { "start_date": "2026-03-31", "end_date": "2026-03-31" },
  "sorting": { "key": "date_created", "direction": "DESC" }
}}

// Step 3: List notifications to find the right one
{ "ability": "gravityforms/notifications-list", "params": { "form_id": 307 } }

// Step 4: Resend specific notification to specific entry
{ "ability": "gravityforms/notifications-send", "params": {
  "form_id": 307,
  "entry_id": 663,
  "notification_ids": ["6151b6f3c121b"]
}}
```

### Tips

- If `notification_ids` is omitted, ALL active notifications for that form are sent — use `notifications-list` first to target the right one.
- `notifications-send` uses the **current** form notification config — if the notification was modified since the entry was created, the updated version is sent.
- Notifications respect conditional logic — if the entry doesn't match the notification's conditions, it won't send.

## Data Availability — What GF Does NOT Track

**Validation failures / form abandonment:** GF only stores entries on successful submission (all validation passes). Failed attempts — where a user hits Submit with empty required fields — are not recorded. There is no data on which fields cause the most validation failures, abandonment rates, or partial completion patterns.

If a user asks "which required fields are people skipping?" or "why are we getting incomplete submissions?", explain that this data doesn't exist in GF. Suggest:
- The **Partial Entries** add-on (captures field data on page changes and form abandonment)
- Client-side analytics (JS-based field interaction tracking)
- `submissions-validate` for one-off dry-run validation of a specific input set (not historical data)
