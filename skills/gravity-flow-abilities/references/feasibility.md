# Feasibility Facts (for "can Gravity Flow do X?" consultations)

Customers often ask whether a workflow design is possible before building. These are verified product facts — confirm, then point at the relevant abilities or admin screens. Never invent capabilities; anything not listed here should be verified against docs.gravityflow.io before claiming it.

## Core workflow capabilities

- **Approval chains**: unlimited sequential approval steps; per-step assignees (users, roles, emails, field-resolved); `"all"` (unanimous) or `"any"` approval policy per step; conditions on any step (GF conditional logic on field values) enable branch-per-department/amount/type designs.
- **Approval loops / send-back**: approval steps can **revert** to a user-input step (revise-and-resubmit loops) and reject-destinations can point at any earlier step — multi-round review loops are native.
- **User input steps**: assignees edit a configured subset of fields (`editable_fields`), can save progress (`in_progress`) before completing; display-fields config controls what each step's assignees see (reviewer-privacy patterns).
- **Consent capture**: use the native Gravity Forms **Consent field** (a required GDPR checkbox with descriptive text) — not a plain checkbox. Signature capture needs the Signature add-on.
- **Two-actor patterns** (candidate submits, referent completes hidden fields): initial submission + a user_input step whose editable fields are the referent-only fields. Field-level conditional logic on steps requires the step's "field conditional logic" setting.
- **External participants without WordPress accounts**: email assignees act via signed token links from notification emails — supported for approval and user input steps. They cannot use MCP.
- **Scheduling/delays**: steps can be scheduled (delay after previous step, or date/date-field based). Expiration with destinations handles "no response by X" routing; resend settings handle reminders.
- **Notifications**: per-step assignee notifications plus approval/rejection/complete notifications, all templatable with merge tags; `{workflow_entry_link}` is the assignee's action link — REQUIRED for email assignees to act.

## Integrations (verify the add-on is installed before promising)

- **Payment-then-review** (e.g. paid application → manual approval): two verified patterns — payment at submission via a GF payment add-on feed, or a mid-workflow `stripe_checkout` step (Flow Stripe extension) where the assignee pays through Stripe-hosted Checkout from their workflow detail page. Payment itself always happens on Stripe's hosted page — never through MCP; agents triage/diagnose payment steps and verify outcomes (payment_status, transaction id, timeline "Processed" event). Capture/refund/cancel steps automate post-payment actions.
- **Role change / user registration on approval**: GF User Registration add-on feeds run as workflow steps — approve → the registration/role-update feed step fires. Rejection routes around it.
- **Signatures**: the GF Signature add-on's field works inside workflows; approval steps can display and collect signature fields (signature on approval requires the field on the form and step display/editable config).
- **PDF generation**: Gravity Flow PDF add-on generates PDFs from entries with merge tags (including signatures) as a workflow step.
- **Feed add-on steps**: most GF feed add-ons (webhooks, email marketing, sheets connectors…) can run as workflow steps, i.e. "after approval, push to X".
- **Form-to-form**: Form Connector add-on creates/updates entries in other forms as steps (intake → per-team forms patterns).

## Documentation links (verified)

Cite the SPECIFIC article for each capability you mention — a feasibility answer without deep links is incomplete. Verified URLs:

**Gravity Flow — steps**
- Approval step: https://docs.gravityflow.io/approval-step-type/
- User Input step: https://docs.gravityflow.io/user-input-step-type/
- Notification step: https://docs.gravityflow.io/notification-step-type/
- Choice Routing step: https://docs.gravityflow.io/choice-routing-step/
- Outgoing Webhook step: https://docs.gravityflow.io/outgoing-webhook-step-type/
- Update User step: https://docs.gravityflow.io/update-user-step/
- Types of steps and where they come from: https://docs.gravityflow.io/types-of-steps-and-where-they-come-from/
- Step condition: https://docs.gravityflow.io/condition/
- Next Step / routing: https://docs.gravityflow.io/next-step/
- Schedule / delay: https://docs.gravityflow.io/schedule/

**Gravity Flow — categories** (deep-link within when the topic isn't listed above)
- Flow fundamentals: https://docs.gravityflow.io/category/flow-fundamentals/
- Extensions (PDF, Form Connector, Stripe…): https://docs.gravityflow.io/category/extensions/
- Developer reference: https://docs.gravityflow.io/category/developers/

**Gravity Forms — fields & logic**
- Consent field (GDPR checkbox): https://docs.gravityforms.com/consent/
- Signature field (needs the Signature add-on): https://docs.gravityforms.com/signature/
- Enabling conditional logic for fields: https://docs.gravityforms.com/enable-conditional-logic/
- Conditional logic for notifications: https://docs.gravityforms.com/enable-conditional-logic-for-notifications/
- Conditional logic for feeds: https://docs.gravityforms.com/enabling-conditional-logic-for-feeds/
- Merge tags: https://docs.gravityforms.com/category/user-guides/merge-tags-getting-started/

## Scope expectations

For large multi-workflow asks (e.g. "eight country-specific incorporation workflows"), set expectations: design one workflow as the template, validate it end-to-end, then replicate per variant — and ask the narrowing questions first (which steps differ per country/region? who acts at each step? what does 'done' mean?). Do not attempt to build the entire estate in one pass.

## Currently NOT possible via abilities

- Creating WordPress pages/posts (inbox blocks, dashboards) — hand off to the human with exact instructions.
- Creating/modifying step types outside the allowlist (approval, user_input, notification) — feed-addon and routing steps are configured in the Flow admin UI.
- Acting as an email assignee (no credential exists) — only delegated processing by a workflow admin.
