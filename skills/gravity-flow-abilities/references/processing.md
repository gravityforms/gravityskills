# steps-process — Complete Guide

`gravityflow/steps-process` performs an assignee action on an entry's **current** step. It cannot target an arbitrary step — the workflow's position decides what is processable.

## Inputs

| Input | Notes |
|---|---|
| `entry_id` | Required |
| `status` | Required — see per-type table below |
| `note` | Optional in general; REQUIRED when the step config demands one for the status (common on reject/revert), and ALWAYS required for delegated calls. Include one anyway — approvals without context make poor audit trail |
| `field_values` | user_input steps only; `input_{field_id}` / `input_{field_id}.{sub}` keys |
| `assignee_key` | Delegation (`type|id`); requires workflow-admin permission + `note` |

## Valid status by step type

| Step type | Statuses | Notes |
|---|---|---|
| `approval` | `approved`, `rejected`, `revert` | `revert` only when the step has reverting enabled — it sends the entry back to a designated user-input step without recording a rejection |
| `user_input` | `complete`, `in_progress` | `in_progress` saves `field_values` without completing the step |
| anything else | — | `operation_not_supported`. Notification/webhook/feed steps complete autonomously; if one is stuck, use `steps-restart` / `workflow-send-to-step` |

`system-step-types` reports a `processable` flag per type — check it when unsure.

## Authorization

- **As self:** authenticated user must be a *pending* assignee on the current step (directly, via role, or via a field that resolved to them). Same rule as the web inbox.
- **Delegated (`assignee_key`):** requires workflow-admin permission. The key must resolve to a *pending* assignee on the current step. `note` is required. The result is dual-attributed:
  - Timeline note: attributed to the acting admin, body prefixed `[On behalf of {display_name} ({key})]`
  - Activity feed: a `delegated` assignee event (acting admin in `display_name`, acted-for assignee in `assignee_key`) alongside the normal status event

## field_values and editable fields

User-input steps declare which fields assignees may edit. `field_values` is validated fail-closed:

- Keys must match `input_{field_id}` or `input_{field_id}.{sub}` / `input_{field_id}_{sub}` for compound fields
- Every referenced field must be in the step's editable list — otherwise the call fails with an error naming the editable field IDs, and nothing is saved
- Approval steps accept no `field_values` at all

To know the editable fields in advance: `steps-get` on the current step. Value formats follow Gravity Forms conventions (see the gravity-forms-abilities skill's field-config reference).

## Response shape

```json
{
  "success": true,
  "step_status": "approved",
  "feedback": "Entry Approved",
  "final_status": "pending",
  "current_step_id": 42
}
```

- `step_status` — the status you requested, confirmed
- `feedback` — human-readable pipeline message
- `final_status` + `current_step_id` — where the workflow stands NOW (the workflow may have advanced several steps: notifications/webhooks between interactive steps complete inline). `current_step_id: null` with a terminal `final_status` means the workflow finished

After processing, trust this response over assumptions — reject destinations and conditional branches mean the "next" step is not always the next in order.

## Errors

| Error | Meaning | Agent response |
|---|---|---|
| `operation_not_supported` | Current step type is not processable | Use the unstick ladder (steps-restart / send-to-step), not repeated processing |
| `assignee_already_processed` | This assignee already acted on this step | Done — do not retry; check `workflow-status-get` for current state |
| Validation error naming a required note | Step config requires a note for this status | Retry the same call with `note` |
| Error naming editable field IDs | `field_values` touched a non-editable field | Resend with only listed fields; report the rest to the user |
| Permission error | Not a pending assignee (self) / missing admin permission (delegated) | Check `workflow-status-get` assignees; do not escalate on your own |
| Entry not found | Entry nonexistent OR not visible to this user | Indistinguishable by design — verify via `status-search`, don't enumerate |
