# Conditional Logic Reference

## Overview

Conditional logic (CL) controls visibility and behavior of form elements based on field values. CL can be applied to fields, notifications, confirmations, the submit button, and page navigation buttons.

Use `forms-analyze-logic` to get a structured analysis rather than parsing raw CL from `forms-get`.

## CL Structure

Every CL block follows this structure:

```json
{
  "enabled": true,
  "actionType": "show",
  "logicType": "all",
  "rules": [
    {
      "fieldId": "1",
      "operator": "is",
      "value": "Yes"
    }
  ]
}
```

| Property | Values | Meaning |
|---|---|---|
| `enabled` | `true` / `false` | Whether this CL is active |
| `actionType` | `"show"` / `"hide"` | What happens when rules match |
| `logicType` | `"all"` / `"any"` | ALL rules must match vs ANY rule |
| `rules[]` | array | Conditions that drive the action |

## Rule Operators

| Operator | Meaning | Works With |
|---|---|---|
| `is` | Exact match | All field types |
| `isnot` | Not equal | All field types |
| `contains` | Substring match | Text, textarea, email |
| `>` | Greater than | Number, date |
| `<` | Less than | Number, date |
| `>=` | Greater or equal | Number, date |
| `<=` | Less or equal | Number, date |

## Where CL Appears

| Location | Path in Form Data | Effect |
|---|---|---|
| **Fields** | `field.conditionalLogic` | Show/hide the field |
| **Notifications** | `notification.conditionalLogic` | Send/don't send the notification |
| **Confirmations** | `confirmation.conditionalLogic` | Select which confirmation to display |
| **Submit button** | `form.button.conditionalLogic` | Show/hide the submit button |
| **Page buttons** | `field.nextButton.conditionalLogic` (page fields only) | Show/hide the Next button on multi-page forms |

## forms-analyze-logic Output

The ability returns:

```json
{
  "form_id": 41,
  "form_title": "My Form",
  "summary": {
    "total_rules": 5,
    "fields_with_logic": 2,
    "notifications_with_logic": 1,
    "confirmations_with_logic": 0,
    "has_submit_button_logic": false,
    "has_page_button_logic": false
  },
  "field_logic": [
    {
      "field_id": 3,
      "field_label": "Comments",
      "field_type": "textarea",
      "action": "show",
      "logic_type": "all",
      "rules": [
        {
          "source_field_id": "1",
          "source_field_label": "Want to leave feedback?",
          "operator": "is",
          "value": "Yes"
        }
      ]
    }
  ],
  "notification_logic": [],
  "confirmation_logic": [],
  "submit_button_logic": null,
  "page_logic": [],
  "dependency_map": {
    "1": {
      "label": "Want to leave feedback?",
      "controls": [
        {
          "target_type": "field",
          "target_id": 3,
          "target_label": "Comments",
          "effect": "show",
          "logic_type": "all"
        }
      ]
    }
  }
}
```

### Key Sections

- **`summary`** — Quick counts. Check this first to decide if deeper analysis is needed.
- **`field_logic`** — Each field with CL, its action, and rules with resolved labels.
- **`notification_logic`** / **`confirmation_logic`** — Same structure for notifications and confirmations.
- **`submit_button_logic`** — `null` if no CL on submit button, otherwise `{action, logic_type, rules}`.
- **`page_logic`** — Array of page button CL (multi-page forms only).
- **`dependency_map`** — **Most useful view.** Keyed by source field ID, shows everything that field controls. Use this to answer "what happens when field X changes?"

## Workflow: Auditing Form Logic

1. Call `forms-analyze-logic` with the form ID
2. Check `summary` for a quick overview
3. Read `dependency_map` to understand which fields are "driver" fields
4. Review specific `field_logic` / `notification_logic` entries for rule details

## Workflow: Adding CL to a Field via forms-update

CL is set as a property on individual fields during `forms-update`:

1. Call `forms-get` to retrieve current form
2. Add `conditionalLogic` to the target field in the fields array:
   ```json
   {
     "id": 3,
     "type": "textarea",
     "label": "Comments",
     "conditionalLogic": {
       "actionType": "show",
       "logicType": "all",
       "rules": [
         { "fieldId": "1", "operator": "is", "value": "Yes" }
       ]
     }
   }
   ```
3. Call `forms-update` with the complete fields array
4. Call `forms-analyze-logic` to verify the logic was applied correctly

**Important:** `fieldId` in rules is a string, not an integer. Always quote it.

## Common Patterns

### Show field when another field has a specific value

```json
{
  "actionType": "show",
  "logicType": "all",
  "rules": [{ "fieldId": "2", "operator": "is", "value": "Other" }]
}
```

### Hide field when multiple conditions are met

```json
{
  "actionType": "hide",
  "logicType": "all",
  "rules": [
    { "fieldId": "1", "operator": "is", "value": "No" },
    { "fieldId": "5", "operator": "is", "value": "" }
  ]
}
```

### Send notification only for specific selections

Set on the notification object (via `forms-update` on the `notifications` property):

```json
{
  "conditionalLogic": {
    "actionType": "show",
    "logicType": "any",
    "rules": [
      { "fieldId": "4", "operator": "is", "value": "urgent" },
      { "fieldId": "4", "operator": "is", "value": "critical" }
    ]
  }
}
```

Note: For notifications, `actionType: "show"` means "send this notification when rules match."

## Pitfalls

| Mistake | Consequence | Prevention |
|---|---|---|
| Using integer `fieldId` in rules | CL may not evaluate correctly | Always use string: `"fieldId": "1"` not `"fieldId": 1` |
| Setting CL on a field that references itself | Circular dependency | CL rules should reference OTHER fields |
| Forgetting `forms-get` before `forms-update` | `fields` replaces all — CL on other fields lost | Always retrieve → modify → update |
| Not checking `forms-analyze-logic` after changes | Logic may not work as expected | Verify after every CL modification |
| Confusing notification `"show"` with field `"show"` | Notification `"show"` = "send when matched" | Read context: field=visibility, notification=delivery |
