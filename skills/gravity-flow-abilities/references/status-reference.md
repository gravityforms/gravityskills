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
| `cancelled` | Step was skipped (workflow-send-to-step) or the workflow was cancelled while it was active |

## Per-assignee statuses

Within a pending step, each assignee has their own status (`pending`, `approved`, `rejected`, `complete`). Multi-assignee approval steps combine them by policy — `workflow-status-get`'s `current_step.approval_policy` states it directly: `"all"` (unanimous — every assignee must act; one approval with the step still pending is normal, name who is still pending) or `"any"` (first decision wins). The live list is `assignees[] { key, display_name, status }`.

This policy is a **configurable step setting**, not a fixed law. If a workflow is stuck because it demands unanimous approval and the user wants any-one-approves instead (or vice versa), that is a `steps-update` on the step's approval settings — surface it as the real remedy (or a decision point to confirm), rather than only restarting/re-notifying to chase the missing approvals.

## Assignee key format

`type|id`:

| Key | Resolves to |
|---|---|
| `user_id|5` | WordPress user ID 5 |
| `role|approver` | Every user with the role |
| `email|pat@example.com` | An email address (may have no WP account) |

Step *configurations* may also use field-resolved types (`assignee_field`, `assignee_user_field`, `email_field`) that resolve per entry at runtime — which is why `steps-get` shows configured assignees but only `workflow-status-get` shows an entry's actual ones.

**Email assignees** act through signed token links embedded in notification emails. They never authenticate to WordPress, so no MCP credential corresponds to them. An agent cannot act *as* an email assignee — only a workflow admin can act *on behalf of* one via delegated `steps-process` with `assignee_key: "email|..."`.

**"Their link doesn't work" playbook** — always cover all three parts: (1) explain the model — email assignees act via the signed link in their notification, not by logging in, and links are entry+step+assignee-specific and can expire or be superseded; (2) verify with `workflow-status-get` that the step is still pending and they are still a listed assignee (if the step moved on, the old link is dead by design); (3) remediate with `steps-restart` (admin) to re-send a fresh token link — or delegated `steps-process` if the admin should act for them. Also check the step's notification message actually contains `{workflow_entry_link}` (use `{workflow_entry_link:page_id=N}` to point the link at a specific front-end inbox page).

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
  "form_ids": [3],
  "search_criteria": {
    "field_filters": [
      { "key": "workflow_step", "value": "41" }
    ]
  }
}
```

Note: GF's `entries-search` takes `form_ids` (an array), not `form_id`.

Example — everything user 7 has ever approved on form 3:

```json
{
  "form_ids": [3],
  "search_criteria": {
    "field_filters": [
      { "key": "workflow_user_id_7", "value": "approved" }
    ]
  }
}
```

Prefer `status-search` when its filters suffice — it applies workflow-aware shaping and permission scoping. The escape hatch is subject to GF's entry permissions, not Flow's entry-visibility predicate.
