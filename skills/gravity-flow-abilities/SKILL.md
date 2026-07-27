---
name: gravity-flow-abilities
description: Workflow guidance for AI agents using Gravity Flow abilities via the WordPress Abilities API (MCP). Load this skill when interacting with any gravityflow/* MCP tools — triaging the workflow inbox, approving/rejecting entries, submitting user input, diagnosing stuck workflows, admin actions (cancel/restart/send-to-step), or workflow reports and activity. Provides status vocabulary, assignee-key semantics, sequencing rules, and pitfall avoidance that tool schemas alone cannot express.
license: GPL-2.0+
compatibility: Requires a WordPress site with Gravity Flow 3.2+ (MCP enabled under Workflow → Settings → MCP) and Gravity Forms 2.9+
metadata:
  author: gravityforms
  version: "0.1.0"
---

# Gravity Flow Abilities — Agent Skill

## Ability Routing

17 abilities. Select based on intent:

**Orient** → `system-info` (Flow version + workflow-enabled forms with step counts and pending-entry counts — call this first), `system-step-types` (registered step types with `processable` flags)

**Triage** → `inbox-list` (pending tasks for the authenticated user), `inbox-count`

**Search** → `status-search` (workflow entries filtered by form, workflow status, step, assignee, date range; paged)

**Diagnose** → `workflow-status-get` (one entry: final status, current step, live assignees with per-assignee statuses, per-step status map), `timeline-get` (entry history: who did what, when, with notes)

**Act** → `steps-process` (approve/reject/revert an approval step, or complete a user-input step, with note and field values), `timeline-note-add` (annotate an entry's workflow timeline)

**Unstick (admin)** → `steps-restart` (mildest), `workflow-send-to-step`, `workflow-restart`, `workflow-cancel`

**Step configuration (read)** → `steps-list` (a form's steps, summary shape; optional `entry_id` adds per-entry statuses), `steps-get` (one step's sanitized settings)

**Analyze** → `reports-get` (aggregate completion counts and durations across 7 scopes), `activity-list` (recent workflow event feed — the audit view)

All ability names use format `gravityflow/{area}-{action}`. On the dedicated endpoint, tool names are hyphenated: `gravityflow-inbox-list`.

**Not yet available:** step configuration writes (`steps-create`, `steps-update`, `steps-delete`, `system-step-type-schema`) are planned but not shipped. Never attempt to create or modify workflow steps via `gravityforms/feeds-*` — steps are Flow-owned feeds and generic feed tools bypass Flow's validation. Report the limitation instead.

## Division of Labor: Flow vs Forms

Gravity Flow abilities return **entry IDs and workflow state — never entry field values**. Hydrate entry data with `gravityforms/entries-get`. The two servers are complementary and usually both connected:

- `gravityflow/*` — workflow: inbox, statuses, assignees, timeline, processing, admin actions, reports
- `gravityforms/*` — data: entry field values, form structure, submissions, notes

**Etiquette rules (important):**
- Never edit workflow-relevant fields via `gravityforms/entries-update` while an entry is mid-step — assignee resolution and conditions will silently desync. The one sanctioned exception is the reassignment recipe below.
- Never touch Flow steps via `gravityforms/feeds-*`.
- Workflow entry-meta keys are a legitimate escape hatch in `gravityforms/entries-search` `field_filters` when `status-search` filters aren't enough — see [references/status-reference.md](references/status-reference.md).

## Access Modes

Flow's MCP surface is gated in **Workflow → Settings → MCP**, independently of Gravity Forms' MCP settings:

1. **Enable MCP** (default: off) — master switch. When off, no `gravityflow/*` ability is exposed or callable.
2. **Per-tool checkboxes** (default: every tool off) — grouped into **Read-only Tools** and **Write & Destructive Tools**. A tool is exposed and callable only when its box is checked. There is no blanket "read access."

**Read-only group** (each opt-in): `inbox-list`, `inbox-count`, `status-search`, `workflow-status-get`, `timeline-get`, `steps-list`, `steps-get`, `system-info`, `system-step-types`, `reports-get`, `activity-list`

**Write & destructive group** (each opt-in): `timeline-note-add`, `steps-process`, `steps-restart`, `workflow-send-to-step`, `workflow-restart`, `workflow-cancel`

If a tool is absent from discovery or a call is permission-denied, the admin has not enabled that specific tool (or MCP itself is off). Do not attempt workarounds — tell the user to enable the exact tool in Workflow → Settings → MCP.

### Endpoint

The dedicated server lives at `/wp-json/mcp/gravityflow` and works regardless of Gravity Forms' MCP toggle. Tool names there are direct (`gravityflow-steps-process`) with full JSON Schemas. When the site-wide WordPress MCP server exists (GF site mode), Flow abilities also appear through its `discover-abilities` / `execute-ability` meta-tools. Same abilities either way; only transport differs.

## Acting User Model

MCP authenticates as a real WordPress user (application password). Every ability acts as that user — there is no "act as user X" input.

- **Inbox is personal.** `inbox-list` returns tasks assigned to the authenticated user (directly, via role, or via resolved fields). Different credentials = different inbox.
- **Processing as self** requires the authenticated user to be a *pending assignee* on the entry's current step — the same rule the web inbox enforces.
- **Delegated processing** (`steps-process` with `assignee_key`) acts on behalf of another pending assignee. It requires workflow-admin permission AND a `note` explaining why. The action is dual-attributed: the timeline note names both identities (`[On behalf of X (key)] …`) and the activity feed records a `delegated` event. A delegated action is never indistinguishable from the assignee acting themselves.
- **Entry visibility:** entry-scoped abilities (`workflow-status-get`, `timeline-get`, `timeline-note-add`, `steps-list` with `entry_id`) succeed only when the user has view-all permission, is the entry's submitter, or is a current/past assignee. An invisible entry returns the same error as a nonexistent one — do not retry or enumerate; verify existence via `status-search` or ask the user.

## Core Workflows

### Triage and act (the primary loop)

1. `inbox-list` → pending tasks with `entry_id`, `form_id`, `step_id`, `step_name`, `step_type`, `submitter`, `workflow_timestamp`, `due_date`
2. Hydrate details as needed: `gravityforms/entries-get { entry_id }`
3. `steps-process { entry_id, status, note }` — always include a `note`; approvals without context are poor audit trail
4. Check the response: `step_status` confirms your action; `final_status` + `current_step_id` show where the workflow went next

Sort/prioritize by `workflow_timestamp` (when the task started waiting), not `date_created` (when the entry was submitted).

### Diagnose and unstick ("where is entry 512 stuck?")

1. `workflow-status-get { entry_id }` → current step, how long pending, live assignees and who hasn't acted
2. `timeline-get { entry_id }` → what already happened, in whose hands it stalled
**Where admins get step IDs:** `steps-list` requires the step-builder permission, which workflow admins often lack. The per-step map in `workflow-status-get` (`steps[] { id, name, type, status }`) is the intended step-ID source for send-to-step targets. Skipped steps show status `cancelled` there.

3. Escalate mildest-first (all admin-gated):
   - `steps-restart` — reset the current step's assignee statuses and re-send notifications. Use when the assignee missed/lost the notification.
   - `workflow-send-to-step { step_id }` — jump to a specific step; the current step's pending assignees are discarded. Use to skip a broken/unnecessary step.
   - `workflow-restart` — reset EVERY step status and reprocess from the top. Nuclear; requires confirmation phrase.
4. Etiquette: after any admin intervention, `timeline-note-add` explaining what was done and why.

**Cancel vs restart:** `workflow-cancel` ends the workflow (assignees purged, entry kept, `final_status: cancelled`); `workflow-restart` starts it over. Cancelling is not deleting — the entry survives and can be restarted later.

**Confirmation echo-back:** `workflow-cancel` requires `confirmation: "CANCEL WORKFLOW {entry_id}"`; `workflow-restart` requires `confirmation: "RESTART WORKFLOW {entry_id}"`. On a mismatch the error returns the exact expected phrase — echo it back precisely. Always confirm with the human before these operations.

### Search

`status-search` filters: `form_id`, `status` (workflow final status), `step_id`, `assignee_key`, date range, paging. With view-all permission it spans all entries; without it, results are silently limited to the user's **own submissions** — if results look incomplete, that's why (tell the user which permission is missing rather than retrying).

For filters `status-search` doesn't offer, use `gravityforms/entries-search` with workflow meta keys as `field_filters` — key table in [references/status-reference.md](references/status-reference.md).

### Reassignment (sanctioned recipe)

There is no reassign ability. For steps whose assignees resolve from an entry field (assignee field, user field, email field), reassignment is exactly two calls:

1. `gravityforms/entries-update` — set the entry's assignee field to the new user/email
2. `gravityflow/steps-restart { entry_id }` — re-resolves assignees from the updated field and re-notifies

This is the ONE sanctioned exception to "don't edit workflow fields mid-step," and it only works for field-resolved assignees. For steps with fixed user/role assignees, the step configuration itself must change — not yet possible via MCP; direct the user to the step settings screen.

### Analytics

- `reports-get { scope }` — scopes and required params: `all_forms` (per-form), `form` (per-month, needs `form_id`), `form_by_step` (needs `form_id`), `step_by_assignee` (needs `step_id`), `form_by_assignee` (needs `form_id`), `all_forms_by_assignee`, `assignee_by_month` (needs `assignee_key`). Defaults to the last 6 months. Rows carry `count` and `avg_duration_secs` plus scope-specific identifiers; durations are **seconds** — convert to human units when reporting.
- `activity-list` — newest-first event feed (workflow/step/assignee lifecycle), filter by `objects`, `form_id`, `limit` (default 50, max 400). Use for "who approved what today." Delegated actions appear as assignee `delegated` events where `display_name` is the acting admin and `assignee_key` is who they acted for.
- Pattern: `reports-get` finds the aggregate problem (slowest approver), `status-search` finds the concrete backlog behind it.

## Processing Rules (steps-process)

Full detail in [references/processing.md](references/processing.md). The essentials:

- **Only `approval` and `user_input` steps are processable.** Anything else (notification, webhook, feed add-on steps…) returns `operation_not_supported` — those steps complete on their own; if one is stuck, use the unstick ladder instead.
- **Valid `status` by step type:** approval → `approved` | `rejected` | `revert` (revert only if the step has reverting enabled); user_input → `complete` | `in_progress` (save progress without completing).
- **Note requirements:** approval steps can be configured to REQUIRE a note on reject/revert. On that validation error, retry the same call with a `note`. Delegated calls always require a note.
- **`field_values`** (user_input steps only): keys are `input_{field_id}` / `input_{field_id}.{sub}`. Only the step's *editable fields* are writable — anything else fails closed with an error naming the editable field IDs. Approval steps do not accept field values.
- **Double-submit** → `assignee_already_processed`, no state change. Not an error to retry — the work is done.

## Status Vocabulary (essentials)

- **Workflow final status:** `pending` (in flight), `cancelled`, or — on completion — the FINAL step's status: `approved`, `rejected`, or `complete`. A finished workflow is NOT always `complete`; treat all three as terminal.
- **Step statuses:** `pending`, `queued` (not reached yet), `complete`, plus type-specific `approved` / `rejected` / `revert`.
- **Assignee keys:** `type|id` format — `user_id|5`, `role|editor`, `email|pat@example.com`.
- **Configured ≠ actual:** a step's configured assignees (from `steps-get`) may be field-resolved (`assignee_field`, `email_field`, …) and resolve per entry at runtime. To know who can act on an entry NOW, read `workflow-status-get`, never `steps-get`.
- **Email assignees** without a WordPress account act via signed token links in notification emails — they cannot act via MCP, and no credential will give an agent their inbox.

Full vocabulary, per-assignee meta, and the entries-search escape hatch: [references/status-reference.md](references/status-reference.md).

## Key Pitfalls

| Mistake | Consequence | Prevention |
|---|---|---|
| Skipping `system-info` at session start | Wrong form IDs, missed workflow forms | Call it first — it maps the workflow landscape |
| Reading `steps-get` to decide who should act on an entry | Field-resolved assignees differ per entry | Use `workflow-status-get` for live assignees |
| `steps-process` on a notification/webhook/feed step | `operation_not_supported` | Check `step_type` first; only approval and user_input are processable |
| Expecting `final_status: complete` for every finished workflow | Finished workflows record `approved`/`rejected` too | Treat `approved`, `rejected`, `complete` as terminal; `pending` means in flight |
| Editing workflow-relevant entry fields mid-step via `gravityforms/entries-update` | Assignees/conditions silently desync | Only the two-call reassignment recipe is sanctioned |
| Wrong or missing confirmation phrase on cancel/restart | `expected_confirmation` error | Echo the exact phrase from the error, including entry ID |
| Retrying entry IDs after a not-found error | IDs can't be enumerated — invisible ≡ nonexistent | Verify via `status-search`; check permissions with the user |
| `assignee_key` without a `note` | Validation error | Delegation always requires a reason note |
| `field_values` on an approval step, or on non-editable fields | Rejected fail-closed | user_input steps only; respect the editable-field list in the error |
| Sorting inbox by `date_created` | Oldest *submission* ≠ longest-*waiting* task | Sort by `workflow_timestamp` |
| Treating `status-search`'s thin results as "no entries" | Degraded mode shows own submissions only | Report the missing view-all permission instead |
| Tool absent from discovery | Admin hasn't enabled that tool (or MCP is off) | Point to Workflow → Settings → MCP; no workarounds |
| Building/modifying steps via `gravityforms/feeds-*` | Bypasses Flow validation; refused | Step CRUD via MCP is not yet available — say so |

For steps-process details and error codes: [references/processing.md](references/processing.md).
For status vocabulary, meta keys, and search escape hatches: [references/status-reference.md](references/status-reference.md).
