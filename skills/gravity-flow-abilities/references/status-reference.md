# Status Vocabulary, Assignee Keys, and Meta-Key Escape Hatch

## Workflow final status (`final_status`)

| Value | Meaning |
|---|---|
| `pending` | Workflow in flight — a current step exists |
| `cancelled` | Workflow cancelled — assignees purged, entry retained |
| `complete` | Finished; final step was a non-decision step (e.g. user input) |
| `approved` | Finished; final step was an approval that was approved |
| `rejected` | Finished; final step was an approval that was rejected |

Key fact (verified against live behavior): on completion, Flow records the **final step's status** as the workflow status. Agents must treat `approved`, `rejected`, and `complete` all as terminal. `current_step` is `null` for any terminal status and also before the workflow starts.

A rejected approval does not necessarily end the workflow — reject destinations can route to earlier steps or alternate branches. Read `workflow-status-get` after acting rather than assuming.

## Step statuses

| Value | Meaning |
|---|---|
| `queued` | Step not reached yet |
| `pending` | Step active, waiting on assignees |
| `complete` | Step finished (user input completed, notification sent, feed processed…) |
| `approved` / `rejected` | Approval step outcome |
| `revert` | Approval reverted to a user-input step for changes |

## Per-assignee statuses

Within a pending step, each assignee has their own status (`pending`, `approved`, `rejected`, `complete`). Multi-assignee approval steps combine them by policy (all must approve / any one approves) — one assignee's `approved` with the step still `pending` means the policy is "all." `workflow-status-get` returns the live list: `assignees[] { key, display_name, status }`.

## Assignee key format

`type|id`:

| Key | Resolves to |
|---|---|
| `user_id|5` | WordPress user ID 5 |
| `role|approver` | Every user with the role |
| `email|pat@example.com` | An email address (may have no WP account) |

Step *configurations* may also use field-resolved types (`assignee_field`, `assignee_user_field`, `email_field`) that resolve per entry at runtime — which is why `steps-get` shows configured assignees but only `workflow-status-get` shows an entry's actual ones.

**Email assignees** act through signed token links embedded in notification emails. They never authenticate to WordPress, so no MCP credential corresponds to them. An agent cannot act *as* an email assignee — only a workflow admin can act *on behalf of* one via delegated `steps-process` with `assignee_key: "email|..."`.

## Workflow entry meta keys (escape hatch)

When `status-search` filters aren't expressive enough, these meta keys work as `field_filters` keys in `gravityforms/entries-search`:

| Key | Value |
|---|---|
| `workflow_final_status` | Final status (table above) |
| `workflow_step` | Current step ID (integer) |
| `workflow_step_status_{step_id}` | That step's status for the entry |
| `workflow_user_id_{user_id}` | Per-assignee status when user {id} is/was an assignee |
| `workflow_role_{role}` | Per-assignee status for a role assignee |
| `workflow_email_{email}` | Per-assignee status for an email assignee |
| `workflow_timestamp` | Unix timestamp the current step started |

Example — all entries stuck on step 41 in form 3:

```json
{
  "form_id": 3,
  "search_criteria": {
    "field_filters": [
      { "key": "workflow_step", "value": "41" }
    ]
  }
}
```

Example — everything user 7 has ever approved on form 3:

```json
{
  "form_id": 3,
  "search_criteria": {
    "field_filters": [
      { "key": "workflow_user_id_7", "value": "approved" }
    ]
  }
}
```

Prefer `status-search` when its filters suffice — it applies workflow-aware shaping and permission scoping. The escape hatch is subject to GF's entry permissions, not Flow's entry-visibility predicate.
