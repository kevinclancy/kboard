# Claude Development Guidelines for KBoard

This file contains development preferences and guidelines for working on the KBoard project.

## Code Documentation

### Comment Philosophy
- Prefer interface comments and data structure comments over action comments
- Comment record fields and union variants to explain their purpose
- Avoid redundant action comments that simply restate what the code does
- Good comments explain "why" and "what" (for complex data), not "how"
- If function names and documentation clearly explain the action, additional comments are unnecessary

Examples:
```typescript
// Good: Interface/data structure comment
/// [reply_id, reply_body_text, reply_status] - the ID, text, and status of the reply being responded to
reply_to: [number, string, number] | null;

// Avoid: Redundant action comment
// Find the thread by ID
let thread = findThreadById(threadId);

// Good: Non-obvious information
// Calculate page using 0-based indexing to match backend API
let page_number = replies_before / query.page_size;
```

### Tuple Type Comments
- Use triple-slash comments (`///`) for VS Code IntelliSense support
- Place comments on the line above the field
- For tuple types, use format: `/// [component1, component2] - description`
- Avoid redundant text like "Tuple containing" since the type definition makes it clear

Example:
```typescript
/// [reply_id, reply_body_text] - the ID and text of the reply being responded to
reply_to: [number, string] | null;
```

## Type Design Patterns

### Discriminated Unions
- Prefer discriminated union types over separate boolean/nullable state variables
- Use discriminated unions to make illegal states unrepresentable
- This prevents invalid state combinations and improves type safety

Example:
```typescript
// Preferred: Discriminated union
type ReplyEditorState =
  | { type: "closed" }
  | { type: "new_reply"; replyToId?: number }
  | { type: "editing_reply"; replyId: number };

// Avoid: Separate state variables that can create invalid combinations
const [showEditor, setShowEditor] = useState(false);
const [editingId, setEditingId] = useState<number | null>(null);
const [replyToId, setReplyToId] = useState<number | null>(null);
```

### Strong Preconditions for Helper Functions
- Write helper functions with demanding preconditions that assume non-null values
- This makes calling code more readable by avoiding repetitive null checks
- Use clear function names that indicate the precondition requirements

Example:
```typescript
// Preferred: Strong precondition - assumes reply.reply_to is non-null
const getReplyToStatus = (reply: Reply): number => reply.reply_to![2];
const isReplyToHidden = (reply: Reply): boolean => reply.reply_to![2] === 2;

// Usage: Caller handles null check once, then uses demanding functions
if (reply.reply_to) {
  const isHidden = isReplyToHidden(reply);
  const status = getReplyToStatus(reply);
}

// Avoid: Defensive functions that repeat null checks
const isReplyToHidden = (reply: Reply): boolean => reply.reply_to && reply.reply_to[2] === 2;
```

## General Principles

- Prioritize type safety and clear state management
- Use meaningful variable and type names
- Document complex data structures with appropriate comments