# Field Configuration Reference

## Compound Field Sub-Input Mappings

Compound fields store data across multiple sub-inputs. Each sub-input ID is `{field_id}{suffix}`.

### Name Field (`type: name`)

| Suffix | Label | Visible by Default |
|---|---|---|
| `.2` | Prefix | No |
| `.3` | First | Yes |
| `.4` | Middle | No |
| `.6` | Last | Yes |
| `.8` | Suffix | No |

**Required layout properties:**

| Property | Value | Purpose |
|---|---|---|
| `nameFormat` | `"advanced"` | **Required.** Controls sub-input layout. `"advanced"` = First/Last side-by-side (standard behavior). Without this, sub-inputs render stacked. |
| `size` | `"large"` | Sets field width. The UI editor sets this by default. |

⚠️ **If you omit `nameFormat`, the name field renders with First and Last stacked vertically instead of side-by-side.** The form editor UI auto-upgrades fields to `"advanced"` on open, but API-created fields without this property will render incorrectly until manually edited.

Submission example (field ID 5): `{ "input_5.3": "John", "input_5.6": "Doe" }`

### Address Field (`type: address`)

| Suffix | Label |
|---|---|
| `.1` | Street Address |
| `.2` | Address Line 2 |
| `.3` | City |
| `.4` | State / Province |
| `.5` | ZIP / Postal Code |
| `.6` | Country |

Submission example (field ID 3): `{ "input_3.1": "123 Main St", "input_3.3": "Springfield", "input_3.4": "IL", "input_3.5": "62701", "input_3.6": "United States" }`

### Time Field (`type: time`)

| Suffix | Label |
|---|---|
| `.1` | Hour |
| `.2` | Minute |
| `.3` | AM/PM |

Submission example (field ID 7): `{ "input_7.1": "2", "input_7.2": "30", "input_7.3": "pm" }`

## Choice Field Configuration

Fields with `supports_choices: true` require a `choices` array of `{text, value}` objects:

```json
{
  "type": "select",
  "label": "Favorite Color",
  "choices": [
    { "text": "Red", "value": "red" },
    { "text": "Blue", "value": "blue" },
    { "text": "Green", "value": "green" }
  ]
}
```

Choice field types: `select`, `radio`, `checkbox`, `multiselect`, `image_choice`

## Common Field Types

| Type | Label | Choices | Compound | Key Capabilities |
|---|---|---|---|---|
| `text` | Single Line Text | No | No | placeholder, default value, conditional logic |
| `textarea` | Paragraph Text | No | No | conditional logic |
| `email` | Email | No | No | validates email format, conditional logic |
| `phone` | Phone | No | No | format validation, conditional logic |
| `number` | Number | No | No | range options, conditional logic |
| `date` | Date | No | No | date picker with format options |
| `select` | Drop Down | **Yes** | No | single selection, conditional logic |
| `radio` | Radio Buttons | **Yes** | No | single selection, conditional logic |
| `checkbox` | Checkboxes | **Yes** | No | multiple selection, conditional logic |
| `multiselect` | Multi Select | **Yes** | No | multiple selection, conditional logic, **pass values as array on submission** |
| `name` | Name | No | **Yes** | prefix/first/middle/last/suffix sub-inputs |
| `address` | Address | No | **Yes** | street/city/state/zip/country sub-inputs |
| `time` | Time | No | **Yes** | hour/minute/AM-PM sub-inputs |
| `hidden` | Hidden | No | No | not visible, good for tracking data |
| `website` | Website | No | No | URL validation, conditional logic |
| `fileupload` | File Upload | No | No | `allowedExtensions`, `maxFileSize`, `maxFiles` — see Type-Specific Config |
| `consent` | Consent | No | No | yes/no checkbox with description |
| `html` | HTML | No | No | display-only, no data collected |
| `section` | Section | No | No | visual separator, no data collected |
| `page` | Page | No | No | multi-page break, no data collected |

Note: Always call `system-field-types` for the authoritative, up-to-date list — add-ons may register additional types.

## Pricing Fields (`product`, `option`, `quantity`, `shipping`, `total`)

Pricing variants are NOT standalone field types. `system-field-types` intentionally omits `singleproduct`, `hiddenproduct`, `calculation`, `price`, `donation`, and `singleshipping` — those are **`inputType` values on a `product` (or `shipping`) field**, matching the editor's "Field Type" dropdown. Never pass them as `type`.

| What you want | Field config |
|---|---|
| Fixed-price product | `{ "type": "product", "label": "Widget", "inputType": "singleproduct", "basePrice": "$25.00" }` |
| Product chosen from a list | `{ "type": "product", "inputType": "select", "choices": [{ "text": "Pro", "value": "Pro", "price": "$30.00" }] }` (also `radio`) |
| User-defined price | `{ "type": "product", "inputType": "price" }` |
| Hidden product | `{ "type": "product", "inputType": "hiddenproduct", "basePrice": "$9.00" }` |
| Calculated price | `{ "type": "product", "inputType": "calculation", "calculationFormula": "{Qty:3} * 2" }` |
| Quantity for a product | `{ "type": "quantity", "label": "Qty", "productField": 1 }` (`productField` = the product field's ID) |
| Flat shipping | `{ "type": "shipping", "inputType": "singleshipping", "basePrice": "$5.00" }` |
| Shipping options | `{ "type": "shipping", "inputType": "select", "choices": [{ "text": "Ground", "value": "Ground", "price": "$5.00" }] }` |
| Order total | `{ "type": "total", "label": "Total" }` |

The API applies the same defaults the editor would: bare `type: product` becomes `inputType: singleproduct`; single/hidden/calculation products get their `.1` (name) / `.2` (price) / `.3` (quantity) sub-inputs created automatically; choice-based product and shipping fields get `enablePrice` set (required — without it, priced submissions fail GF's anti-tampering state validation).

**Submitting pricing fields:**

- Single product: `"input_1.1": "Widget"`, `"input_1.2": "$25.00"`, and `"input_1.3": "2"` for quantity (or use a separate quantity field: `"input_3": "2"`).
- Choice-based product/shipping: submit `value|price` with the price as a plain number matching the choice — e.g. `"input_2": "Pro|30"` for a `$30.00` choice. The wrong price (or omitting `|price`) fails validation as a tampered submission.
- Total fields are computed server-side — never submit a value for them.

## Type-Specific Configuration

`system-field-types` returns generic capability flags but does **not** expose type-specific properties. The following properties are accepted by `forms-create` and `forms-update` — pass them directly on the field object.

### Name (`type: name`)

| Property | Type | Description |
|---|---|---|
| `nameFormat` | string | **Required.** `"advanced"` = First/Last/Prefix/Middle/Suffix side-by-side (standard behavior). `"simple"` = single text input. Omitting this or using `"standard"` renders sub-inputs stacked vertically — incorrect for most use cases. |
| `size` | string | `"large"` (default in UI), `"medium"`, or `"small"`. Controls field width in form layout. |

Example — standard name field with First and Last side-by-side:
```json
{
  "type": "name",
  "label": "Full Name",
  "isRequired": true,
  "nameFormat": "advanced",
  "size": "large",
  "inputs": [
    { "id": "1.2", "label": "Prefix", "isHidden": true },
    { "id": "1.3", "label": "First" },
    { "id": "1.4", "label": "Middle", "isHidden": true },
    { "id": "1.6", "label": "Last" },
    { "id": "1.8", "label": "Suffix", "isHidden": true }
  ]
}
```

**Note:** The `inputs` array is optional on creation — GFAPI populates default inputs for name fields. But if you need to control visibility (e.g., show Middle name), include the full array with `isHidden` flags.

### File Upload (`type: fileupload`)

| Property | Type | Description |
|---|---|---|
| `allowedExtensions` | string | Comma-separated list of allowed file extensions (no dots). Example: `"pdf,doc,docx"` |
| `maxFileSize` | integer | Maximum file size in megabytes. Example: `5` = 5MB |
| `maxFiles` | integer | Maximum number of files when multi-file upload is enabled. Omit or `0` for single-file mode. |
| `multipleFiles` | boolean | Enable multi-file upload. When `true`, users can upload multiple files up to `maxFiles`. |

Example — PDF/Word only, 5MB max, single file:
```json
{
  "type": "fileupload",
  "label": "Resume",
  "isRequired": true,
  "description": "Upload your resume (PDF or Word, max 5MB)",
  "allowedExtensions": "pdf,doc,docx",
  "maxFileSize": 5
}
```

Example — multi-file with limit:
```json
{
  "type": "fileupload",
  "label": "Supporting Documents",
  "multipleFiles": true,
  "maxFiles": 3,
  "allowedExtensions": "pdf,jpg,png",
  "maxFileSize": 10
}
```

**Note:** File upload fields can be *configured* through abilities, but actual file uploads cannot be submitted via `submissions-submit` — the MCP transport does not support binary payloads. Files must be uploaded through the rendered form.

### Number (`type: number`)

| Property | Type | Description |
|---|---|---|
| `numberFormat` | string | `"decimal_dot"` (1,234.56), `"decimal_comma"` (1.234,56), or `"currency"` |
| `rangeMin` | number | Minimum allowed value |
| `rangeMax` | number | Maximum allowed value |

### Date (`type: date`)

| Property | Type | Description |
|---|---|---|
| `dateType` | string | `"datepicker"` (calendar popup) or `"datefield"` (manual entry) or `"datedropdown"` (dropdowns) |
| `dateFormat` | string | `"mdy"`, `"dmy"`, or `"ymd"` |
| `calendarIconType` | string | `"none"`, `"calendar"`, or `"custom"` |

### Phone (`type: phone`)

| Property | Type | Description |
|---|---|---|
| `phoneFormat` | string | `"standard"` (US: (###) ###-####) or `"international"` (free-form) |

### Consent (`type: consent`)

| Property | Type | Description |
|---|---|---|
| `checkboxLabel` | string | Text displayed next to the checkbox (the consent statement the user agrees to). Example: `"I consent to having this website store my submitted information."` |
| `description` | string | Longer explanatory text displayed below the checkbox. Example: `"We will only use your personal data to respond to your enquiry. See our Privacy Policy for details."` |

Example — GDPR consent checkbox:
```json
{
  "type": "consent",
  "label": "GDPR Consent",
  "isRequired": true,
  "checkboxLabel": "I consent to having this website store my submitted information so they can respond to my inquiry.",
  "description": "We will only use your personal data to respond to your enquiry. See our Privacy Policy for details."
}
```

**Note:** `checkboxLabel` and `description` persist through GFAPI but are not exposed by `system-field-types` — the agent skill's field-config reference is the only source for these properties.

### Text / Paragraph (`type: text`, `type: textarea`)

| Property | Type | Description |
|---|---|---|
| `maxLength` | integer | Maximum character count |

### Multiselect (`type: multiselect`)

| Property | Type | Description |
|---|---|---|
| `storageType` | string | **Auto-set by abilities layer.** `"json"` stores values as a JSON array, preventing data loss when choice values contain commas. The abilities `forms-create` handler sets this automatically. |

**Submission format:** Pass multiselect values as an **array**, not a comma-separated string:

```json
{
  "input_values": {
    "input_1": ["Atlanta, GA", "New York, NY"]
  }
}
```

⚠️ **Never pass multiselect values as a comma-separated string** (e.g., `"Atlanta, GA,New York, NY"`). Values containing commas become ambiguous and cause data loss on round-trip.

**Searching multiselect entries:** Use the `contains` operator to find entries with a specific selected value:
```json
{
  "field_filters": [{ "key": "1", "operator": "contains", "value": "Atlanta, GA" }]
}
```
The `is` operator does not work for individual multiselect values — it matches the entire stored string.

## Form Design Patterns

### Contact Form

```json
{
  "title": "Contact Us",
  "fields": [
    { "type": "name", "label": "Your Name", "isRequired": true, "nameFormat": "advanced", "size": "large" },
    { "type": "email", "label": "Email Address", "isRequired": true },
    { "type": "phone", "label": "Phone Number" },
    { "type": "select", "label": "Subject", "choices": [
      { "text": "General Inquiry", "value": "general" },
      { "text": "Support", "value": "support" },
      { "text": "Sales", "value": "sales" }
    ]},
    { "type": "textarea", "label": "Message", "isRequired": true }
  ]
}
```

### Registration Form

```json
{
  "title": "Event Registration",
  "fields": [
    { "type": "name", "label": "Full Name", "isRequired": true, "nameFormat": "advanced", "size": "large" },
    { "type": "email", "label": "Email", "isRequired": true },
    { "type": "phone", "label": "Phone", "isRequired": true },
    { "type": "address", "label": "Address" },
    { "type": "radio", "label": "Attendance", "isRequired": true, "choices": [
      { "text": "In Person", "value": "in-person" },
      { "text": "Virtual", "value": "virtual" }
    ]},
    { "type": "textarea", "label": "Special Requests" }
  ]
}
```

### Feedback / Survey Form

```json
{
  "title": "Customer Feedback",
  "fields": [
    { "type": "radio", "label": "How satisfied are you?", "isRequired": true, "choices": [
      { "text": "Very Satisfied", "value": "5" },
      { "text": "Satisfied", "value": "4" },
      { "text": "Neutral", "value": "3" },
      { "text": "Dissatisfied", "value": "2" },
      { "text": "Very Dissatisfied", "value": "1" }
    ]},
    { "type": "textarea", "label": "Additional Comments" },
    { "type": "hidden", "label": "Source", "defaultValue": "website" }
  ]
}
```

## Layout Grid

Fields default to full-width (12 columns). To place fields side-by-side, give them the same `layoutGroupId` and set `layoutGridColumnSpan` to control width.

**NEVER use Ready Classes.** Gravity Forms' legacy CSS helper classes (`gf_left_half`, `gf_right_half`, `gf_left_third`, `gf_middle_third`, `gf_right_third`, `gf_first_quarter`…`gf_fourth_quarter`, `gf_inline`, `gf_list_*`) are deprecated since GF 2.5 and do nothing in modern themes. The abilities API strips them from `cssClass` automatically and returns a `stripped_ready_classes` list plus a `notice` when it does. The layout grid is the only supported way to control field layout.

### Properties

| Property | Type | Description |
|---|---|---|
| `layoutGroupId` | string | Row group identifier. Fields sharing the same value render on the same row. Use readable names — the server normalizes to internal format. |
| `layoutGridColumnSpan` | integer (1–12) | Number of grid columns the field spans. Default is 12 (full width). |

### Common Span Patterns

| Layout | Spans | Example |
|---|---|---|
| Two equal columns | `6 + 6` | First name / Last name |
| Three equal columns | `4 + 4 + 4` | City / State / Zip |
| Four equal columns | `3 + 3 + 3 + 3` | Quarter-width fields |
| Two-thirds / one-third | `8 + 4` | Address / Apt number |
| Three-quarters / one-quarter | `9 + 3` | Description / Priority |

### Natural Language Mapping

When users describe layout in natural language, map to these properties:

| User says | Agent does |
|---|---|
| "side by side" / "next to each other" / "on the same row" | Same `layoutGroupId`, span `6` each |
| "three across" / "three columns" | Same `layoutGroupId`, span `4` each |
| "four across" / "four columns" | Same `layoutGroupId`, span `3` each |
| "full width" / "its own row" / "takes the whole row" | No `layoutGroupId`, span `12` or omit both |
| "make X narrower" / "small field" | Reduce span (e.g. `3` or `4`), group with adjacent field |
| "two-thirds / one-third split" | Spans `8` + `4` in same group |
| "three-quarters / one-quarter" | Spans `9` + `3` in same group |
| "equal width" | Same span for all fields in the group |
| "compact layout" / "space-efficient" | Group related fields into rows of 2–3 |

### Examples

**Two fields side-by-side (half-width each):**

```json
{
  "fields": [
    { "type": "text", "label": "First Name", "layoutGroupId": "name-row", "layoutGridColumnSpan": 6 },
    { "type": "text", "label": "Last Name", "layoutGroupId": "name-row", "layoutGridColumnSpan": 6 }
  ]
}
```

**Three fields in a row:**

```json
{
  "fields": [
    { "type": "text", "label": "City", "layoutGroupId": "location", "layoutGridColumnSpan": 4 },
    { "type": "select", "label": "State", "layoutGroupId": "location", "layoutGridColumnSpan": 4, "choices": [{"text": "CA", "value": "CA"}] },
    { "type": "text", "label": "Zip", "layoutGroupId": "location", "layoutGridColumnSpan": 4 }
  ]
}
```

**Mixed layout — two-thirds / one-third:**

```json
{
  "fields": [
    { "type": "text", "label": "Street Address", "layoutGroupId": "addr", "layoutGridColumnSpan": 8 },
    { "type": "text", "label": "Apt/Suite", "layoutGroupId": "addr", "layoutGridColumnSpan": 4 }
  ]
}
```

### Notes

- Spans in a row don't need to sum to exactly 12 — the CSS grid wraps naturally.
- Fields without `layoutGroupId` render on their own row at full width.
- The server normalizes `layoutGroupId` to internal format; always use readable names like `"row1"`, `"contact-info"`, etc.
