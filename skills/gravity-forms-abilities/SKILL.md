---
name: gravity-forms-abilities
description: Workflow guidance for AI agents using Gravity Forms abilities via the WordPress Abilities API (MCP). Load this skill when interacting with any gravityforms/* MCP tools — creating/updating forms, managing entries, submitting data, searching entries, managing feeds/notifications, analyzing conditional logic, or querying system info. Provides critical sequencing rules, field configuration knowledge, conditional logic patterns, and pitfall avoidance that tool schemas alone cannot express.
license: GPL-2.0+
compatibility: Requires a WordPress site with Gravity Forms 2.9+ and the MCP endpoint enabled (GF Settings → MCP)
metadata:
  author: gravityforms
  version: "1.0.5"
---

# Gravity Forms Abilities — Agent Skill

## Ability Routing

32 abilities across 8 categories. Select based on intent:

**Discover** → `system-field-types` (field types), `system-info` (site identity, version, license, add-ons — includes `site_url` and `site_name` for multi-site disambiguation), `forms-list` (all forms as summaries: id, title, is_active, date_created, field_count), `forms-get` (single form with full field detail)

**Build** → `forms-create` (new form), `forms-update` (modify form), `forms-duplicate` (clone form), `forms-delete` (trash by default, `force: true` for permanent)

**Analyze** → `forms-analyze-logic` (conditional logic audit: field/notification/confirmation/button logic with dependency map)

**Collect data** → `submissions-submit` (full pipeline: validate → entry → notifications → feeds), `submissions-validate` (dry-run validation only)

**Manage data** → `entries-search` (filter/paginate), `entries-get` (single entry), `entries-count` (efficient count), `entries-create` (raw insert, no validation), `entries-update`, `entries-delete` (trash by default; single by entry_id OR bulk by form_id + optional search_criteria; `force: true` for permanent)

**Integrations** → `feeds-list`, `feeds-create`, `feeds-update`, `feeds-delete`

**Notifications** → `notifications-list`, `notifications-create` / `notifications-update` / `notifications-delete` (targeted config edits — the canonical path, NOT forms-update), `notifications-send` (re-send for an existing entry)

**Confirmations** → `confirmations-list`, `confirmations-create` / `confirmations-update` / `confirmations-delete` (the message / page / redirect a submitter sees after submitting)

**Audit** → `notes-list`, `notes-add` (annotate entries)

All ability names use format `gravityforms/{category}-{action}`.

## Access Modes

The MCP settings page (GF Settings → MCP) gates access with a master switch plus a per-tool allowlist:

1. **Enable MCP** (default: off) — Master switch. When off, no `gravityforms/*` ability is exposed or callable, regardless of the per-tool checkboxes.
2. **Per-tool checkboxes** (default: every tool off) — When MCP is on, each ability is individually enabled or disabled via a checkbox, grouped into **Read-only Tools** and **Write & Destructive Tools** (each with a select/deselect-all control). A tool is exposed and callable only when its box is checked. **There is no blanket "read access" — read-only tools are off by default too** and must be enabled individually.

So an ability is available only when **Enable MCP is on AND that specific tool is checked**. A freshly enabled integration exposes nothing until tools are opted in.

**Read-only group** (each opt-in): `forms-get`, `forms-list`, `forms-analyze-logic`, `entries-get`, `entries-search`, `entries-count`, `submissions-validate`, `feeds-list`, `notifications-list`, `confirmations-list`, `notes-list`, `system-info`, `system-field-types`

**Write & destructive group** (each opt-in): `forms-create`, `forms-update`, `forms-delete`, `forms-duplicate`, `entries-create`, `entries-update`, `entries-delete`, `feeds-create`, `feeds-update`, `feeds-delete`, `submissions-submit`, `notifications-send`, `notifications-create`, `notifications-update`, `notifications-delete`, `confirmations-create`, `confirmations-update`, `confirmations-delete`, `notes-add`

If an ability is not available (absent from discovery, or a direct call is permission-denied), the admin has not enabled that specific tool (or MCP itself is off). Do not attempt workarounds — tell the user to enable the exact tool, and Enable MCP, in GF Settings → MCP.

### Endpoint Modes

The MCP settings page also controls how GF abilities are exposed:

- **Site MCP** (default) — GF abilities are registered on the shared WordPress MCP endpoint (`/wp-json/mcp/mcp-adapter-default-server`). They appear alongside abilities from other plugins and are accessed through the default server's meta-tools (`mcp-adapter-discover-abilities`, `mcp-adapter-execute-ability`, `mcp-adapter-get-ability-info`).
- **Dedicated Endpoint** — GF registers its own MCP server at `/wp-json/mcp/gravityforms`. Each ability becomes a direct MCP tool (e.g., `gravityforms-forms-get` instead of going through `execute-ability`). GF abilities are hidden from the default server.

**When using dedicated endpoint mode:**
- Tool names use hyphen format: `gravityforms-forms-get`, `gravityforms-entries-search`, etc. (the `/` in ability names is converted to `-`)
- Each tool has its own full JSON Schema — no need to call `mcp-adapter-get-ability-info` first
- The MCP client must be configured to connect to the GF server endpoint separately
- Both servers can coexist — the default server serves other plugins' abilities while GF serves its own

**When using site MCP mode (default):**
- All abilities accessed through the shared endpoint's `mcp-adapter-execute-ability` meta-tool
- Tool name passed as a parameter: `mcp-adapter-execute-ability` with `{"ability": "gravityforms/forms-get", ...}`
- This is the simpler setup — one MCP connection covers all plugins

The agent does not need to know which mode is active — the MCP client handles routing. The same abilities are available in both modes; only the transport differs.

## Critical Workflows

### Creating a Form

1. Call `system-field-types` — discover available types and capabilities
2. Build form object with `title` and `fields` array — for `phone` fields, ALWAYS set `phoneFormat` explicitly (see the phone section below)
3. **Include a `notifications` object** — `forms-create` does NOT auto-create a default admin notification (unlike the GF admin UI). Without one, submissions are saved but no email is sent.
4. Call `forms-create` — returns `form_id` and `edit_url`

Never guess field types. `system-field-types` returns `supports_choices`, `has_inputs`, `default_inputs`, and support flags for each type.

**International phone field (Gravity Forms 3.0).** The `phone` field is still one type, but it has a `phoneFormat` setting with exactly three valid values: `"standard"` (US-masked plain string), `"international"` (unformatted plain string), or `"formatted"` (international UI, paired with a `defaultCountry` like `"us"`). The `system-field-types` phone entry reports the site's valid values as `format_options` — use those exact strings and never invent or abbreviate others; an unknown `phoneFormat` breaks form rendering. A **formatted** phone does NOT store a plain string — its value is a JSON object with the keys `country`, `national`, `formatted`, and `e164` (the `e164` value is validated against the E.164 standard). This changes how every entry-facing ability handles it:
- **Creating the field** (`forms-create` / `forms-update`): ALWAYS set `phoneFormat` explicitly — `"standard"` for a US phone, `"formatted"` (plus `defaultCountry`) for international. Do not omit it: older Gravity Forms versions do not backfill an omitted format on API-created fields, which breaks form rendering.
- **Reading** (`entries-get` / `entries-search`): a formatted phone comes back as that JSON object, not a plain number — parse it (use `e164` for the canonical number), don't treat it as a string.
- **Writing / submitting** (`entries-update`, `submissions-submit`, `submissions-validate`): supply the JSON object with a valid `e164`, not a bare number, or validation fails. (`entries-create` is a raw insert, so match the same shape to keep the value usable.)

**Default admin notification template:**
```json
{
  "notifications": {
    "notif_admin": {
      "id": "notif_admin",
      "name": "Admin Notification",
      "event": "form_submission",
      "toType": "email",
      "to": "{admin_email}",
      "subject": "New submission from {form_title}",
      "message": "{all_fields}",
      "isActive": true
    }
  }
}
```

Use `{admin_email}` for site admin, or a specific address. `{all_fields}` renders all submitted values. `{form_title}` inserts the form name.

### Updating a Form

**The `fields` array replaces ALL existing fields.** Sending partial arrays deletes omitted fields.

1. Call `forms-get` — retrieve current form structure
2. Modify the returned fields array (add/remove/change)
3. Call `forms-update` with the complete form object

`notifications` and `confirmations` passed to `forms-update` merge by key — handy when standing up a whole form at once. For **targeted edits to a single notification or confirmation — including deletion — use the dedicated tools below**, not `forms-update` (they don't round-trip the whole form, so they can't drop fields). `fields` does NOT merge.

### Notifications & Confirmations

Notifications (emails) and confirmations (the message / page / redirect shown after submit) are keyed objects on the form. Edit them with the dedicated tools — the canonical path.

**Always read before you write.** Call `notifications-list` / `confirmations-list` first to get the `id` of the item to change (the list carries the full objects; there is no separate "get one").

- **Create** → `notifications-create` / `confirmations-create` with a settings object; the tool generates and returns the id.
  - A notification needs `name`, `event` (e.g. `form_submission`), `to` (an email, or a field id / routing per `toType`), `subject`, and `message` (merge tags + HTML OK).
  - A confirmation needs `name` and a `type`: `message` (needs `message`), `page` (needs `pageId`), or `redirect` (needs `url`).
- **Update** → `notifications-update` / `confirmations-update` with the `notification_id` / `confirmation_id` and only the keys to change (partial merge; the id is immutable). The result must still satisfy the required fields above.
- **Delete** → `notifications-delete` / `confirmations-delete` by id. The form's **default confirmation cannot be deleted** (edit it instead) — every form keeps one fallback.
- **Route by condition** → add a `conditionalLogic` object (`{actionType, logicType, rules}`) so a notification sends — or a confirmation shows — only on matching submissions. For notifications `actionType: "show"` means "send when matched"; the default confirmation shows when none match. See [references/conditional-logic.md](references/conditional-logic.md).

Common shapes: route different emails to clinicians vs patients (two notifications, each with `conditionalLogic` on a role/type field); show a tailored thank-you page per department (conditional confirmations + the default as fallback).

### Submitting a Form

1. Call `forms-get` — learn field IDs and structure
2. Build `input_values` using `input_{field_id}` key format
3. Call `submissions-submit`
4. Check `is_valid` in response — if false, read `validation_messages`

For most compound fields (name, address), use dot-notation sub-input keys: `input_{field_id}.{suffix}` (e.g., `input_5.3` for First Name on field 5). This is the canonical format matching how GF stores sub-input IDs internally.

**Time fields are the exception:** submit via underscore-style sibling keys that the bridge normalizes: `input_6_1`, `input_6_2`, `input_6_3` for Hour / Minute / AM-PM. This underscore format is specific to time fields only — all other compound fields use dot notation. Do not conclude a time field is broken until you've tested those three sub-inputs together on a clean form.

For **multiselect fields**, pass values as an array: `"input_3": ["Red", "Blue"]`. Never use comma-separated strings — values containing commas cause data loss.

**`submissions-submit` vs `entries-create`:**
- `submissions-submit` = full pipeline (validation → entry → notifications → feeds)
- `entries-create` = raw DB insert, bypasses everything — use only for data migration

### Pausing / Scheduling a Form

**Do NOT use `is_active: '0'` to pause a form** — that deactivates it entirely (shortcode renders nothing). Use scheduling instead.

**Pause immediately** (form page stays up, shows message):
1. Call `forms-list` with `search` — find the form
2. Call `forms-update`:
   - `scheduleForm: true`
   - `scheduleEnd` set to yesterday's date (MM/DD/YYYY format)
   - `scheduleMessage: "This form is no longer accepting submissions."`

**Schedule a form window** (open during a date range):
1. Call `forms-update`:
   - `scheduleForm: true`
   - `scheduleStart: "01/15/2026"`, `scheduleEnd: "02/15/2026"`
   - `schedulePendingMessage: "Registration opens January 15th."`
   - `scheduleMessage: "Registration has closed."`

**Block a date range** (e.g., "close reservations Dec 20–Jan 2"):

GF scheduling is open-window only — there is no "block these dates" mode. To block a date range:
1. Set `scheduleEnd` to the day before the closure starts (e.g., `12/19/2026`)
2. Set `scheduleStart` to today (or leave existing start)
3. Set `scheduleMessage` explaining the closure and when the form reopens
4. **After the closure ends**, call `forms-update` with `scheduleForm: false` to reopen

This is a two-touch workflow — the agent cannot set-and-forget a future block window.

**Reopen a paused form:**
1. Call `forms-update` with `scheduleForm: false`

**Cap entries** (stop after N submissions):
1. Call `forms-update`:
   - `limitEntries: true`
   - `limitEntriesCount: 500`
   - `limitEntriesPeriod: ""` (total) or `"day"`, `"week"`, `"month"`, `"year"`
   - `limitEntriesMessage: "Registration is full."`

### Duplicating and Customizing a Form

1. Call `forms-list` with `search` — find the source form by title
2. Call `forms-duplicate` — creates an exact copy (title gets " (1)" suffix)
3. Call `forms-get` on the **new** form — inspect everything that needs updating
4. Call `forms-update` — rename title, update fields, confirmations, and notifications

**Don't just update the title and fields.** After duplicating, review and update ALL content that references the original:
- **Field labels, descriptions, placeholders, default values** — dates, event names, seasonal references
- **Choice text/values** — date options in dropdowns or radio buttons
- **Confirmation messages** — "Thanks for registering for Q2..." → update to Q4
- **Notification subjects and bodies** — email content referencing original form's context
- **Form description** — displayed to users above the form

Remember: `fields` array replaces ALL fields on update. Always pass the complete array from `forms-get` with your modifications.

### Multi-Form Batch Update (e.g., Add Field to All Forms)

For scenarios like "add a GDPR consent checkbox to every form that collects personal information":

1. Call `forms-list` — get all forms
2. **For each form**: call `forms-get` → inspect fields to determine if it qualifies (e.g., has name/email/phone/address fields) and doesn't already have the target field (e.g., a consent field)
3. For qualifying forms: append the new field to the existing fields array → call `forms-update`

**This is chatty but functional.** A site with 100 forms requires 100 `forms-get` calls for inspection plus update calls for qualifying forms. There is no bulk "get all forms with full fields" ability. Work form-by-form.

**Tips:**
- Always check for the field type before adding — avoid duplicating consent fields on forms that already have one
- Use `nextFieldId` from `forms-get` as the new field's `id`, and bump `nextFieldId` by 1 in the update
- Remember: `fields` array on `forms-update` replaces ALL fields — always pass the complete array from `forms-get` with your addition appended

### Searching Entries

1. Call `forms-get` to learn field IDs
2. Call `entries-search` with `field_filters` using field IDs (numbers), not labels
3. For large sets, call `entries-count` first, then paginate with `paging.page_size` (max 100)

**When a user asks for "an entry" without a date:** run a broad `entries-search` first (no date filter). Only narrow to today / this week / a specific date after you confirm there are matching entries in that scope. A zero-result date filter does **not** prove the form has no entries.

**Batch counting:** To compare entry counts across multiple forms (e.g., "which forms have no submissions this month?"), pass an array of form IDs to `entries-count`: `{"form_ids": [1, 3, 6], "search_criteria": {...}}` → returns `{"total": 17, "counts": {"1": 5, "3": 0, "6": 12}}`. One call instead of N.

**Time-bucketed reporting** (e.g., "monthly breakdown of enquiries this term"):

There is no server-side group-by. The agent makes one `entries-count` call per time bucket:

1. `forms-list` with `search` → find the form
2. `entries-count` per bucket with `start_date`/`end_date` — e.g., `{"start_date": "2026-01-01", "end_date": "2026-01-31"}` for January
3. Synthesize results into a table/summary for the user

For a 3-month term that's 4 calls (1 form lookup + 3 counts). For a full year, 13 calls. Both formats work for dates: `"2026-01-01"` or `"2026-01-01 00:00:00"`.

See [references/entry-operations.md](references/entry-operations.md) for filter operators and search examples.

### Bulk Deleting Entries

`entries-delete` supports bulk mode — pass `form_id` instead of `entry_id` to delete all matching entries server-side.

**Bulk calls are capped at 100 entries per call** (to avoid server timeouts). The response includes `remaining` and `capped`. When `capped: true`, loop: call `entries-count` for the updated count, then `entries-delete` again (force mode needs a fresh `DELETE {count} ENTRIES FROM FORM {form_id}` confirmation each time). Repeat until `remaining` is 0. Already-trashed entries are excluded from trash-mode bulk deletes automatically, so each call processes new entries.

**Delete all entries from every form** (e.g., pre-launch cleanup):
1. Call `forms-list` — get all form IDs
2. Call `entries-count` across **all relevant form IDs** — get counts
3. **Confirm with the user** — "Form X has N entries, Form Y has M entries. Delete all?"
4. On confirmation, call `entries-delete` with `form_id` for each form (default: moves to trash; add `force: true` for permanent deletion)

Never stop after deleting a single entry unless the user explicitly scoped the request to one entry. Sitewide cleanup requires enumerating the full form set first.

**Delete filtered entries** (e.g., entries before a date):
1. Call `entries-delete` with `form_id` + `search_criteria` (same format as `entries-search`)

See [references/entry-operations.md](references/entry-operations.md) for bulk delete examples.

### Destructive Operations

**Both `forms-delete` and `entries-delete` use soft delete (trash) by default.** The `force: true` parameter is required for permanent deletion.

- Default behavior (`force` omitted or `false`): moves to trash. Forms get `is_trash = 1`, entries get `status = 'trash'`. Both are recoverable from the GF admin.
- `force: true`: permanently deletes. Cannot be undone. All associated data (entries, notes, meta, feeds for forms) is also deleted.
- The response includes `trashed: true/false` to confirm which path was taken.

**Always preview and confirm before destructive actions.** This applies to:
- `entries-delete` (bulk mode) — call `entries-count` first, show scope to user
- `forms-delete` — confirm form title and entry count with user
- Any permanent deletion (`force: true`)

Pattern: **count → report → confirm → execute**.

### Multi-Site Management

When an agent is connected to multiple WordPress sites via separate MCP servers, each site exposes identical GF abilities under a different tool prefix (e.g., `acme-site_mcp-adapter-...`, `bakery_mcp-adapter-...`).

**Site identification:** Call `system-info` on each connected site first. The response includes `site_url` and `site_name`, which identify the physical site regardless of the MCP server name in the client config.

**Cross-site queries** (e.g., "summary of all forms across all three sites"):
1. Call `system-info` on each site — get site name/URL and totals
2. Call `forms-list` on each site — get form summaries
3. Merge and present results, clearly labeling each form with its site

**Cross-site operations** (e.g., "add GDPR consent to all forms on all sites"):
1. Call `system-info` on each site — confirm site identity
2. Work site-by-site using the Multi-Form Batch Update workflow
3. Report results per-site

**Key rules:**
- **Form IDs are site-local.** Form ID 1 on site A is unrelated to form ID 1 on site B. Always track `(site, form_id)` pairs.
- **No cross-site abilities exist.** The agent is the aggregation layer — each ability call targets exactly one site.
- **Confirm site identity before destructive operations.** Call `system-info` to verify `site_url` matches the intended target.

**Cross-site form cloning** (e.g., "copy the contact form from Client A to Client B"):
1. Call `forms-get` on the source site — retrieve full form structure
2. Clean the response for `forms-create`:
   - **Strip**: form-level `id`, `date_created`, `is_active`, `is_trash`, `markupVersion`
   - **Strip from each field**: `formId` (GFAPI auto-sets this to the new form's ID)
   - **Strip computed properties**: `checked_indicator_url`, `checked_indicator_markup` (regenerated by GF)
   - **Keep**: field `id` values — preserves merge tag references like `{Name:1}` in notifications and confirmations
   - **Keep**: `notifications`, `confirmations`, `cssClass`, `size`, `visibility`, `pageNumber`, all type-specific config
3. Optionally update: `title`, notification `to` addresses, confirmation messages
4. Call `forms-create` on the target site with the cleaned form object
5. Verify with `forms-get` on the new form

**Important:** Field `id` values are preserved through `forms-create` — GFAPI honors the IDs you pass. This means merge tags in notifications (e.g., `{Email:3}`) continue to reference the correct fields. `nextFieldId` is auto-calculated.

### WordPress Multisite Networks

The section above covers **separate WordPress installs**. A **WordPress multisite network** (one install, many subsites) behaves differently in specific ways:

**Connection model:** Each subsite has its own REST root, so each subsite is its own MCP endpoint (e.g., `https://network.example/site-b/wp-json/mcp/gravityforms`). Configure **one MCP server per subsite URL**, not per install. `system-info`'s `site_url` / `site_name` identify the subsite, same as with separate installs.

**Per-subsite everything:** MCP enablement, the per-tool allowlist, and the endpoint mode are all configured per subsite — there is no network-level toggle. Two subsites on the same network can expose different tool sets, or none. If a tool works on subsite A but is missing on subsite B, that is per-subsite configuration, not an error: the admin must enable it in **that subsite's** GF Settings → MCP. Forms, entries, and feeds are stored per subsite; form IDs remain site-local (track `(site, form_id)` pairs).

**Capabilities are per-subsite:** A user's credentials authenticate across the network, but their capabilities depend on their role **on each subsite**. Expect the same credential to succeed on one subsite and be permission-denied on another. Super admins pass capability checks on every subsite.

**HTML in notifications/confirmations is filtered for most users:** On multisite, only super admins hold `unfiltered_html`. For everyone else, notification and confirmation messages are run through WordPress's HTML filter on save — `<style>` blocks, document-level tags (`<html>`, `<head>`, `<body>`), and non-whitelisted attributes are stripped. If a rich HTML email template loses markup on a multisite subsite, this is expected filtering, not a bug. Keep templates to body-level HTML, and tell the user why the markup changed.

**License info may be network-inherited:** When Gravity Forms is network-activated, subsites without their own key inherit the network license, and the license field on subsites is locked ("managed by the administrator of this network"). `system-info`'s `is_licensed` / `license_type` on a subsite can reflect that inherited key. Never advise a subsite admin to update the license key — that is a network-admin action on the network's main site.

## Conditional Logic

Conditional logic (CL) controls show/hide behavior of fields, notifications, confirmations, submit button, and page buttons based on field values.

### Analyzing Logic

Call `forms-analyze-logic` instead of parsing raw CL from `forms-get`. It returns:
- **`summary`** — rule counts across all locations
- **`dependency_map`** — reverse map showing what each source field controls (most useful view)
- Per-location arrays: `field_logic`, `notification_logic`, `confirmation_logic`, `submit_button_logic`, `page_logic`

### Adding/Modifying Logic

CL is a property on individual fields (or notifications/confirmations). To add or change:

1. `forms-get` → retrieve current form
2. Set `conditionalLogic` on the target field: `{ "actionType": "show", "logicType": "all", "rules": [{ "fieldId": "1", "operator": "is", "value": "Yes" }] }`
3. `forms-update` with complete fields array
4. `forms-analyze-logic` to verify

**`fieldId` in rules must be a string** — `"1"` not `1`.

For CL structure details, operators, and common patterns, see [references/conditional-logic.md](references/conditional-logic.md).

## Key Pitfalls

| Mistake | Consequence | Prevention |
|---|---|---|
| Skip `system-field-types` before `forms-create` | Invalid field types, missing choices config | Always call first |
| Partial `fields` array on `forms-update` | Deletes all omitted fields | Always `forms-get` → modify full array → `forms-update` |
| Missing `choices` on select/radio/checkbox | Field renders empty | Check `supports_choices` from `system-field-types` |
| Wrong input key format: `"1"` vs `"input_1"` | Silent data loss | `submissions-submit` uses `input_{id}`, `entries-create` uses `"{id}"` |
| Compound field without sub-input suffixes | Data not captured | Use `default_inputs` from `system-field-types`; for time fields send Hour/Minute/AM-PM together |
| Not checking `is_valid` after submission | Miss validation failures | Always check response `is_valid` field |
| Using `@example.com` emails in submissions | Rejected as spam by GF email field | Use realistic test domains (e.g., `@testmail.dev`) |
| Passing `form_id` as top-level param on `forms-update` | Input validation error | Put form ID inside the `form` object as `id` |
| Using integer `fieldId` in CL rules | Logic may not evaluate correctly | Always use string: `"fieldId": "1"` not `"fieldId": 1` |
| Using deprecated Ready Classes (`gf_left_half`, `gf_right_half`, `gf_left_third`, `gf_inline`, etc.) in `cssClass` | Deprecated since GF 2.5 — the API strips them and reports `stripped_ready_classes` in the response | NEVER use Ready Classes for layout. Use `layoutGroupId` + `layoutGridColumnSpan` — see Layout Grid in field-config reference |
| Parsing raw CL from `forms-get` manually | Error-prone, misses notifications/confirmations/buttons | Use `forms-analyze-logic` instead |
| Using `is_active: '0'` to pause a form | Form disappears entirely — page shows nothing | Use `scheduleForm` + `scheduleEnd` instead |
| Fileupload field without `allowedExtensions`/`maxFileSize` | Accepts any file type/size — security risk | Always set `allowedExtensions` and `maxFileSize` — see field-config reference |
| Creating a form without `notifications` | Submissions saved but no email sent — admin never notified | Always include a notification object — see "Creating a Form" workflow |
| Creating a name field without `nameFormat: "advanced"` | First/Last sub-inputs render stacked vertically instead of side-by-side | Always set `"nameFormat": "advanced"` and `"size": "large"` on name fields — see field-config reference |
| Creating a phone field without an explicit `phoneFormat` (or with an invented value) | On older GF versions the field fatals when rendered (form editor and frontend); format behavior is undefined | ALWAYS set `phoneFormat` explicitly to one of the values `system-field-types` reports in `format_options` (`"standard"`, `"international"`, `"formatted"`) — see field-config reference |
| Passing multiselect values as comma-separated string | Data loss when values contain commas (e.g., "Atlanta, GA") | Always pass multiselect values as an **array**: `"input_1": ["Red", "Blue"]` — see field-config reference |
| User asks to "create a form and add it to a page" | Cannot create WordPress pages/posts — only GF abilities exist | Create the form, then tell the user the shortcode `[gravityform id="X" title="true"]` to embed manually. Page/post creation is not currently available via the Abilities API. |
| Ability not found (e.g., `forms-create`) | Site admin has not checked that specific tool (or Enable MCP is off) in MCP settings | Tell the user to enable the exact tool — and Enable MCP — in GF Settings → MCP. There is no blanket "write access" toggle; each tool is opted in individually. Do not attempt workarounds. |
| `system-field-types` does not list rating/survey-style fields | The required add-on is not active on this site | Call `system-info` to check active add-ons; fall back to core fields (`radio`, `select`, `checkbox`) when add-on types are unavailable |
| `entries-update` with only status/metadata | Older bridge versions could wipe omitted field values | Safest pattern is still fetch → merge → update when changing existing entries |
| `entries-create` date field given in the wrong format | Searches may miss the entry later | Prefer the form's configured date format; ISO is only safe if the bridge explicitly normalizes it |
| "First/last name side by side" using a compound `name` field + layout grid | The `name` field already renders its sub-inputs (Prefix/First/Last/Suffix) in a row internally — adding `layoutGridColumnSpan` controls the whole block's width, not individual sub-inputs | When the user wants "first name and last name side by side," use **two separate `text` fields** with shared `layoutGroupId` and span `6`, not a single compound `name` field. Use the compound `name` field only when you want the full name widget (prefix/first/last/suffix). |

## Field Configuration Quick Reference

**Choice fields** (`supports_choices: true`): `select`, `radio`, `checkbox`, `multiselect`, `image_choice` — require `choices: [{text, value}]` array. **Multiselect values must be submitted as arrays** (`"input_1": ["Red", "Blue"]`), not comma-separated strings.

**Compound fields** (`has_inputs: true`): `name`, `address`, `time` — store values across sub-inputs with ID suffixes. Call `system-field-types` to see `default_inputs` for exact suffix mappings. **Name fields require `"nameFormat": "advanced"` and `"size": "large"`** — without these, sub-inputs render stacked instead of side-by-side.

**File upload fields**: `fileupload` — configure `allowedExtensions` (comma-separated, no dots), `maxFileSize` (MB), `maxFiles`, `multipleFiles`. These properties are NOT returned by `system-field-types` — see [references/field-config.md](references/field-config.md) for full type-specific config reference. File upload fields can be configured via abilities, but actual file submission requires the rendered form (MCP cannot transport binary data).

**Consent fields**: `consent` — GDPR-style checkbox with `checkboxLabel` (the agreement text next to the checkbox) and `description` (longer explanatory text below). Always set `isRequired: true` for GDPR compliance. See [references/field-config.md](references/field-config.md) for examples.

**Layout fields** (no data): `html`, `section`, `page` — visual only, do not collect submissions.

**Layout grid**: Control field width and row grouping with `layoutGridColumnSpan` (1–12, default full width) and `layoutGroupId` (any string — fields sharing the same value render on the same row). See [references/field-config.md](references/field-config.md) §Layout Grid for patterns and natural language mapping.

**Pricing fields**: `product`, `option`, `quantity`, `shipping`, `total`. Product variants (single product, dropdown, calculation, hidden, user-defined price) are set via `inputType` on a `product` field — never as standalone types (`singleproduct`, `calculation`, etc. are not valid `type` values and are excluded from `system-field-types`). Choice-based products submit `value|price` (e.g. `"input_2": "Pro|30"` for a $30.00 choice). See [references/field-config.md](references/field-config.md) §Pricing Fields for the full pattern table and submission formats.

**Type-specific properties**: Several field types accept configuration beyond what `system-field-types` reports — `number` (rangeMin/rangeMax/numberFormat), `date` (dateFormat/dateType), `phone` (phoneFormat), `text`/`textarea` (maxLength), `fileupload` (allowedExtensions/maxFileSize/maxFiles), `consent` (checkboxLabel/description). See [references/field-config.md](references/field-config.md) for the full reference.

For detailed field type tables, compound field suffix mappings, and form design patterns, see [references/field-config.md](references/field-config.md).

For entry search filters, input value formatting, and submission examples, see [references/entry-operations.md](references/entry-operations.md).

For conditional logic structure, operators, dependency maps, and CL modification patterns, see [references/conditional-logic.md](references/conditional-logic.md).
